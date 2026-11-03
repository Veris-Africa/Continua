import {AsyncLocalStorage} from 'node:async_hooks';
import {performance} from 'node:perf_hooks';
import {randomUUID} from 'node:crypto';

export const requestContext=new AsyncLocalStorage();
const dependencies=new Set(['database','pool','auth','cache','paystack','engine','engine_queue','research','background','other']);
const routeGroups=new Set('identity data functions internal admin billing engine market markets stocks securities quotes news health financials companies indices instruments historical movers research sectors statistics price-history valuation backtest'.split(' '));
const bounds=[1,5,10,25,50,100,250,500,1000,2500,5000,15000,60000,Infinity];
export const safeRequestId=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)?value:randomUUID();
export function errorCategory(error){
 const code=error?.code;
 if(['ETIMEDOUT','57014','CONNECT_TIMEOUT','AUTH_TIMEOUT'].includes(code)||error?.name==='TimeoutError'||error?.name==='AbortError')return 'timeout';
 if(['ECONNREFUSED','ECONNRESET','ENOTFOUND','EAI_AGAIN','08006','53300','57P01'].includes(code))return 'unavailable';
 if(typeof code==='string'&&/^(23|40)/.test(code))return 'transaction';
 return 'failure';
}
// Five one-minute histogram buckets; no identities, raw URLs, SQL or payloads.
// Quantiles are histogram upper bounds, never fabricated for sparse traffic.
export function createMetrics({now=Date.now}={}){
 const series=new Map(),startedAt=now();
 function record(key,ms,{failed=false,timeout=false,requestBytes=0,responseBytes=0}={}){
  if(!Number.isFinite(ms)||ms<0)return;
  if(!/^(request:(?:\/api\/v1\/[a-z-]+\/\*|other):(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|OTHER):(warm|startup)|dependency:(database|pool|auth|cache|paystack|engine|engine_queue|research|background|other)(?::hit|:miss)?|frontend:(javascript|promise|render|network|auth|route))$/.test(key))key='dependency:other';
  if(key.startsWith('request:/api/v1/')&&!routeGroups.has(key.split('/')[3]))key='dependency:other';
  const minute=Math.floor(now()/60000),oldest=minute-4;
  for(const [name,buckets]of series){for(const t of buckets.keys())if(t<oldest)buckets.delete(t);if(!buckets.size)series.delete(name);}
  if(!series.has(key)&&series.size>=127)key='dependency:other';
  const buckets=series.get(key)??new Map(),b=buckets.get(minute)??{count:0,failures:0,timeouts:0,totalMs:0,requestBytes:0,responseBytes:0,histogram:bounds.map(()=>0)};
  b.count++;b.failures+=Number(failed);b.timeouts+=Number(timeout);b.totalMs+=ms;
  b.requestBytes+=Math.max(0,Math.min(1e8,Number(requestBytes)||0));b.responseBytes+=Math.max(0,Math.min(1e8,Number(responseBytes)||0));b.histogram[bounds.findIndex(x=>ms<=x)]++;
  buckets.set(minute,b);series.set(key,buckets);
 }
 function snapshot(){
  const current=now(),oldest=Math.floor(current/60000)-4;
  const rows=[];
  for(const [key,buckets]of series){
   const total={count:0,failures:0,timeouts:0,totalMs:0,requestBytes:0,responseBytes:0,histogram:bounds.map(()=>0)};
   for(const [minute,b]of buckets)if(minute>=oldest)for(const field of Object.keys(total))if(field==='histogram')b.histogram.forEach((n,i)=>total.histogram[i]+=n);else total[field]+=b[field];
   if(!total.count)continue;
   const percentile=(p,minimum)=>{if(total.count<minimum)return null;let n=0;const i=total.histogram.findIndex(x=>(n+=x)>=Math.ceil(p*total.count));return Number.isFinite(bounds[i])?bounds[i]:null;};
   rows.push({key,count:total.count,failures:total.failures,timeouts:total.timeouts,averageMs:total.totalMs/total.count,p50UpperMs:percentile(.5,20),p95UpperMs:percentile(.95,100),p99UpperMs:percentile(.99,1000),errorRate:total.failures/total.count,timeoutRate:total.timeouts/total.count,requestBytes:total.requestBytes,responseBytes:total.responseBytes});
  }
  return {startedAt:new Date(startedAt).toISOString(),observedAt:new Date(current).toISOString(),windowStart:new Date(Math.max(startedAt,(oldest)*60000)).toISOString(),window:'current and preceding four UTC minute buckets; resets on restart',quantiles:'histogram upper bounds; null means insufficient samples or above 60s',series:rows};
 }
 return {record,snapshot};
}
export const metrics=createMetrics();
export function recordDependency(category,ms,error,{outcome,context=requestContext.getStore()}={}){
 const name=dependencies.has(category)?category:'other';
 const expectedRejection=name==='auth'&&Number(error?.status)>=400&&Number(error?.status)<500;
 if(expectedRejection)error=undefined;
 metrics.record('dependency:'+name+(name==='cache'&&['hit','miss'].includes(outcome)?':'+outcome:''),ms,{failed:!!error,timeout:errorCategory(error)==='timeout'});
 if(context){const entry=context.dependencies[name]??{calls:0,milliseconds:0,failures:0,timeouts:0};entry.calls++;entry.milliseconds+=Math.max(0,ms);entry.failures+=Number(!!error);entry.timeouts+=Number(!!error&&errorCategory(error)==='timeout');context.dependencies[name]=entry;}
}
export async function observeDependency(category,fn){const start=performance.now();try{const value=await fn();recordDependency(category,performance.now()-start);return value;}catch(error){recordDependency(category,performance.now()-start,error);throw error;}}
export function runObservedJob(fn){return requestContext.run({requestId:randomUUID(),route:'background',dependencies:{}},()=>observeDependency('background',fn));}
