const kinds=new Set(['javascript','promise','render','network','auth','route']);
const routes=new Set(['home','markets','stock','track-investments','watchlist','traders-hub','account','engine','auth','checkout','upgrade']);
let minute=-1,accepted=0;
export async function browserErrorReport(request,env){
 const url=new URL(request.url);if(url.pathname!=='/api/telemetry/errors')return null;
 const reply=status=>new Response(null,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 if(env.BROWSER_ERROR_REPORTS_ENABLED!=='true')return reply(404);
 if(request.method!=='POST')return reply(405);
 if(request.headers.get('Origin')!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site')return reply(403);
 if(!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type')??''))return reply(415);
 const current=Math.floor(Date.now()/60000);if(current!==minute){minute=current;accepted=0;}if(accepted>=60)return reply(429);
 const ip=request.headers.get('CF-Connecting-IP');
 try{if(!ip||!env.EDGE_RATE_LIMIT||!(await env.EDGE_RATE_LIMIT.limit({key:'telemetry:'+ip})).success)return reply(429);}catch{return reply(503);}
 let bytes=0;const chunks=[],reader=request.body?.getReader();
 try{if(reader)for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>1024){await reader.cancel();return reply(413);}chunks.push(value);}
  const raw=new Uint8Array(bytes);let at=0;for(const x of chunks){raw.set(x,at);at+=x.length;}const event=JSON.parse(new TextDecoder().decode(raw));
  if(!event||Object.keys(event).sort().join(',')!=='browser,device,kind,revision,route,timestamp'||!kinds.has(event.kind)||!routes.has(event.route)||!['chromium','firefox','safari','other'].includes(event.browser)||!['mobile','desktop','other'].includes(event.device)||!(typeof event.revision==='string'&&(event.revision==='unknown'||/^[a-f0-9]{40}$/i.test(event.revision)))||typeof event.timestamp!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(event.timestamp)||!Number.isFinite(Date.parse(event.timestamp))||Math.abs(Date.now()-Date.parse(event.timestamp))>300000)return reply(400);
  accepted++;console.warn(JSON.stringify({event:'browser_error',kind:event.kind,route:event.route,revision:event.revision,browser:event.browser,device:event.device,at:new Date().toISOString(),untrustedClientReport:true}));return reply(204);
 }catch{return reply(400);}
}
