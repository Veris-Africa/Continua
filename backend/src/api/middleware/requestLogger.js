import { logger } from "../../monitoring/logger.js";
import {requestContext,safeRequestId,metrics} from '../../monitoring/observability.js';
import {releaseInfo} from '../../release.js';
import {performance} from 'node:perf_hooks';
// Fixed categories before route matching also cover rejected auth/data requests.
// Never log raw URLs, OAuth paths, query strings, bodies or user identifiers.
export function requestCategory(path) {
    const group = /^\/api\/v1\/(identity|data|functions|internal|admin|billing|engine|market|markets|stocks|securities|quotes|news|health|financials|companies|indices|instruments|historical|movers|research|sectors|statistics|price-history|valuation|backtest)(?:\/|$)/.exec(path)?.[1];
    return group ? `/api/v1/${group}/*` : 'other';
}
export function requestLogger(req, res, next) {
    const start = performance.now();
    const category = requestCategory(req.path);
    const candidate = req.get('X-Request-ID');
    const requestId = safeRequestId(candidate);
    const context={requestId,route:category,dependencies:{}};
    const temperature=process.uptime()<60?'startup':'warm';
    res.setHeader('X-Request-ID', requestId);
    let bytes = 0;
    const write = res.write, end = res.end;
    const size = (chunk, encoding) => chunk == null || typeof chunk === 'function' ? 0 : typeof chunk === 'string' ? Buffer.byteLength(chunk, typeof encoding === 'string' ? encoding : undefined) : chunk.byteLength ?? 0;
    res.write = function (chunk, encoding, callback) { bytes += size(chunk, encoding); return write.apply(this, arguments); };
    res.end = function (chunk, encoding, callback) { bytes += size(chunk, encoding); return end.apply(this, arguments); };
    let finished=false;
    const finish=()=>{
        if(finished)return;finished=true;
        const ms=performance.now()-start,status=res.writableFinished?res.statusCode:499;
        const method=['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS'].includes(req.method)?req.method:'OTHER';
        const requestBytes=Number(req.headers?.['content-length'])||0;
        metrics.record(`request:${category}:${method}:${temperature}`,ms,{failed:status>=500,timeout:status===504||(status>=500&&Object.values(context.dependencies).some(value=>value.timeouts>0)),requestBytes,responseBytes:bytes});
        logger.info({requestId,method,route:category,status,ms,responseBytes:bytes,declaredRequestBytes:requestBytes,
            temperature,revision:releaseInfo().revision,dependencies:context.dependencies},'request');
    };
    res.once('finish',finish);res.once('close',finish);
    requestContext.run(context,next);
}
