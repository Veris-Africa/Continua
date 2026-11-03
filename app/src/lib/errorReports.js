const kinds=new Set(['javascript','promise','render','network','auth','route']);
export function safePage(path){return /^\/(markets|stock|track-investments|watchlist|traders-hub|account|engine|auth|checkout|upgrade)(?:\/|$)/.exec(path)?.[1]??'home';}
// Opt in only after privacy review. No messages, stacks, URLs, identities or state.
export function createErrorReporter({enabled=false,send=()=>{},now=Date.now,route=()=>location.pathname,revision='unknown',browser='other',device='other'}={}){
 let minute=-1,count=0,total=0;const seen=new Set();
 return kind=>{
  if(!enabled||!kinds.has(kind)||total>=20)return false;
  const current=Math.floor(now()/60000);if(current!==minute){minute=current;count=0;seen.clear();}
  const page=safePage(route()),key=kind+':'+page;
  if(count>=5||seen.has(key))return false;
  count++;total++;seen.add(key);
  const event={kind,route:page,revision:/^[a-f0-9]{40}$/i.test(revision)?revision:'unknown',browser:['chromium','firefox','safari'].includes(browser)?browser:'other',device:['mobile','desktop'].includes(device)?device:'other',timestamp:new Date(now()).toISOString()};
  try{Promise.resolve(send(event)).catch(()=>{});}catch{/* Never retry or fail application work. */}
  return true;
 };
}
let reporter=()=>false;
export const reportAppError=kind=>reporter(kind);
export function installErrorReports({enabled=false,revision='unknown'}={}){
 if(!enabled||typeof window==='undefined'||navigator.doNotTrack==='1')return ()=>{};
 const original=window.fetch;
 const ua=navigator.userAgent;
 reporter=createErrorReporter({enabled,revision,browser:/Firefox/.test(ua)?'firefox':/Chrome|Chromium|Edg/.test(ua)?'chromium':/Safari/.test(ua)?'safari':'other',device:/Mobile|Android/.test(ua)?'mobile':'desktop',send:event=>original('/api/telemetry/errors',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',redirect:'error',body:JSON.stringify(event),signal:AbortSignal.timeout(2000)}).then(r=>r.body?.cancel())});
 const onError=()=>reporter('javascript'),onReject=()=>reporter('promise');
 window.addEventListener('error',onError);window.addEventListener('unhandledrejection',onReject);
 const observed=async(...args)=>{
  let url;try{url=new URL(typeof args[0]==='string'?args[0]:args[0] instanceof Request?args[0].url:String(args[0]),location.origin);}catch{}
  const eligible=url?.origin===location.origin&&url.pathname.startsWith('/api/')&&!url.pathname.startsWith('/api/telemetry/');
  try{const response=await original.apply(window,args);if(eligible&&response.status>=500)reporter(url.pathname.includes('/identity/')?'auth':'network');return response;}
  catch(error){if(eligible&&error?.name!=='AbortError')reporter('network');throw error;}
 };
 window.fetch=observed;
 return ()=>{window.removeEventListener('error',onError);window.removeEventListener('unhandledrejection',onReject);if(window.fetch===observed)window.fetch=original;reporter=()=>false;};
}
