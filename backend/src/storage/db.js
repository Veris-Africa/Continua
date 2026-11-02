/**
 * Single shared Postgres pool. Continua Data writes into the `market`
 * schema of the SAME Postgres instance the app's Supabase project already
 * uses — one database, two schemas (`public` for the app, `market` for this
 * layer), so there's no cross-project sync to maintain. See
 * supabase/migrations/030_market_schema.sql for the DDL.
 */
import pg from "pg";
import { registerDateTypes } from "./dateTypes.js";
import { env } from "../config/index.js";
import { logger } from "../monitoring/logger.js";
import {observePoolErrors} from './poolErrors.js';
import {observePool} from '../monitoring/poolMetrics.js';
import {queryVolume} from '../monitoring/queryVolume.js';
// node-postgres returns NUMERIC and BIGINT columns as STRINGS by default —
// a well-known pg gotcha, because a numeric/bigint value can exceed what a
// JS number can represent exactly. Every price, ratio, market cap, and
// volume in this schema is a `numeric` or `bigint` column, so left as the
// default, EVERY repository read would silently hand callers strings
// instead of numbers: `"1"+"2"` concatenates to `"12"` instead of adding to
// `3`, comparisons like `pe < 100` behave unpredictably, etc.
//
// The values in this domain (prices, market caps in KES, share counts,
// ratios, ingestion log ids) never approach Number.MAX_SAFE_INTEGER
// (2^53), so parsing them as floats/ints here is safe and correct for
// Continua Data specifically — this would need reconsidering only if a
// numeric column were ever used to hold something like a cryptographic
// value or an ID space larger than 2^53.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (val) => parseFloat(val));
pg.types.setTypeParser(pg.types.builtins.INT8, (val) => parseInt(val, 10));
registerDateTypes();
export const pool = new pg.Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 12_000,
});
observePool(pool,'application');
observePoolErrors(pool,{component:'application-database',report:(fields,message)=>logger.error(fields,message)});
let reportedCalls=0,reportedBytes=0;
const volumeReporter=setInterval(()=>{
    const snapshot=queryVolume.snapshot();
    const calls=snapshot.queries.reduce((sum,entry)=>sum+entry.calls,0);
    if(calls===reportedCalls)return;
    const bytes=snapshot.queries.reduce((sum,entry)=>sum+entry.estimatedResultValueBytes,0);
    const delta=bytes-reportedBytes;
    const fields={component:'database-result-volume',unit:snapshot.unit,
        calls:calls-reportedCalls,estimatedResultValueBytes:delta,top:snapshot.queries.slice(0,10)};
    if(delta>8*1024*1024)logger.warn(fields,'Large estimated database result volume; investigate repeated reads');
    else logger.info(fields,'Database result-volume sample');
    reportedCalls=calls;reportedBytes=bytes;
},300000);
volumeReporter.unref();
export async function query(text, params) {
    return pool.query(text, params);
}
export async function withTransaction(fn) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await fn(client);
        await client.query("COMMIT");
        return result;
    }
    catch (err) {
        await client.query("ROLLBACK");
        throw err;
    }
    finally {
        client.release();
    }
}
