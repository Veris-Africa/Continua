import pino from "pino";
import { env } from "../config/index.js";
import {requestContext} from './observability.js';
export const logger = pino({
    level: env.LOG_LEVEL,
    mixin(){const context=requestContext.getStore();return context?{requestId:context.requestId,route:context.route}:{};},
    redact:{paths:['err','error','path','key','userId','user_id','sessionId','session_id','subject','claims','metadata','password','token','cookie','authorization','reference','email','phone','args','prompt','body','headers','*.password','*.token','*.cookie','*.authorization','*.reference','*.email','*.phone'],censor:'[REDACTED]'},
    transport: env.NODE_ENV === "development"
        ? { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" } }
        : undefined,
});
