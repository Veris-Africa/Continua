// Reproducible synthetic SQL comparisons. No external database, HTTP or account.
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
const require=createRequire(new URL('../../.qa-artifacts/canonical-fixture/package.json',import.meta.url));
const {PGlite}=require('@electric-sql/pglite');const db=new PGlite();
process.env.NODE_ENV='test';process.env.DATABASE_URL='postgresql://fixture:fixture@127.0.0.1:1/fixture';process.env.CACHE_DRIVER='memory';process.env.LOG_LEVEL='fatal';
const {pool}=await import('../../backend/src/storage/db.js');
const {corporateActionsRepository:actions}=await import('../../backend/src/storage/repositories/corporateActionsRepository.js');
const {compileDataRequest}=await import('../../backend/src/data/browserData.js');
const {publicationPolicy}=await import('../../backend/src/services/research/publicationPolicy.js');
let calls=0,bytes=0,rows=0;
pool.query=async(text,params)=>{calls++;const result=await db.query(text,params);bytes+=Buffer.byteLength(JSON.stringify(result.rows));rows+=result.rows.length;return result;};
async function measure(fn){calls=bytes=rows=0;const start=performance.now(),value=await fn();return {value,measurement:{calls,rows,decodedJsonBytes:bytes,milliseconds:performance.now()-start}};}
try {
 await db.exec(`CREATE SCHEMA scraping;
 CREATE TABLE scraping.sources(id text PRIMARY KEY,enabled boolean,redistribution_allowed boolean,config jsonb);
 INSERT INTO scraping.sources VALUES('synthetic-source',true,true,'{"permissionReference":"synthetic grant"}');
 CREATE SCHEMA market;CREATE TABLE market.corporate_actions(id text PRIMARY KEY,security_id text,type text,announced_at date,ex_date date,record_date date,pay_date date,effective_date date,status text,details jsonb);
 CREATE INDEX corporate_actions_security_type ON market.corporate_actions(security_id,type);
 INSERT INTO market.corporate_actions SELECT 'action-'||s||'-'||y,'NSE:FIXTURE'||s,'dividend',make_date(2000+y,1,1),make_date(2000+y,2,1),NULL,make_date(2000+y,3,1),NULL,
 CASE WHEN y=2 THEN 'cancelled' ELSE 'confirmed' END,jsonb_build_object('type','dividend','amountPerShare',0.123456+y::numeric/10)
 FROM generate_series(1,20) s CROSS JOIN generate_series(1,25) y;
 CREATE TABLE public.profiles(user_id uuid PRIMARY KEY,full_name text);
 INSERT INTO public.profiles SELECT gen_random_uuid(),repeat('x',3000000) FROM generate_series(1,2);`);
 const allowedPolicy=await publicationPolicy.revision();
 await db.exec('UPDATE scraping.sources SET redistribution_allowed=false');
 assert.notEqual(await publicationPolicy.revision(),allowedPolicy);
 await db.exec('DELETE FROM scraping.sources');
 assert.match(await publicationPolicy.revision(),/^[a-f0-9]{32}$/);
 const ids=Array.from({length:20},(_,n)=>'NSE:FIXTURE'+(n+1));
 const before=await measure(()=>Promise.all(ids.map(id=>actions.getDividendsBySecurity(id))));
 const after=await measure(async()=>{const grouped=await actions.getDividendsBySecurities(ids);return ids.map(id=>grouped.get(id));});
 assert.deepEqual(after.value,before.value);assert.equal(after.value.flat().length,500);
 assert.equal(before.measurement.calls,20);assert.equal(after.measurement.calls,1);
 assert.deepEqual(await actions.getDividendsBySecurities([]),new Map());
 await assert.rejects(actions.getDividendsBySecurities([...ids,'NSE:EXTRA']),/limit/);
 // Existing compiler performs the guard before transferring serialized rows.
 const compiled=compileDataRequest({table:'profiles',method:'GET',search:new URLSearchParams('select=user_id,full_name&limit=2')});
 const original=await db.query('SELECT row_to_json(p)::text payload FROM public.profiles p');
 const bounded=await db.query(compiled.sql,compiled.params);
 assert.equal(bounded.rows.length,1);assert.equal(bounded.rows[0].oversized,true);assert.equal(bounded.rows[0].payload,null);
 await db.exec("UPDATE public.profiles SET full_name='normal'");
 const ordinary=await db.query(compiled.sql,compiled.params);assert.equal(ordinary.rows.length,2);assert.ok(ordinary.rows.every(row=>row.oversized===false));
 // Oversized UPDATE representation is detected inside the open transaction;
 // rolling it back preserves the pre-request values. No write replay.
 const mutation=compileDataRequest({table:'profiles',method:'PATCH',search:new URLSearchParams('full_name=eq.normal&select=user_id,full_name'),body:{full_name:'y'.repeat(3000000)},prefer:'return=representation'});
 await db.exec('BEGIN');const mutated=await db.query(mutation.sql,mutation.params);assert.equal(mutated.rows[0].oversized,true);await db.exec('ROLLBACK');
 assert.equal((await db.query("SELECT count(*)::int n FROM public.profiles WHERE full_name='normal'")).rows[0].n,2);
 console.log(JSON.stringify({fixtureOnly:true,publicationPolicySql:{revocationChangesDigest:true,emptyRegistryValid:true},dividends:{before:before.measurement,after:after.measurement,historicalRows:500,parity:true},
 oversizedData:{beforeDecodedWireJsonBytes:Buffer.byteLength(JSON.stringify(original.rows)),afterDecodedWireJsonBytes:Buffer.byteLength(JSON.stringify(bounded.rows)),sentinelRows:1,mutationRollback:true},
 interpretation:'Decoded JSON fixture bytes and single-run local timings, not PostgreSQL wire bytes, production latency or Neon-billed egress.'},null,2));
} finally {await db.close();await pool.end();}
