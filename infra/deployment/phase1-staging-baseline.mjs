// Seven bounded representative API operations, not a browser/page-load benchmark.
// Only a separately verified disposable LOCAL service is accepted. No auto retries.
import {performance} from 'node:perf_hooks';
const base=new URL(process.env.PHASE1_STAGING_API ?? 'http://127.0.0.1:5186');
if(process.env.CONTINUA_DISPOSABLE_FIXTURE!=='true'||base.hostname!=='127.0.0.1'||base.protocol!=='http:'||base.username||base.password||base.pathname!=='/')
    throw Error('Verified disposable local API required; production/remote hosts refused');
const key=process.env.PHASE1_STAGING_API_KEY,token=process.env.PHASE1_SYNTHETIC_USER_TOKEN;
if(!key||!token)throw Error('Synthetic staging API key and user token required');
const flows=[
 ['home-market-overview','/api/v1/indices?exchange=NSE'],
 ['markets-listing','/api/v1/instruments?exchange=NSE'],
 ['stock-fundamentals','/api/v1/financials/SCOM/history?exchange=NSE&periodType=annual&limit=20'],
 ['portfolio-retrieval','/api/v1/engine/portfolio/overview?exchange=NSE'],
 ['engine-company-research','/api/v1/engine/SCOM?exchange=NSE'],
 ['engine-portfolio-analytics','/api/v1/engine/portfolio?exchange=NSE'],
 ['tradershub-feed','/api/v1/data/community_feed?select=*'],
];
async function sample(flow,path,pass){
 const start=performance.now();
 try {
  const response=await fetch(new URL(path,base),{redirect:'error',signal:AbortSignal.timeout(30000),headers:{'X-API-Key':key,'X-User-Token':token}});
  let bytes=0;for await(const chunk of response.body){bytes+=chunk.length;if(bytes>8*1024*1024)throw Error('Measurement body limit');}
  return {flow,pass,status:response.status,responseBytes:bytes,milliseconds:performance.now()-start,
   retries:0,requestId:response.headers.get('x-request-id'),cacheControl:response.headers.get('cache-control')};
 }catch {return {flow,pass,failed:true,milliseconds:performance.now()-start,retries:0};}
}
const results=[];
for(const pass of ['first-read','repeat-read'])for(const [flow,path] of flows)results.push(await sample(flow,path,pass));
console.log(JSON.stringify({fixtureOnly:true,observedAt:new Date().toISOString(),requests:14,results,
 notes:'Operator must prove API database is disposable first. First-read does not assert a cold cache. Join safe request IDs with API logs and protected SQL/pool/cache snapshots; no raw response content is retained.'},null,2));
if(results.some(row=>row.failed||row.status!==200))process.exitCode=1;
