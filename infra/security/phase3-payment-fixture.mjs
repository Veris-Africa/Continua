// Called ONLY by the labelled disposable PostgreSQL harness; never opens a connection.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {createPaymentOperations} from '../../backend/src/services/paymentOperations.js';
import {paymentOperationsStatus} from '../../backend/src/monitoring/paymentOperationsStatus.js';

export async function phase3PaymentFixture({pool,read,ids}){
 assert.equal((await pool.query('SELECT current_database() name')).rows[0].name,'continua_phase2_fixture');
 let checks=0,queries=0,resultValueBytes=0,providerGets=0,providerPosts=0,failAckOnce=false,peakConnections=0,peakQueuedQueries=0;
 const check=(a,b)=>{assert.deepEqual(a,b);checks++;};
 const database={query:async(...args)=>{queries++;if(failAckOnce&&String(args[0]).startsWith('UPDATE operations.payment_work SET status=$3')){failAckOnce=false;throw Error('simulated crash after verified fulfillment before receipt acknowledgement');}const operation=pool.query(...args);peakConnections=Math.max(peakConnections,pool.totalCount);peakQueuedQueries=Math.max(peakQueuedQueries,pool.waitingCount);const r=await operation;resultValueBytes+=Buffer.byteLength(JSON.stringify(r.rows));return r;}};
 await pool.query((await read('supabase/migrations/20261012220000_native_payment_attempts.sql')).replaceAll('REFERENCES auth.users(id)','REFERENCES app_identity.users(id)'));
 await pool.query(await read('infra/neon/security/phase3-payment-operations.sql'));
 for(const role of ['anon','authenticated']){
  check((await pool.query("SELECT has_schema_privilege($1,'operations','USAGE') allowed",[role])).rows[0].allowed,false);
  const c=await pool.connect();try{await c.query('SET ROLE '+role);await assert.rejects(c.query('SELECT * FROM operations.payment_work'),/permission denied/);checks++;}finally{await c.query('RESET ROLE');c.release();}
 }
 const reference='continua-live-'+randomUUID(),owner=ids[1];
 await pool.query(`INSERT INTO public.paystack_native_attempts(reference,user_id,email,mode,plan,cycle,method,amount_minor,intent_id,request_hash)
 VALUES($1,$2,'synthetic@example.test','live','premium','monthly','card',80000,$3,'synthetic')`,[reference,owner,randomUUID()]);
 await pool.query(`INSERT INTO public.paystack_live_orders(reference,user_id,email,plan,cycle,amount_minor,terms_version,terms_accepted_at)
 VALUES($1,$2,'synthetic@example.test','premium','monthly',80000,'2026-10-12',now())`,[reference,owner]);
 const {pool:appPool}=await import('../../backend/src/storage/db.js');appPool.query=(...args)=>database.query(...args);appPool.connect=(...args)=>pool.connect(...args);
 const {verifyNativeCheckout}=await import('../../backend/src/services/paystackNative.js');
 const {verifyLiveCheckout}=await import('../../backend/src/services/paystackLive.js');
 const originalFetch=globalThis.fetch;
 globalThis.fetch=async(url,options)=>{
  if(options?.method!=='GET'){providerPosts++;throw Error('Fixture forbids provider charge/init POST');}
  assert.equal(url,'https://api.paystack.co/transaction/verify/'+reference);providerGets++;
  return Response.json({status:true,data:{id:9001,reference,domain:'live',amount:80000,currency:'KES',status:'success',paid_at:new Date().toISOString(),customer:{email:'synthetic@example.test'},metadata:{continua_reference:reference,continua_user:owner,mode:'live'}}});
 };
 const api=createPaymentOperations({database,verifyNative:verifyNativeCheckout,verifyHosted:verifyLiveCheckout,random:()=>.5});
 const event={event:'charge.success',data:{id:9001,reference,domain:'live',status:'success',customer:{email:'not-persisted@example.test'}}};
 const started=performance.now();let baseline;const intakeLatencies=[];
 try{
  await api.accept({event:'refund.pending',data:{id:56,transaction:{reference}}},'live');
  check((await pool.query('SELECT public.effective_subscription_plan($1) plan',[owner])).rows[0].plan,'free');
  const receipts=await Promise.all(Array.from({length:30},async()=>{const t=performance.now();const r=await api.accept(event,'live');intakeLatencies.push(performance.now()-t);return r;}));
  check(new Set(receipts.map(r=>r.id)).size,1);
  check((await pool.query('SELECT deliveries FROM operations.payment_work WHERE id=$1',[receipts[0].id])).rows[0].deliveries,30);
  // Callback races several independent drainers; fulfillment remains atomic.
  failAckOnce=true;
  const raced=await Promise.allSettled([verifyNativeCheckout(reference),...Array.from({length:6},()=>api.drain({limit:1}))]);
  check(raced.filter(r=>r.status==='rejected').length,1);
  const beforeRecovery=(await pool.query('SELECT expires_at,receipt_number FROM public.paystack_live_orders WHERE reference=$1',[reference])).rows[0];
  check((await pool.query('SELECT status FROM operations.payment_work WHERE id=$1',[receipts[0].id])).rows[0].status,'processing');
  await pool.query("UPDATE operations.payment_work SET lease_until=now()-interval '1 second' WHERE id=$1",[receipts[0].id]);
  check((await api.drain({limit:1})).completed,1);
  check((await pool.query('SELECT expires_at,receipt_number FROM public.paystack_live_orders WHERE reference=$1',[reference])).rows[0],beforeRecovery);
  check((await pool.query('SELECT status FROM operations.payment_work WHERE id=$1',[receipts[0].id])).rows[0].status,'completed');
  const paid=(await pool.query('SELECT expires_at,receipt_number FROM public.paystack_live_orders WHERE reference=$1',[reference])).rows[0];
  baseline=paid;await verifyNativeCheckout(reference);
  check((await pool.query('SELECT expires_at,receipt_number FROM public.paystack_live_orders WHERE reference=$1',[reference])).rows[0],paid);
  check(providerPosts,0);
 }finally{globalThis.fetch=originalFetch;}
 // Simulated restarts use independent instances sharing only SQL state.
 const pendingRef='continua-test-'+randomUUID(),pendingEvent={event:'charge.success',data:{reference:pendingRef}};
 const receipt=await api.accept(pendingEvent,'test');
 const old=await api.claim();check(old.id,receipt.id);
 await pool.query("UPDATE operations.payment_work SET lease_until=now()-interval '1 second' WHERE id=$1",[old.id]);
 const restarted=createPaymentOperations({database,verifyNative:async()=>({mode:'test',status:'pending'}),random:()=>.5});
 const fresh=await restarted.claim();check(fresh.id,old.id);check(fresh.attempts,2);check(fresh.lease_id===old.lease_id,false);
 check(await api.finish(old,'completed'),false);check(await restarted.finish(fresh,'retry','provider_pending'),true);
 check((await pool.query('SELECT next_attempt_at>now() delayed FROM operations.payment_work WHERE id=$1',[fresh.id])).rows[0].delayed,true);
 // A pending/failed verification does not create a second provider charge.
 await pool.query("UPDATE operations.payment_work SET attempts=11,next_attempt_at=now() WHERE id=$1",[fresh.id]);
 check((await restarted.drain({limit:1})).review,1);
 check((await pool.query('SELECT error_category FROM operations.payment_work WHERE id=$1',[fresh.id])).rows[0].error_category,'retry_exhausted');
 // Old unresolved work and unknown references become visible review, not silent discard.
 const expired=await api.accept({event:'charge.success',data:{reference:'continua-test-'+randomUUID()}},'test');
 await pool.query("UPDATE operations.payment_work SET first_received_at=now()-interval '49 hours' WHERE id=$1",[expired.id]);
 await restarted.claim();check((await pool.query('SELECT error_category FROM operations.payment_work WHERE id=$1',[expired.id])).rows[0].error_category,'verification_window_expired');
 const unknown=createPaymentOperations({database,verifyNative:async()=>{throw Object.assign(Error('not found'),{status:404});}});
 await api.accept({event:'charge.success',data:{reference:'continua-test-'+randomUUID()}},'test');check((await unknown.drain({limit:1})).review,1);
 const outage=createPaymentOperations({database,verifyNative:async()=>{throw Error('synthetic verification outage');}});
 const transient=await api.accept({event:'charge.success',data:{reference:'continua-test-'+randomUUID()}},'test');
 check((await outage.drain({limit:1})).retry,1);
 check((await pool.query('SELECT status FROM operations.payment_work WHERE id=$1',[transient.id])).rows[0].status,'retry');
 const refund=await api.accept({event:'refund.processed',data:{id:55,transaction:{reference}}},'live');check(refund.status,'review');
 check((await pool.query('SELECT expires_at,receipt_number FROM public.paystack_live_orders WHERE reference=$1',[reference])).rows[0],baseline);
 const events=[];await paymentOperationsStatus(database,{trackTransitions:true,report:e=>events.push(e)});const first=events.length;
 await paymentOperationsStatus(database,{trackTransitions:true,report:e=>events.push(e)});check(events.length,first);
 // Renewal enqueue is part of the financial reservation transaction and survives restart.
 await api.enqueueRenewal(pool,reference,'live');await api.enqueueRenewal(pool,reference,'live');
 check((await pool.query("SELECT count(*)::int n FROM operations.payment_work WHERE kind='renewal' AND reference=$1",[reference])).rows[0].n,1);
 const renewal=(await pool.query("SELECT * FROM operations.payment_work WHERE kind='renewal' AND reference=$1",[reference])).rows[0];
 check(new Date(renewal.next_attempt_at).getTime()>Date.now(),true);
 await api.initiationFinished(reference);
 const reconcile=createPaymentOperations({database,verifyNative:async()=>({mode:'live',status:'paid'})});check((await reconcile.drain({limit:1})).completed,1);
 // Exercise the worker's actual reservation SQL through independent connections.
 const {env}=await import('../../backend/src/config/index.js');env.PAYMENT_DURABILITY_ENABLED=true;
 const {reserveCardRenewal,dueCardRenewals}=await import('../../backend/src/workers/cardRenewalWorker.js');
 const transaction=async fn=>{const c=await pool.connect();try{await c.query('BEGIN');const r=await fn(c);await c.query('COMMIT');return r;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}};
 const consent=async id=>{const ref='continua-live-'+randomUUID();await pool.query(`INSERT INTO public.paystack_native_attempts(reference,user_id,email,mode,plan,cycle,method,amount_minor,intent_id,request_hash,state) VALUES($1,$2,'synthetic@example.test','live','premium_plus','monthly','card',100000,$3,'consent-fixture','paid')`,[ref,id,randomUUID()]);await pool.query(`INSERT INTO public.paystack_card_renewals(user_id,mode,email,plan,authorization_cipher,consent_reference,next_charge_at) VALUES($1,'live','synthetic@example.test','premium_plus','fixture-unused',$2,now()-interval '1 hour')`,[id,ref]);return ref;};
 await consent(ids[2]);
 const reservations=await Promise.all(Array.from({length:12},()=>reserveCardRenewal({user_id:ids[2],mode:'live'},{transaction})));
 check(reservations.filter(r=>r.initiate).length,1);check(new Set(reservations.map(r=>r.reference)).size,1);
 check((await pool.query(`SELECT count(*)::int n FROM operations.payment_work WHERE kind='renewal' AND reference=$1`,[reservations[0].reference])).rows[0].n,1);
 await consent(ids[0]);
 await assert.rejects(reserveCardRenewal({user_id:ids[0],mode:'live'},{transaction:fn=>transaction(async db=>{await fn(db);throw Error('simulated crash before commit');})}),/simulated crash/);checks++;
 check((await pool.query('SELECT active_reference FROM public.paystack_card_renewals WHERE user_id=$1',[ids[0]])).rows[0].active_reference,null);
 check((await pool.query("SELECT count(*)::int n FROM public.paystack_native_attempts WHERE user_id=$1",[ids[0]])).rows[0].n,1);
 const committed=await reserveCardRenewal({user_id:ids[0],mode:'live'},{transaction});
 const afterLostAcknowledgement=await reserveCardRenewal({user_id:ids[0],mode:'live'},{transaction});check(committed.initiate,true);check(afterLostAcknowledgement.initiate,false);check(afterLostAcknowledgement.reference,committed.reference);
 await consent(ids[1]);env.PAYSTACK_NATIVE_MODE='live';
 const due=(await dueCardRenewals()).rows;check(due.map(r=>r.user_id),[ids[1]]);
 env.PAYSTACK_NATIVE_MODE='test';
 env.PAYMENT_DURABILITY_ENABLED=false;
 const {runDurableMaintenance}=await import('../../backend/src/workers/durableMaintenance.js');
 let executions=0;const maintenanceResults=await Promise.all(Array.from({length:12},()=>runDurableMaintenance(database,async()=>{executions++;return {fixture:true};})));
 check(executions,1);check(maintenanceResults.filter(r=>r.maintenance==='completed').length,1);
 // A process can die after its business work; expired leases are reclaimable and fenced.
 await pool.query("UPDATE operations.periodic_jobs SET next_due_at=now()-interval '1 hour' WHERE name='application-maintenance'");
 let entered,release;const entry=new Promise(r=>entered=r),hold=new Promise(r=>release=r);
 const oldJob=runDurableMaintenance(database,async()=>{entered();await hold;return {old:true};});await entry;
 await pool.query("UPDATE operations.periodic_jobs SET lease_until=now()-interval '1 second' WHERE name='application-maintenance'");
 check((await runDurableMaintenance(database,async()=>({restarted:true}))).maintenance,'completed');release();check((await oldJob).maintenance,'lease-lost');
 await pool.query("UPDATE operations.periodic_jobs SET status='retry',attempts=5,next_due_at=now() WHERE name='application-maintenance'");
 let unexpected=false;await runDurableMaintenance(database,async()=>{unexpected=true;});check(unexpected,false);
 check((await pool.query("SELECT status FROM operations.periodic_jobs WHERE name='application-maintenance'")).rows[0].status,'review');
 await assert.rejects(runDurableMaintenance({query:async()=>{throw Error('synthetic outage');}},async()=>{}),/synthetic outage/);checks++;
 // A lost webhook/callback for an old known checkout is recovered by GET only.
 const orphan='continua-live-'+randomUUID();
 await pool.query(`INSERT INTO public.paystack_live_orders(reference,user_id,email,plan,cycle,amount_minor,terms_version,terms_accepted_at,created_at) VALUES($1,$2,'synthetic@example.test','premium','monthly',80000,'2026-10-12',now(),now()-interval '2 minutes')`,[orphan,ids[1]]);
 await api.accept({event:'invoice.update',data:{id:222,reference:orphan}},'live');
 const seeded=await api.seedRecovery();check(seeded.hosted>=1,true);
 check((await pool.query("SELECT kind FROM operations.payment_work WHERE reference=$1 AND kind='hosted'",[orphan])).rows[0].kind,'hosted');
 check((await api.seedRecovery()).hosted,0);
 // Dedicated SQL role isolation; no event payload columns or card data are stored.
 check((await pool.query("SELECT count(*)::int n FROM information_schema.columns WHERE table_schema='operations' AND column_name IN ('payload','email','authorization_code','card','customer')")).rows[0].n,0);
 const sorted=intakeLatencies.sort((a,b)=>a-b);
 const metrics={poolMaximum:pool.options.max,peakConnections,peakQueuedQueries,sqlIntakeMedianMs:Math.round(sorted[Math.floor(sorted.length*.5)]),sqlIntakeP95Ms:Math.round(sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))]),checks,durationMs:Math.round(performance.now()-started),queries,resultValueBytes,providerGets,providerPosts,concurrentDuplicateDeliveries:30,concurrentDrainers:6,productionTouched:false};
 console.log(JSON.stringify({phase3PaymentFixture:metrics,passed:true}));return metrics;
}
