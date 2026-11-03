// Policy evaluates already collected aggregates. It never probes dependencies.
export function evaluateSignals({requests,providerUsage,payments}={},now=Date.now()){
 const signals=[];
 const add=(category,state,severity='warning')=>signals.push({category,state,severity});
 const rows=requests?.series??[];
 for(const group of ['market','data','identity','engine']){
  const categories={market:['market','markets','quotes','indices','instruments','stocks','securities','financials','companies','sectors','news','historical','price-history','research','movers','statistics'],data:['data','functions'],identity:['identity'],engine:['engine','valuation','backtest']}[group];
  const matched=rows.filter(r=>categories.some(category=>r.key.startsWith(`request:/api/v1/${category}/*:`))&&r.key.endsWith(':warm'));
  const n=matched.reduce((a,r)=>a+r.count,0),failed=matched.reduce((a,r)=>a+r.failures,0);
  add('api_'+group+'_errors',n<100?'unavailable':failed/n>.05?'warning':'clear','critical');
  const threshold=group==='engine'?5000:group==='market'?1000:2500;
  add('api_'+group+'_latency',!matched.some(r=>r.p95UpperMs!==null)?'unavailable':matched.some(r=>r.p95UpperMs>threshold)?'warning':'clear');
 }
 for(const dependency of ['auth','pool','database','paystack']){
  const r=rows.find(x=>x.key==='dependency:'+dependency);
  add('dependency_'+dependency,!r||r.count<20?'unavailable':r.failures/r.count>.05?'warning':'clear',dependency==='auth'?'critical':'warning');
 }
 const p=providerUsage;
 const valid=p?.source==='neon-console'&&Number.isFinite(p.transferBytes)&&p.transferBytes>=0&&Number.isFinite(p.allowanceBytes)&&p.allowanceBytes>0&&Number.isFinite(Date.parse(p.observedAt))&&now-Date.parse(p.observedAt)>=0&&now-Date.parse(p.observedAt)<26*3600000;
 add('neon_quota',!valid?'unavailable':p.transferBytes/p.allowanceBytes>=.9?'critical':p.transferBytes/p.allowanceBytes>=.7?'warning':'clear','critical');
 const previous=p?.previous;
 const hours=previous?(Date.parse(p.observedAt)-Date.parse(previous.observedAt))/3600000:0;
 const growth=valid&&hours>=1&&previous.period===p.period&&p.transferBytes>=previous.transferBytes?(p.transferBytes-previous.transferBytes)/hours:null;
 add('neon_growth',growth===null?'unavailable':growth>p.allowanceBytes*.1/24?'warning':'clear');
 add('payment_metrics',payments?.enabled!==true||!payments.categories?'unavailable':'clear');
 if(payments?.enabled===true)for(const key of ['payment_review','payment_backlog','payment_expired_leases','maintenance_overdue','ingestion_backlog','ingestion_retry_exhausted','ingestion_expired_leases','ingestion_unavailable'])add(key,typeof payments.categories?.[key]!=='boolean'?'unavailable':payments.categories[key]?'warning':'clear');
 return signals;
}
export function createAlertTransitions({load,save,notify,now=Date.now,cooldownMs=900000}){
 let pending;
 return signals=>pending??=(async()=>{
  const prior=await load(),state={...prior};let sent=0,failed=0;
  for(const signal of signals.slice(0,32)){
   if(!/^[a-z_]{1,64}$/.test(signal.category)||!['clear','warning','critical','unavailable'].includes(signal.state))continue;
   const old=state[signal.category],current=now();
   if(!old&&signal.state==='clear'){state[signal.category]={delivered:'clear',observed:'clear',lastSent:0};continue;}
   if(old?.delivered===signal.state){state[signal.category]={...old,observed:signal.state};continue;}
   if(old&&current-(old.lastSent??0)<cooldownMs||current<(old?.retryAfter??0)){state[signal.category]={...old,observed:signal.state};continue;}
   try{await notify({category:signal.category,state:signal.state,severity:['warning','critical'].includes(signal.severity)?signal.severity:'warning'});state[signal.category]={delivered:signal.state,observed:signal.state,lastSent:current};sent++;}
   catch{state[signal.category]={...old,observed:signal.state,retryAfter:current+300000};failed++;}
  }
  await save(state);return {sent,failed};
 })().finally(()=>{pending=undefined;});
}
