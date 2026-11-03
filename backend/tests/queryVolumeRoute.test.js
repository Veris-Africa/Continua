import {rateLimit} from 'express-rate-limit';
import {it,expect,vi} from 'vitest';
import express from 'express';
import {createServer} from 'node:http';
vi.mock('../src/config/index.js',async original=>{const module=await original();return {...module,env:{...module.env,ADMIN_API_KEY:'fixture-bandwidth-admin'}};});
import {adminFinancialsRoutes} from '../src/api/routes/admin.routes.js';
import {requireAdminKey} from '../src/api/middleware/requireAdminKey.js';
import {errorHandler} from '../src/api/middleware/errorHandler.js';

it('keeps result-volume diagnostics behind the existing admin boundary with no-store responses',async()=>{
 const app=express();app.use(rateLimit({windowMs:60000,limit:1000,standardHeaders:false,legacyHeaders:false}));app.use('/admin',requireAdminKey(),adminFinancialsRoutes);app.use(errorHandler);
 const server=createServer(app);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try {
  const url=`http://127.0.0.1:${server.address().port}/admin/diagnostics/query-volume`;
  expect((await fetch(url)).status).toBe(401);
  const response=await fetch(url,{headers:{'X-Admin-Key':'fixture-bandwidth-admin'}});
  expect(response.status).toBe(200);expect(response.headers.get('Cache-Control')).toBe('no-store');
  const {data}=await response.json();expect(data.unit).toContain('not Neon');
  expect(Array.isArray(data.queries)).toBe(true);expect(data.cache.driver).toBeDefined();
  expect(JSON.stringify(data)).not.toContain('fixture-bandwidth-admin');
 } finally {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
