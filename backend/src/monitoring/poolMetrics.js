import {performance} from 'node:perf_hooks';
import {queryVolume} from './queryVolume.js';

// Fixed pool names only. No connection strings, claims, SQL or bind values are retained.
const pools = new Map();
const observed = new WeakSet();
export function observePool(pool, name, volume = queryVolume) {
    if (observed.has(pool)) return pool;
    if (!['application', 'identity'].includes(name)) throw new Error('Unknown pool metric');
    observed.add(pool);
    const metric = {acquisitions: 0, failures: 0, waitMilliseconds: 0};
    pools.set(name, {pool, metric});
    const clients = new WeakSet();
    function instrument(client) {
        if (!client || clients.has(client)) return;
        clients.add(client);
        const query = client.query;
        client.query = function (...args) {
            // Streaming/Query objects keep their original event/return contract.
            if (typeof args[0] !== 'string' && typeof args[0]?.text !== 'string') return query.apply(this, args);
            const start = performance.now();
            let finished = false;
            const finish = (error, result) => { if (finished) return; finished = true; volume.record(args[0], result, performance.now() - start, Boolean(error)); };
            const callback = typeof args.at(-1) === 'function' ? args.at(-1) : null;
            if (callback) {
                args[args.length - 1] = function (error, result) { finish(error, result); return callback.apply(this, arguments); };
            }
            try {
                const result = query.apply(this, args);
                if (callback || !result?.then) return result;
                return result.then(value => { finish(null, value); return value; }, error => { finish(error); throw error; });
            } catch (error) { finish(error); throw error; }
        };
    }
    const connect = pool.connect;
    pool.connect = function (...args) {
        const start = performance.now();
        const finish = (error, client) => {
            metric.acquisitions++; metric.failures += Number(Boolean(error));
            metric.waitMilliseconds += Math.max(0, performance.now() - start);
            instrument(client);
        };
        const callback = typeof args[0] === 'function' ? args[0] : null;
        if (callback) args[0] = function (error, client, release) { finish(error, client); return callback.call(this, error, client, release); };
        try {
            const result = connect.apply(this, args);
            if (callback) return result;
            return result.then(client => { finish(null, client); return client; }, error => { finish(error); throw error; });
        } catch (error) { finish(error); throw error; }
    };
    return pool;
}
export function poolSnapshot() {
    return [...pools].map(([name, {pool, metric}]) => ({name, ...metric,
        total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount}));
}
