import { monitorEventLoopDelay, performance } from 'node:perf_hooks';
import { pool } from '../storage/db.js';
import { logger } from './logger.js';
import {metrics as requestMetrics} from './observability.js';
import {evaluateSignals,createAlertTransitions} from './alertPolicy.js';
import {env} from '../config/index.js';
/** Private structured measurements: distinguish CPU stalls, memory pressure and
 * database pool congestion before deciding which service/language to replace.
 * No document, user, connection-string or payment payload is logged.
 */
export function startRuntimeDiagnostics() {
    let alertState={};
    const transitions=createAlertTransitions({load:async()=>alertState,save:async value=>{alertState=value;},notify:async signal=>logger.warn({component:'operational-alert',...signal},'Operational alert transition')});
    const delay = monitorEventLoopDelay({ resolution: 20 });
    delay.enable();
    let previous = performance.eventLoopUtilization();
    const timer = setInterval(() => {
        const utilization = performance.eventLoopUtilization(previous);
        previous = performance.eventLoopUtilization();
        const memory = process.memoryUsage();
        const metrics = { eventLoopP99Ms: Math.round(delay.percentile(99) / 1e6), eventLoopUtilization: utilization.utilization,
            rssMB: Math.round(memory.rss / 1048576), heapUsedMB: Math.round(memory.heapUsed / 1048576),
            databaseConnections: pool.totalCount, databaseIdle: pool.idleCount, databaseWaiting: pool.waitingCount };
        if (metrics.eventLoopP99Ms > 200 || metrics.databaseWaiting > 0)
            logger.warn(metrics, 'Runtime pressure');
        else
            logger.info(metrics, 'Runtime diagnostics');
        delay.reset();
        // Reuse this existing timer; no SQL, network exporter or new schedule.
        void transitions(evaluateSignals({requests:requestMetrics.snapshot(),payments:{enabled:env.PAYMENT_DURABILITY_ENABLED===true}})).catch(()=>logger.warn({component:'operational-alert',category:'status_unavailable'},'Operational evaluation unavailable'));
    }, 60000);
    timer.unref();
    return () => { clearInterval(timer); delay.disable(); };
}
