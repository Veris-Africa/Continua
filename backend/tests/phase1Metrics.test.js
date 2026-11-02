import {it,expect,vi} from 'vitest';
import {EventEmitter} from 'node:events';
import {observePool,poolSnapshot} from '../src/monitoring/poolMetrics.js';
import {createQueryVolume} from '../src/monitoring/queryVolume.js';
const log=vi.hoisted(()=>vi.fn());
vi.mock('../src/monitoring/logger.js',()=>({logger:{info:log}}));
import {requestLogger} from '../src/api/middleware/requestLogger.js';

it('measures promise, callback and transaction clients once without changing results or releases',async()=>{
 const volume=createQueryVolume();let released=0;
 const client={query(sql,params,cb){if(typeof params==='function')cb=params;const result={rows:[{value:3}]};if(cb){cb(null,result);return;}return sql==='FAIL'?Promise.reject(Error('private error')):Promise.resolve(result);},release(){released++;}};
 const pool={connect(cb){if(cb){cb(null,client,()=>client.release());return;}return Promise.resolve(client);},query(sql,cb){this.connect((err,c,release)=>c.query(sql,(err,result)=>{release();cb(err,result);}));},totalCount:1,idleCount:1,waitingCount:0};
 observePool(pool,'application',volume);observePool(pool,'application',volume);
 const c=await pool.connect();expect((await c.query('SELECT private')).rows[0].value).toBe(3);
 await c.query('BEGIN');await c.query('COMMIT');c.release();
 await new Promise((resolve,reject)=>pool.query('SELECT callback',(err,result)=>err?reject(err):resolve(result)));
 await expect(c.query('FAIL')).rejects.toThrow('private error');
 expect(volume.snapshot().queries.reduce((n,row)=>n+row.calls,0)).toBe(5);
 expect(volume.snapshot().queries.reduce((n,row)=>n+row.failures,0)).toBe(1);
 expect(released).toBe(2);expect(poolSnapshot()[0].acquisitions).toBe(2);
 expect(JSON.stringify(volume.snapshot())).not.toContain('private');
});
it('covers sensitive entrypoints without logging credentials, identifiers or raw paths',()=>{
 log.mockClear();const res=new EventEmitter();res.statusCode=200;res.setHeader=vi.fn();res.write=vi.fn(()=>true);res.end=vi.fn();
 requestLogger({path:'/api/v1/identity/reset-password/private-token',method:'POST',get:()=> 'email@example.test'},res,()=>{});
 res.write('é');res.end(Buffer.from('ok'));res.emit('finish');
 const fields=log.mock.calls[0][0];expect(fields.route).toBe('/api/v1/identity/*');expect(fields.responseBytes).toBe(4);
 expect(fields.requestId).toMatch(/^[a-f0-9-]{36}$/);expect(JSON.stringify(fields)).not.toMatch(/private-token|email@example/);
});
