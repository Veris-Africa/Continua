export class UpstashCache {
    url;
    token;
    namespace;
    fallback;
    pending = new Map();
    metrics = { hits: 0, misses: 0, failures: 0, sharedReads: 0, producers: 0, oversized: 0 };
    constructor(url, token, namespace, fallback) {
        this.url = url;
        this.token = token;
        this.namespace = namespace;
        this.fallback = fallback;
        const endpoint = new URL(url);
        if (endpoint.protocol !== 'https:' || !endpoint.hostname.endsWith('.upstash.io') || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || !token || !/^[a-zA-Z0-9:_-]{1,80}$/.test(namespace))
            throw new Error('Invalid Upstash cache configuration');
    }
    async command(parts) {
        const response = await fetch(this.url, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(1500), headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(parts) });
        if (!response.ok)
            throw new Error('Cache request failed');
        const data = await response.json();
        if (data.error)
            throw new Error('Cache command failed');
        return data.result;
    }
    async rateLimitCommand(parts) {
        // Unlike ordinary cache misses, limiter failures must propagate.
        return this.command(parts);
    }
    async get(key) {
        try {
            const raw = await this.command(['GET', `${this.namespace}:cache:v2:${key}`]);
            if (raw == null) {
                this.metrics.misses++;
                return null;
            }
            if (typeof raw !== 'string' || Buffer.byteLength(raw) > 1024 * 1024)
                throw new Error('Invalid cache value');
            const result = JSON.parse(raw);
            this.metrics.hits++;
            return result;
        }
        catch {
            this.metrics.failures++;
            return this.fallback.get(key);
        }
    }
    async set(key, value, ttlMs = 60000) {
        const encoded = JSON.stringify(value);
        if (encoded === undefined || Buffer.byteLength(encoded) > 1024 * 1024) {
            this.metrics.oversized++;
            // Remove an older value rather than leave it authoritative after ingestion.
            await this.del(key);
            return;
        }
        if (!Number.isFinite(ttlMs) || ttlMs <= 0) throw new Error('Invalid cache TTL');
        ttlMs = Math.min(ttlMs, 24 * 60 * 60_000);
        await this.fallback.set(key, value, ttlMs);
        try {
            await this.command(['SET', `${this.namespace}:cache:v2:${key}`, encoded, 'PX', Math.max(1, Math.floor(ttlMs))]);
        }
        catch {
            this.metrics.failures++;
        }
    }
    async del(key) { await this.fallback.del(key); try {
        await this.command(['DEL', `${this.namespace}:cache:v2:${key}`]);
    }
    catch {
        this.metrics.failures++;
    } }
    async getOrSet(key, ttlMs, fn) {
        const existing = this.pending.get(key);
        if (existing) {
            this.metrics.sharedReads++;
            return existing;
        }
        // Share the cache lookup as well as the producer: simultaneous misses
        // must not fan out into repeated Redis HTTP requests during startup.
        const job = Promise.resolve().then(async () => {
            const cached = await this.get(key);
            if (cached !== null) return cached;
            this.metrics.producers++;
            const value = await fn();
            await this.set(key, value, ttlMs);
            return value;
        });
        this.pending.set(key, job);
        try {
            return await job;
        }
        finally {
            this.pending.delete(key);
        }
    }
}
