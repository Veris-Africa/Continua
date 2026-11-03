import {createHash,randomUUID} from 'node:crypto';

const referencePattern=/^continua-(live|test)-[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const reviewEvents=new Set(['charge.dispute.create','charge.dispute.remind','charge.dispute.resolve','refund.failed','refund.pending','refund.processed','refund.processing','subscription.disable','subscription.not_renew','invoice.payment_failed']);
const informationalEvents=new Set(['invoice.create','invoice.update','subscription.create','subscription.expiring_cards']);
const ignoredEvents=new Set(['transfer.failed','transfer.success','transfer.reversed','customeridentification.failed','customeridentification.success','dedicatedaccount.assign.failed','dedicatedaccount.assign.success','paymentrequest.pending','paymentrequest.success']);
const hash=value=>createHash('sha256').update(value).digest('hex');
const fail=(status,message)=>Object.assign(new Error(message),{status});
export function classifyPaymentEvent(event,mode){
 if(!event||typeof event!=='object'||Array.isArray(event)||!['live','test'].includes(mode)||typeof event.event!=='string'||!/^[a-z][a-z0-9_.]{0,79}$/.test(event.event))throw fail(400,'Invalid payment event');
 const data=event.data&&typeof event.data==='object'?event.data:{};
 const rawReference=data.reference??data.transaction?.reference;
 const reference=typeof rawReference==='string'&&referencePattern.test(rawReference)?rawReference:null;
 if(reference&&!reference.startsWith('continua-'+mode+'-')||typeof data.domain==='string'&&data.domain!==mode)throw fail(401,'Payment signature mode mismatch');
 const providerId=typeof data.id==='number'&&Number.isSafeInteger(data.id)&&data.id>0?String(data.id):typeof data.id==='string'&&/^[A-Za-z0-9_-]{1,64}$/.test(data.id)?data.id:null;
 const classification=event.event==='charge.success'?(reference?'actionable':'review'):reviewEvents.has(event.event)?'review':informationalEvents.has(event.event)?'informational':ignoredEvents.has(event.event)?'ignored':'review';
 // Hash the semantic receipt, not an entire card/customer payload. Unknown events
 // use a bounded digest to distinguish otherwise unidentifiable deliveries.
 const state=typeof data.status==='string'&&/^[a-z_]{1,40}$/.test(data.status)?data.status:null;
 return {mode,eventType:event.event,providerId,reference,classification,fingerprint:hash(JSON.stringify([mode,event.event,providerId,reference,state,providerId||reference?null:hash(JSON.stringify(event))]))};
}
export function paymentRetryDelay(attempt,random=Math.random){
 return Math.min(21600000,60000*2**Math.min(10,Math.max(0,attempt-1))*(.8+.4*Math.min(1,Math.max(0,random()))));
}
export function createPaymentOperations({database,verifyNative,verifyHosted,now=()=>Date.now(),random=Math.random}){
 async function accept(event,mode){
  const input=classifyPaymentEvent(event,mode);
  const status=input.classification==='actionable'?'pending':input.classification==='informational'?'completed':input.classification==='ignored'?'ignored':'review';
  const error=input.classification==='review'?(reviewEvents.has(input.eventType)?'policy_review':input.eventType==='charge.success'?'unknown_reference':'unsupported_event'):null;
  const result=await database.query(`INSERT INTO operations.payment_work(kind,mode,fingerprint,event_type,provider_event_id,reference,classification,status,error_category,completed_at)
   VALUES('webhook',$1,$2,$3,$4,$5,$6,$7,$8,CASE WHEN $7 IN ('completed','ignored') THEN now() END)
   ON CONFLICT(fingerprint) DO UPDATE SET last_received_at=now(),deliveries=LEAST(1000000000,operations.payment_work.deliveries+1)
   RETURNING id::text,status`,[mode,input.fingerprint,input.eventType,input.providerId,input.reference,input.classification,status,error]);
  if(result.rowCount!==1)throw fail(503,'Payment receipt could not be persisted');
  return result.rows[0];
 }
 async function enqueueRenewal(client,reference,mode){
  if(!referencePattern.test(reference)||!reference.startsWith('continua-'+mode+'-'))throw fail(400,'Invalid renewal reference');
  await client.query(`INSERT INTO operations.payment_work(kind,mode,fingerprint,event_type,reference,classification,first_received_at,next_attempt_at)
   SELECT 'renewal',$2,$3,'renewal.verify',reference,'actionable',created_at,now()+interval '90 seconds' FROM public.paystack_native_attempts WHERE reference=$1 AND mode=$2
   ON CONFLICT DO NOTHING`,[reference,mode,hash('renewal:'+reference)]);
 }
 async function seedRecovery({limit=20}={}){
  if(!Number.isInteger(limit)||limit<1||limit>20)throw fail(400,'Invalid reconciliation budget');
  // Catch known orders whose webhook/callback was lost during service sleep.
  // Only safe verification is scheduled; no charge or initialization is repeated.
  const native=await database.query(`INSERT INTO operations.payment_work(kind,mode,fingerprint,event_type,reference,classification,first_received_at)
   SELECT 'native',a.mode,encode(sha256(convert_to('native:'||a.reference,'UTF8')),'hex'),'checkout.verify',a.reference,'actionable',a.created_at
   FROM public.paystack_native_attempts a WHERE a.state IN ('creating','pending','unknown') AND a.created_at<now()-interval '90 seconds'
   AND NOT EXISTS(SELECT 1 FROM operations.payment_work w WHERE w.reference=a.reference AND w.classification='actionable')
   ORDER BY a.created_at,a.reference LIMIT $1 ON CONFLICT DO NOTHING RETURNING id`,[limit]);
  const hosted=await database.query(`INSERT INTO operations.payment_work(kind,mode,fingerprint,event_type,reference,classification,first_received_at)
   SELECT 'hosted','live',encode(sha256(convert_to('hosted:'||o.reference,'UTF8')),'hex'),'checkout.verify',o.reference,'actionable',o.created_at
   FROM public.paystack_live_orders o WHERE o.status='pending' AND o.created_at<now()-interval '90 seconds'
   AND NOT EXISTS(SELECT 1 FROM public.paystack_native_attempts a WHERE a.reference=o.reference)
   AND NOT EXISTS(SELECT 1 FROM operations.payment_work w WHERE w.reference=o.reference AND w.classification='actionable')
   ORDER BY o.created_at,o.reference LIMIT $1 ON CONFLICT DO NOTHING RETURNING id`,[limit]);
  return {native:native.rowCount,hosted:hosted.rowCount};
 }
 async function initiationFinished(reference){
  // A crash before this update simply leaves a delayed verification, never a retry POST.
  await database.query("UPDATE operations.payment_work SET next_attempt_at=now() WHERE kind='renewal' AND reference=$1 AND status='pending'",[reference]);
 }
 async function claim(){
  const lease=randomUUID();
  // Exhausted crashed leases also become visible; they cannot sit permanently processing.
  await database.query(`WITH expired AS (SELECT id FROM operations.payment_work WHERE (status IN ('pending','retry') OR (status='processing' AND lease_until<now())) AND (attempts>=12 OR first_received_at<now()-interval '48 hours') ORDER BY first_received_at,id FOR UPDATE SKIP LOCKED LIMIT 50) UPDATE operations.payment_work SET status='review',lease_id=NULL,lease_until=NULL,error_category=CASE WHEN first_received_at<now()-interval '48 hours' THEN 'verification_window_expired' ELSE 'retry_exhausted' END
   WHERE id IN (SELECT id FROM expired)`);
  const r=await database.query(`WITH candidate AS (SELECT id FROM operations.payment_work WHERE classification='actionable' AND attempts<12 AND first_received_at>=now()-interval '48 hours'
   AND ((status IN ('pending','retry') AND next_attempt_at<=now()) OR (status='processing' AND lease_until<now())) ORDER BY next_attempt_at,id FOR UPDATE SKIP LOCKED LIMIT 1)
   UPDATE operations.payment_work w SET status='processing',lease_id=$1,lease_until=now()+interval '180 seconds',last_attempt_at=now(),attempts=attempts+1
   FROM candidate c WHERE w.id=c.id RETURNING w.*`,[lease]);
  return r.rows[0]??null;
 }
 async function finish(work,status,category=null){
  const r=await database.query(`UPDATE operations.payment_work SET status=$3,error_category=$4,lease_id=NULL,lease_until=NULL,
   next_attempt_at=now()+($5::double precision*interval '1 millisecond'),completed_at=CASE WHEN $3='completed' THEN now() ELSE completed_at END
   WHERE id=$1 AND lease_id=$2 AND status='processing' AND lease_until>now() RETURNING id`,[work.id,work.lease_id,status,category,paymentRetryDelay(work.attempts,random)]);
  return r.rowCount===1;
 }
 async function drain({limit=2,budgetMs=40000}={}){
  if(!Number.isInteger(limit)||limit<1||limit>5||!Number.isFinite(budgetMs)||budgetMs<1||budgetMs>45000)throw fail(400,'Invalid payment work budget');
  const started=now(),stats={claimed:0,completed:0,retry:0,review:0,lostLease:0};
  for(let i=0;i<limit&&now()-started<budgetMs;i++){
   const work=await claim();if(!work)break;stats.claimed++;
   let status='retry',category='dependency_unavailable';
   try{
    let result;
    try{result=await verifyNative(work.reference);}catch(error){if(error.status!==404||work.mode!=='live'||!['webhook','hosted'].includes(work.kind))throw error;result=await verifyHosted(work.reference);}
    if(result.mode!==work.mode)throw fail(409,'Verification mode mismatch');
    if(result.status==='paid'){status='completed';category=null;}
    else if(work.kind!=='webhook'&&['failed','abandoned','reversed'].includes(result.status)){status='completed';category=null;}
    else if(['failed','abandoned','reversed'].includes(result.status)){status='review';category='verification_conflict';}
    else category='provider_pending';
   }catch(error){if(error.status===404){status='review';category='unknown_reference';}else if([400,401,403,409].includes(error.status)){status='review';category='verification_conflict';}}
   if(status==='retry'&&(work.attempts>=12||now()-new Date(work.first_received_at).getTime()>=172800000)){status='review';category=work.attempts>=12?'retry_exhausted':'verification_window_expired';}
   if(await finish(work,status,category))stats[status]++;else stats.lostLease++;
  }
  return {...stats,durationMs:Math.max(0,now()-started)};
 }
 return {accept,enqueueRenewal,seedRecovery,initiationFinished,claim,finish,drain};
}
