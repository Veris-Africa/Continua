import {pathToFileURL} from 'node:url';
const checks=[['backend','https://continua-backend.onrender.com/api/v1/health/live'],['frontend','https://continua.cypriankiprop41.workers.dev/'],['market','https://continua.cypriankiprop41.workers.dev/api/v1/indices?exchange=NSE'],['auth','https://ep-nameless-voice-b4ygobrp.neonauth.c-6.us-east-2.aws.neon.tech/neondb/auth/.well-known/jwks.json']];
export async function probe(name,url,{request=fetch,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms)),random=Math.random}={}){
 let ok=false,status=0,attempts=0;
 for(let attempt=0;attempt<3;attempt++){
  attempts++;
  try{const response=await request(url,{redirect:'error',signal:AbortSignal.timeout(25000),headers:{Accept:name==='frontend'?'text/html':'application/json'}});status=response.status;
   if(!response.ok){await response.body?.cancel();if(status>=400&&status<500&&status!==408)break;throw Error('http_failure');}
   if(name==='frontend'){ok=/text\/html/i.test(response.headers.get('Content-Type')??'');await response.body?.cancel();}
   else {const reader=response.body.getReader();let size=0;const parts=[];for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>131072){await reader.cancel();throw Error('response_limit');}parts.push(value);}const data=JSON.parse(Buffer.concat(parts).toString('utf8'));ok=name==='auth'?Array.isArray(data.keys)&&data.keys.length>0:name==='market'?Array.isArray(data.data):data.status==='alive'||data.status==='ok'||data.status==='healthy'||data.success===true;}
   if(ok)break;
  }catch{/* No upstream bodies, credentials or personal data in public logs. */}
  if(attempt<2)await wait(2000*2**attempt+Math.floor(random()*1000));
 }
 return {check:name,ok,status,attempts};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 let failed=false;
 for(const [name,url]of checks){const result=await probe(name,url);console.log(JSON.stringify(result));if(!result.ok)failed=true;}
 if(failed)process.exitCode=1;
}
