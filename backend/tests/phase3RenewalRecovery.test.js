import {afterEach,it,expect,vi} from 'vitest';
const m=vi.hoisted(()=>({query:vi.fn(),transaction:vi.fn(),provider:vi.fn(),verify:vi.fn(),enqueue:vi.fn(),finished:vi.fn(),kick:vi.fn()}));
vi.mock('../src/config/index.js',()=>({env:{PAYSTACK_NATIVE_MODE:'test',PAYMENT_DURABILITY_ENABLED:true}}));
vi.mock('../src/monitoring/logger.js',()=>({logger:{warn:vi.fn()}}));
vi.mock('../src/storage/db.js',()=>({query:m.query,withTransaction:m.transaction}));
vi.mock('../src/services/paystackNative.js',()=>({cardRenewalEnabled:()=>true,nativeProvider:m.provider,verifyNativeCheckout:m.verify,decryptAuthorization:()=> 'AUTH_synthetic'}));
vi.mock('../src/services/paymentOperationsRuntime.js',()=>({paymentOperations:()=>({enqueueRenewal:m.enqueue,initiationFinished:m.finished}),kickPaymentOperations:m.kick}));
import {runCardRenewals} from '../src/workers/cardRenewalWorker.js';
const reserved={reference:'continua-test-11111111-1111-4111-8111-111111111111',initiate:true,amount:80000,renewal:{user_id:'owner',mode:'test',email:'synthetic@example.test',authorization_cipher:'synthetic'}};
afterEach(()=>vi.resetAllMocks());
function due(){m.query.mockResolvedValueOnce({rows:[{user_id:'owner',mode:'test'}]}).mockResolvedValue({rows:[]});}
it('cancellation winning the final reservation check prevents provider initiation',async()=>{
 due();m.transaction.mockResolvedValueOnce(reserved).mockResolvedValueOnce(false);await runCardRenewals();expect(m.provider).not.toHaveBeenCalled();expect(m.finished).not.toHaveBeenCalled();expect(m.kick).toHaveBeenCalledOnce();
});
it('an uncertain charge is initiated once and handed to safe reference verification',async()=>{
 due();m.transaction.mockResolvedValueOnce(reserved).mockResolvedValueOnce(true);m.provider.mockRejectedValue(Error('ambiguous timeout'));await Promise.all([runCardRenewals(),runCardRenewals()]);
 expect(m.provider).toHaveBeenCalledTimes(1);expect(m.provider.mock.calls[0][1]).toBe('/transaction/charge_authorization');expect(m.provider.mock.calls[0][2].reference).toBe(reserved.reference);expect(m.finished).toHaveBeenCalledWith(reserved.reference);expect(m.verify).not.toHaveBeenCalled();
 due();m.transaction.mockResolvedValueOnce({...reserved,initiate:false});await runCardRenewals();expect(m.provider).toHaveBeenCalledTimes(1);expect(m.finished).toHaveBeenCalledTimes(1);
});
it('reservation failure cannot initiate a payment',async()=>{
 due();m.transaction.mockRejectedValue(Error('synthetic database outage'));await runCardRenewals();expect(m.provider).not.toHaveBeenCalled();expect(m.finished).not.toHaveBeenCalled();
});
it('provider success followed by a failed local update retains recovery and never repeats initiation',async()=>{
 m.query.mockImplementation(async sql=>{
  if(sql.startsWith('SELECT user_id,mode'))return {rows:[{user_id:'owner',mode:'test'}]};
  if(sql.includes("SET state='pending'"))throw Error('simulated lost update after provider success');
  return {rows:[]};
 });
 m.transaction.mockResolvedValueOnce(reserved).mockResolvedValueOnce(true);m.provider.mockResolvedValue({status:'success'});
 await runCardRenewals();expect(m.provider).toHaveBeenCalledOnce();expect(m.finished).toHaveBeenCalledWith(reserved.reference);
 expect(m.query.mock.calls.some(([sql])=>sql.includes("SET state='unknown'"))).toBe(true);
 m.transaction.mockResolvedValueOnce({...reserved,initiate:false});await runCardRenewals();expect(m.provider).toHaveBeenCalledOnce();
});
