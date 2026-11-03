import {it,expect,vi} from 'vitest';
import express from 'express';
import {rateLimit} from 'express-rate-limit';
const logs=vi.hoisted(()=>[]);
vi.mock('../src/monitoring/logger.js',()=>({logger:{info:fields=>logs.push(fields),warn:vi.fn(),error:vi.fn()}}));
import {requestLogger} from '../src/api/middleware/requestLogger.js';
import {observeDependency} from '../src/monitoring/observability.js';
import {createMaintenanceRouter} from '../src/data/maintenanceRoutes.js';
it('keeps correlation and dependency timing but excludes URLs, tokens and bodies',async()=>{
 const app=express();app.use(rateLimit({windowMs:60000,limit:100,standardHeaders:false,legacyHeaders:false}),requestLogger);
 app.get('/api/v1/engine/:private',async(_req,res)=>{await observeDependency('database',async()=>1);res.json({ok:true});});
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 try{const r=await fetch('http://127.0.0.1:'+server.address().port+'/api/v1/engine/private-person?token=private-token',{headers:{'X-Request-ID':'11111111-1111-4111-8111-111111111111'}});await r.json();expect(r.headers.get('x-request-id')).toBe('11111111-1111-4111-8111-111111111111');
  const entry=logs.at(-1);expect(entry.route).toBe('/api/v1/engine/*');expect(entry.dependencies.database.calls).toBe(1);expect(JSON.stringify(entry)).not.toContain('private-person');expect(JSON.stringify(entry)).not.toContain('private-token');
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
it('requires maintenance authority for a read-only aggregate and sanitizes failure',async()=>{
 const key='synthetic-maintenance-key-'.repeat(3);let calls=0,fail=false;const app=express();app.use(createMaintenanceRouter({secret:key,run:async()=>({}),observability:()=>{calls++;if(fail)throw Error('private database');return {paymentDurability:{enabled:false,metrics:'unavailable_disabled'}};}}));
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const url='http://127.0.0.1:'+server.address().port+'/observability';
 try{
  expect((await fetch(url)).status).toBe(401);expect((await fetch(url,{headers:{'X-Continua-Maintenance-Key':key,Origin:'https://continua.invalid'}})).status).toBe(401);expect(calls).toBe(0);
  const r=await fetch(url,{headers:{'X-Continua-Maintenance-Key':key}});expect(r.status).toBe(200);expect(r.headers.get('cache-control')).toBe('no-store');expect((await r.json()).paymentDurability.metrics).toBe('unavailable_disabled');
  fail=true;const failed=await fetch(url,{headers:{'X-Continua-Maintenance-Key':key}});expect(failed.status).toBe(503);expect(await failed.text()).not.toContain('private');
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
