import { logger } from "../../monitoring/logger.js";
import {randomUUID} from 'node:crypto';
import {performance} from 'node:perf_hooks';
// Fixed categories before route matching also cover rejected auth/data requests.
// Never log raw URLs, OAuth paths, query strings, bodies or user identifiers.
export function requestCategory(path) {
    const group = /^\/api\/v1\/(identity|data|functions|internal|admin|billing|engine|market|markets|stocks|securities|quotes|news|health)(?:\/|$)/.exec(path)?.[1];
    return group ? `/api/v1/${group}/*` : 'other';
}
export function requestLogger(req, res, next) {
    const start = performance.now();
    const category = requestCategory(req.path);
    const candidate = req.get('X-Request-ID');
    const requestId = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(candidate ?? '') ? candidate : randomUUID();
    res.setHeader('X-Request-ID', requestId);
    let bytes = 0;
    const write = res.write, end = res.end;
    const size = (chunk, encoding) => chunk == null || typeof chunk === 'function' ? 0 : typeof chunk === 'string' ? Buffer.byteLength(chunk, typeof encoding === 'string' ? encoding : undefined) : chunk.byteLength ?? 0;
    res.write = function (chunk, encoding, callback) { bytes += size(chunk, encoding); return write.apply(this, arguments); };
    res.end = function (chunk, encoding, callback) { bytes += size(chunk, encoding); return end.apply(this, arguments); };
    res.on("finish", () => {
        logger.info({requestId, method: req.method, route: category, status: res.statusCode,
            ms: performance.now() - start, responseBytes: bytes}, "request");
    });
    next();
}
