import {rateLimit} from 'express-rate-limit';
import {createHmac} from 'node:crypto';
import {afterEach,it,expect,vi} from 'vitest';
import express from 'express';
import {createPaymentOperations} from '../src/services/paymentOperations.js';
const m=vi.hoisted(()=>({query:vi.fn(),kick:vi.fn()}));
vi.mock('../src/config/index.js',()=>({env:{PAYMENT_DURABILITY_ENABLED:true,PAYSTACK_SECRET_KEY:'sk_live_synthetic',PAYSTACK_NATIVE_MODE:'test'}}));
vi.mock('../src/storage/db.js',()=>({query:m.query}));
vi.mock('../src/monitoring/logger.js',()=>({logger:{info:vi.fn(),error:vi.fn(),warn:vi.fn()}}));
vi.mock('../src/api/middleware/requireSubscriber.js',()=>({requireEngineUser:vi.fn()}));
vi.mock('../src/services/paystackLive.js',()=>({liveCheckoutEnabled:()=>true,initializeLiveCheckout:vi.fn(),verifyLiveCheckout:vi.fn(),liveReferencePattern:/^continua-live-[a-f0-9-]{36}$/}));
vi.mock('../src/services/paystackNative.js',()=>({nativeCheckoutForUser:()=>false,nativeCheckoutInput:{safeParse:vi.fn()},initializeNativeCheckout:vi.fn(),verifyNativeCheckout:vi.fn(),nativeSecret:mode=>'sk_'+mode+'_synthetic',nativeReferencePattern:/^continua-(live|test)-[a-f0-9-]{36}$/,cardRenewalEnabled:()=>false}));
vi.mock('../src/services/paymentOperationsRuntime.js',()=>({paymentOperations:()=>createPaymentOperations({database:{query:m.query}}),kickPaymentOperations:m.kick}));
import {paystackWebhook} from '../src/api/routes/billing.routes.js';
import {errorHandler} from '../src/api/middleware/errorHandler.js';
const servers=[];
afterEach(async()=>{await Promise.all(servers.splice(0).map(s=>new Promise(r=>s.close(r))));vi.resetAllMocks();});
async function fixture(){const app=express();app.use(rateLimit({windowMs:60000,limit:1000,standardHeaders:false,legacyHeaders:false}));app.post('/hook',express.raw({type:'application/json',limit:'64kb'}),paystackWebhook);app.use(errorHandler);const s=app.listen(0,'127.0.0.1');servers.push(s);await new Promise(r=>s.once('listening',r));return 'http://127.0.0.1:'+s.address().port+'/hook';}
const event={event:'charge.success',data:{id:42,reference:'continua-test-11111111-1111-4111-8111-111111111111'}};
const post=(url,value,key='sk_test_synthetic',signature)=>{const body=JSON.stringify(value);return fetch(url,{method:'POST',headers:{'Content-Type':'application/json','x-paystack-signature':signature??createHmac('sha512',key).update(body).digest('hex')},body});};
it('only acknowledges a signed event after its receipt is durably written',async()=>{
 const url=await fixture();let enter,release;const entered=new Promise(r=>enter=r),gate=new Promise(r=>release=r);
 m.query.mockImplementation(async()=>{enter();await gate;return {rowCount:1,rows:[{id:'receipt',status:'pending'}]};});
 let acknowledged=false;const pending=post(url,event).then(r=>{acknowledged=true;return r;});await entered;expect(acknowledged).toBe(false);expect(m.kick).not.toHaveBeenCalled();release();expect((await pending).status).toBe(200);expect(m.kick).toHaveBeenCalledOnce();
});
it('database outage is a retryable failure, never a false success',async()=>{
 const url=await fixture();m.query.mockRejectedValue(Error('private DB failure'));const r=await post(url,event);expect(r.status).toBe(503);expect(await r.text()).not.toContain('private DB');expect(m.kick).not.toHaveBeenCalled();
});
it('bad signatures, mode mixing and oversized payloads cannot reach storage',async()=>{
 const url=await fixture();expect((await post(url,event,'sk_test_synthetic','0'.repeat(128))).status).toBe(401);expect((await post(url,event,'sk_live_synthetic')).status).toBe(401);expect((await post(url,{...event,extra:'x'.repeat(65536)})).status).toBe(413);expect(m.query).not.toHaveBeenCalled();
});
