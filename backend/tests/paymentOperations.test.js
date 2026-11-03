import {describe,it,expect,vi} from 'vitest';
import {classifyPaymentEvent,paymentRetryDelay,createPaymentOperations} from '../src/services/paymentOperations.js';
const ref='continua-test-11111111-1111-4111-8111-111111111111';
describe('private durable payment receipts',()=>{
 it('minimizes data and fingerprints semantic repeated deliveries without storing card/customer fields',async()=>{
  const event={event:'charge.success',data:{id:7,reference:ref,domain:'test',status:'success',customer:{email:'private@example.test'},authorization:{authorization_code:'private-token'}}};
  const a=classifyPaymentEvent(event,'test'),b=classifyPaymentEvent({...event,data:{...event.data,customer:{email:'changed@example.test'}}},'test');
  expect(a.fingerprint).toBe(b.fingerprint);expect(a.classification).toBe('actionable');
  const query=vi.fn(async()=>({rowCount:1,rows:[{id:'receipt',status:'pending'}]}));
  await createPaymentOperations({database:{query}}).accept(event,'test');
  expect(JSON.stringify(query.mock.calls)).not.toContain('private@example.test');expect(JSON.stringify(query.mock.calls)).not.toContain('private-token');
 });
 it('rejects mode mixing and malformed bodies before SQL',()=>{
  expect(()=>classifyPaymentEvent({event:'charge.success',data:{reference:ref,domain:'live'}},'test')).toThrow(/mode/);
  for(const event of [null,[],{event:'<script>'},{event:'x'.repeat(81)}])expect(()=>classifyPaymentEvent(event,'test')).toThrow();
 });
 it('classifies real lifecycle events without inventing entitlement changes',()=>{
  for(const event of ['refund.processed','charge.dispute.create','subscription.disable','invoice.payment_failed','charge.failed'])expect(classifyPaymentEvent({event,data:{}},'test').classification).toBe('review');
  expect(classifyPaymentEvent({event:'invoice.update',data:{}},'test').classification).toBe('informational');
  expect(classifyPaymentEvent({event:'transfer.reversed',data:{}},'test').classification).toBe('ignored');
 });
 it('does not acknowledge failed durable acceptance',async()=>{
  const api=createPaymentOperations({database:{query:async()=>{throw Error('database unavailable');}}});
  await expect(api.accept({event:'charge.success',data:{reference:ref}},'test')).rejects.toThrow();
 });
 it('bounds jittered verification backoff',()=>{
  expect(paymentRetryDelay(1,()=>0.5)).toBe(60000);expect(paymentRetryDelay(30,()=>1)).toBe(21600000);
 });
 it('only safe verification is retried; unknown references/conflicts become review',async()=>{
  const work={id:'receipt',lease_id:'lease',kind:'renewal',reference:ref,mode:'test',attempts:1,first_received_at:new Date().toISOString()};
  const query=vi.fn(async sql=>sql.startsWith('WITH candidate')?{rows:[work]}:{rowCount:1,rows:[]});
  const verifyNative=vi.fn(async()=>{throw Object.assign(Error('synthetic'),{status:404});});
  const api=createPaymentOperations({database:{query},verifyNative,verifyHosted:vi.fn()});
  const result=await api.drain({limit:1});expect(result.review).toBe(1);expect(query.mock.calls.at(-1)[1].slice(2,4)).toEqual(['review','unknown_reference']);
 });
 it('does not treat an expired worker acknowledgement as success',async()=>{
  const api=createPaymentOperations({database:{query:async()=>({rowCount:0})}});
  expect(await api.finish({id:'receipt',lease_id:'old',attempts:1},'completed')).toBe(false);
 });
});
