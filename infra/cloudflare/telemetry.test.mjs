import {test} from 'node:test';import assert from 'node:assert/strict';
import {browserErrorReport} from './telemetry.mjs';
import worker from './worker.mjs';
const env={BROWSER_ERROR_REPORTS_ENABLED:'true',EDGE_RATE_LIMIT:{limit:async()=>({success:true})}};
const event={kind:'render',route:'stock',revision:'a'.repeat(40),browser:'safari',device:'mobile',timestamp:new Date().toISOString()};
const request=body=>new Request('https://continua.invalid/api/telemetry/errors',{method:'POST',headers:{Origin:'https://continua.invalid','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1'},body:JSON.stringify(body)});
test('rejects disabled, cross-origin, oversized and arbitrary browser report data',async()=>{
 assert.equal((await browserErrorReport(request(event),{})).status,404);
 const foreign=request(event);foreign.headers.set('Origin','https://attacker.invalid');assert.equal((await browserErrorReport(foreign,env)).status,403);
 assert.equal((await browserErrorReport(request({...event,password:'private'}),env)).status,400);
 assert.equal((await browserErrorReport(request({...event,route:'private-id'}),env)).status,400);
 assert.equal((await browserErrorReport(request({...event,stack:'x'.repeat(2000)}),env)).status,413);
});
test('logs only enumerated fields and generates correlation even for early rejection',async()=>{
 const original=console.warn,logs=[];console.warn=s=>logs.push(s);
 try{assert.equal((await browserErrorReport(request(event),env)).status,204);assert.equal(logs.length,1);assert.equal(logs[0].includes('192.0.2.1'),false);}finally{console.warn=original;}
 const response=await worker.fetch(new Request('https://continua.invalid/api/session/old',{headers:{'X-Request-ID':'arbitrary-user-secret'}}),{},{});
 assert.equal(response.status,410);assert.match(response.headers.get('X-Request-ID'),/^[a-f0-9-]{36}$/);
});
