import {pathToFileURL} from 'node:url';
export function validateRelease(receipt,expected){
 if(!/^[a-f0-9]{40}$/i.test(expected??''))throw Error('Exact expected SHA required');
 const issues=[];
 for(const target of ['frontend','backend']){
  const proof=receipt.backendTreeEquivalence;
  const equivalent=target==='backend'&&proof?.source==='github-git-trees'&&proof.expected===expected&&proof.observed===receipt.backend?.revision&&/^[a-f0-9]{40}$/i.test(proof.backendTree??'');
  if(receipt[target]?.status!==200||receipt[target]?.revision!==expected&&!equivalent)issues.push(target+'_revision_mismatch');
 }
 if(receipt.backend?.schemaContract!=='existing-additive-20261102')issues.push('schema_contract_mismatch');
 return {ok:issues.length===0,issues,expected,observed:receipt,warning:'No deployment/configuration/SQL changes performed. Worker revision comes from response metadata, not Git HEAD. Health alone does not prove authenticated behavior.'};
}
async function boundedJson(response,max=16384){
 const reader=response.body?.getReader(),parts=[];let bytes=0;
 if(reader)for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>max){await reader.cancel();throw Error('Metadata too large');}parts.push(value);}
 return JSON.parse(Buffer.concat(parts).toString());
}
export async function observeRelease(request=fetch){
 const urls={frontend:'https://continua.cypriankiprop41.workers.dev/release.json',backend:'https://continua-backend.onrender.com/api/v1/health/live'};
 const receipt={observedAt:new Date().toISOString()};
 await Promise.all(Object.entries(urls).map(async([target,url])=>{
  try{const r=await request(url,{redirect:'error',signal:AbortSignal.timeout(30000),headers:{Accept:'application/json'}});const json=await boundedJson(r);receipt[target]={status:r.status,revision:/^[a-f0-9]{40}$/i.test(json.revision??'')?json.revision:null,...(target==='backend'?{schemaContract:json.schemaContract}:{}),workerVersion:r.headers.get('X-Continua-Worker-Version')};}
  catch{receipt[target]={status:0,revision:null,category:'unavailable_or_invalid_metadata'};}
 }));return receipt;
}
export async function proveBackendEquivalence(receipt,expected,{request=fetch,token=process.env.GITHUB_TOKEN}={}){
 const observed=receipt.backend?.revision;
 if(observed===expected||!/^[a-f0-9]{40}$/i.test(expected??'')||!/^[a-f0-9]{40}$/i.test(observed??''))return receipt;
 try{
  const trees=await Promise.all([expected,observed].map(async sha=>{
   const r=await request('https://api.github.com/repos/cypskip-create/Continua/git/trees/'+sha,{redirect:'error',signal:AbortSignal.timeout(10000),headers:{Accept:'application/vnd.github+json',...(token?{Authorization:'Bearer '+token}:{})}});
   if(!r.ok)throw Error('Source metadata unavailable');
   const json=await boundedJson(r,65536);return json.tree?.find(x=>x.path==='backend'&&x.type==='tree')?.sha;
  }));
  if(trees[0]===trees[1]&&/^[a-f0-9]{40}$/i.test(trees[0]??''))receipt.backendTreeEquivalence={source:'github-git-trees',expected,observed,backendTree:trees[0],scope:'Render rootDir backend source only; effective configuration requires separate verification'};
 }catch{/* Missing proof remains a visible mismatch, never assumed equivalent. */}
 return receipt;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){let receipt=await observeRelease();if(process.argv.includes('--allow-equivalent-backend-tree'))receipt=await proveBackendEquivalence(receipt,process.argv[2]);const result=validateRelease(receipt,process.argv[2]);console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1;}
