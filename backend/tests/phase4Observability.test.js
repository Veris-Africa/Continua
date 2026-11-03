import {ingestionStatus} from '../src/monitoring/ingestionStatus.js';
import {it,expect} from 'vitest';
import {createMetrics,requestContext,observeDependency,safeRequestId,errorCategory,recordDependency} from '../src/monitoring/observability.js';
import {createAlertTransitions,evaluateSignals} from '../src/monitoring/alertPolicy.js';
it('isolates concurrent async correlations and records no private inputs',async()=>{
 const ids=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222'];
 const contexts=await Promise.all(ids.map(requestId=>requestContext.run({requestId,route:'other',dependencies:{}},async()=>{await observeDependency('database',()=>new Promise(r=>setTimeout(r,2)));return requestContext.getStore();})));
 expect(contexts.map(x=>x.requestId)).toEqual(ids);expect(contexts.every(x=>x.dependencies.database.calls===1)).toBe(true);expect(requestContext.getStore()).toBeUndefined();
 expect(safeRequestId('secret@example.test')).toMatch(/^[a-f0-9-]{36}$/);expect(errorCategory({code:'57014',message:'private query'})).toBe('timeout');
 await expect(observeDependency('auth',async()=>{throw Object.assign(Error('private token'),{code:'ECONNRESET'});})).rejects.toThrow('private token');
});
it('bounds labels and windows and withholds sparse quantiles',()=>{
 let time=600000;const m=createMetrics({now:()=>time});m.record('request:/api/v1/engine/*:GET:warm',100,{responseBytes:5});
 expect(m.snapshot().series[0].p95UpperMs).toBeNull();for(let i=0;i<999;i++)m.record('request:/api/v1/engine/*:GET:warm',100,{failed:i<9});
 const r=m.snapshot().series[0];expect(r.count).toBe(1000);expect(r.p50UpperMs).toBe(100);expect(r.p99UpperMs).toBe(100);expect(r.failures).toBe(9);
 for(let i=0;i<1000;i++)m.record('private/'+i,1);expect(m.snapshot().series.length).toBe(2);expect(JSON.stringify(m.snapshot())).not.toContain('private');
 time+=300000;expect(m.snapshot().series).toEqual([]);
});
it('reports unavailable provider and disabled payments rather than fabricated zeros',()=>{
 const signals=evaluateSignals({payments:{enabled:false},providerUsage:{source:'sql-estimate',transferBytes:0,allowanceBytes:1}});
 expect(signals.find(x=>x.category==='neon_quota').state).toBe('unavailable');expect(signals.find(x=>x.category==='payment_metrics').state).toBe('unavailable');
 const observedAt=new Date().toISOString();expect(evaluateSignals({providerUsage:{source:'neon-console',transferBytes:95,allowanceBytes:100,observedAt}}).find(x=>x.category==='neon_quota').state).toBe('critical');
});
it('persists alert transitions, cooldown, recovery and bounded failed notifications',async()=>{
 let state={},time=10000000,fail=false;const notifications=[];
 const run=createAlertTransitions({load:async()=>state,save:async value=>{state=value;},notify:async value=>{if(fail)throw Error('private destination');notifications.push(value);},now:()=>time});
 const signal=state=>[{category:'neon_quota',state,severity:'critical'}];
 expect((await run(signal('warning'))).sent).toBe(1);time+=1000000;expect((await run(signal('warning'))).sent).toBe(0);
 expect((await run(signal('clear'))).sent).toBe(1);expect(notifications.at(-1).state).toBe('clear');
 expect((await run(signal('critical'))).sent).toBe(0);time+=1000000;fail=true;expect((await run(signal('critical'))).failed).toBe(1);
 fail=false;expect((await run(signal('critical'))).sent).toBe(0);time+=300001;expect((await run(signal('critical'))).sent).toBe(1);
});

it('does not mistake rejected credentials for an authentication provider outage',()=>{const context={dependencies:{}};recordDependency('auth',5,{status:401},{context});expect(context.dependencies.auth.failures).toBe(0);recordDependency('auth',5,{status:503},{context});expect(context.dependencies.auth.failures).toBe(1);});

it('keeps unavailable ingestion distinct from an empty backlog and returns no document payload',async()=>{let calls=0;const good=await ingestionStatus({query:async()=>{calls++;return {rows:[{status:'failed',count:2,oldest_seconds:90000,expired_leases:0,exhausted:2,url:'private'}]};}});expect(calls).toBe(1);expect(good.available).toBe(true);expect(good.categories.ingestion_retry_exhausted).toBe(true);expect(JSON.stringify(good)).not.toContain('private');expect((await ingestionStatus({query:async()=>{throw Error('private');}})).available).toBe(false);});
