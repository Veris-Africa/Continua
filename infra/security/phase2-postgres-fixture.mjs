// Starts/removes ONLY its own labelled disposable LOCAL PostgreSQL container.
// Never reads DATABASE_URL, cloud credentials or production customer data.
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import pg from '../../backend/node_modules/pg/lib/index.js';
const docker=args=>execFileSync('docker',args,{encoding:'utf8',windowsHide:true,timeout:30000}).trim();
const preDdl=process.argv.includes('--pre-ddl');
let container,pool;let checks=0;
const originalExit=process.exit;
process.exit=code=>{throw Error('Fixture module requested early exit: '+code);};
const check=(a,b)=>{assert.deepEqual(a,b);checks++;};
const read=path=>readFile(new URL('../../'+path,import.meta.url),'utf8');
const ids=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333'];
const claims=id=>({sub:id,role:'authenticated',aal:'aal1'});
try{
 container=docker(['run','--detach','--rm','--label','continua.fixture=phase2','--memory','256m','--cpus','1','--pids-limit','128',
  '--user','70:70','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges',
  '--tmpfs','/tmp:rw,nosuid,noexec,size=16m','--tmpfs','/var/run/postgresql:rw,nosuid,noexec,size=4m,uid=70,gid=70',
  '--tmpfs','/var/lib/postgresql/data:rw,nosuid,noexec,size=128m,uid=70,gid=70,mode=0700',
  '-p','127.0.0.1::5432','-e','POSTGRES_DB=continua_phase2_fixture','-e','POSTGRES_PASSWORD=continua-phase2-fixture-only','postgres:17.11-alpine']);
 if(!/^[a-f0-9]{64}$/.test(container))throw Error('Invalid disposable container');
 const address=docker(['port',container,'5432/tcp']);if(!/^127\.0\.0\.1:\d+$/.test(address))throw Error('Fixture must be loopback only');
 // Wait for the final TCP server, not initdb's temporary Unix-socket server.
 for(let attempt=0;;attempt++){try{docker(['exec',container,'pg_isready','-h','127.0.0.1','-U','postgres','-d','continua_phase2_fixture']);break;}catch(error){if(attempt>=59)throw error;await new Promise(r=>setTimeout(r,250));}}
 pool=new pg.Pool({host:'127.0.0.1',port:Number(address.split(':')[1]),database:'continua_phase2_fixture',user:'postgres',password:'continua-phase2-fixture-only',max:8,connectionTimeoutMillis:3000});
 // Bounded readiness for this newly-created local container only.
 for(let attempt=0;;attempt++){try{await pool.query('SELECT 1');break;}catch(error){if(attempt>=15)throw error;await new Promise(r=>setTimeout(r,250));}}
 check((await pool.query('SELECT current_database() db')).rows[0].db,'continua_phase2_fixture');
 await pool.query(await read('infra/security/phase2-fixture-schema.sql'));
 let billing=(await read('supabase/migrations/20261010210000_paystack_live_checkout.sql')).split("-- Supabase's database scheduler")[0].replaceAll('REFERENCES auth.users(id)','REFERENCES app_identity.users(id)');
 await pool.query(billing);await pool.query(await read('infra/neon/billing-owner-guard.sql'));
 await pool.query('CREATE TRIGGER fixture_paid_guard BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.prevent_self_upgrade()');
 await pool.query(await read('infra/neon/auth-profile-metadata.sql'));
 await pool.query('CREATE TRIGGER fixture_provision AFTER INSERT OR UPDATE ON app_identity.continua_auth_user FOR EACH ROW EXECUTE FUNCTION app_identity.sync_auth_identity()');
 for(const id of ids)await pool.query(`INSERT INTO app_identity.continua_auth_user VALUES($1,'synthetic@example.test','Synthetic',true,'{}',now(),now())`,[id]);
 await pool.query("UPDATE public.profiles SET subscription_plan='premium_plus' WHERE user_id=$1",[ids[2]]);
 if(preDdl)await pool.query(await read('infra/security/phase2-installed-contract-fixture.sql'));
 if(!preDdl){
 // Exercise actual reviewed administrative revokes on all listed relations.
 const privilegeSql=await read('infra/neon/security/phase2-application-privileges.sql');
 const targets=[...privilegeSql.match(/FOREACH target IN ARRAY ARRAY\[([^\]]+)\]/)[1].matchAll(/'([a-z_]+)'/g)].map(m=>m[1]);
 for(const target of targets){await pool.query(`CREATE TABLE IF NOT EXISTS public."${target}"(id uuid)`);await pool.query(`GRANT ALL ON public."${target}" TO anon,authenticated`);}
 await pool.query(`CREATE FUNCTION public.notify_on_like() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $fixture$BEGIN RETURN NEW;END$fixture$; GRANT EXECUTE ON FUNCTION public.notify_on_like() TO service_role; CREATE TRIGGER fixture_notify AFTER INSERT ON public.posts FOR EACH ROW EXECUTE FUNCTION public.notify_on_like();`);
 await pool.query(privilegeSql);
 check((await pool.query("SELECT has_function_privilege('authenticated','public.notify_on_like()','EXECUTE') allowed")).rows[0].allowed,false);
 check((await pool.query("SELECT has_function_privilege('service_role','public.notify_on_like()','EXECUTE') allowed")).rows[0].allowed,true);
 for(const role of ['anon','authenticated'])for(const target of targets)for(const privilege of ['TRUNCATE','TRIGGER','REFERENCES','MAINTAIN'])
  check((await pool.query('SELECT has_table_privilege($1,$2,$3) allowed',[role,'public.'+target,privilege])).rows[0].allowed,false);
 // Production watchlist migration refuses conflicts and never repairs rows.
 await pool.query("INSERT INTO public.watchlist_folders(user_id,name,is_default) VALUES($1,'duplicate A',true),($1,'duplicate B',true)",[ids[1]]);
 await assert.rejects(pool.query(await read('infra/neon/security/phase2-watchlist-integrity.sql')),/conflicts require/);checks++;
 await pool.query('ROLLBACK');check((await pool.query('SELECT count(*)::int n FROM public.watchlist_folders')).rows[0].n,2);
 await pool.query('DELETE FROM public.watchlist_folders'); // disposable fixture rows only
 await pool.query(await read('infra/neon/security/phase2-watchlist-integrity.sql'));
 await pool.query(await read('infra/neon/security/phase2-watchlist-integrity.sql'));
 }
 process.env.NODE_ENV='test';process.env.DATABASE_URL='postgresql://unused:unused@127.0.0.1:1/unused';process.env.LOG_LEVEL='fatal';process.env.CACHE_DRIVER='memory';
 const {ensureDefaultWatchlist}=await import('../../backend/src/data/watchlistIntegrity.js');
 const {compileDataRequest,executeDataRequest}=await import('../../backend/src/data/browserData.js');
 const write=async(table,body,id=ids[0],method='POST',search='')=>executeDataRequest(pool,compileDataRequest({table,method,body,search:new URLSearchParams(search),prefer:'return=representation'}),claims(id));
 const defaults=await Promise.all(Array.from({length:16},()=>ensureDefaultWatchlist(pool,claims(ids[0]))));
 check(new Set(defaults.map(f=>f.id)).size,1);check((await pool.query('SELECT count(*)::int n FROM public.watchlist_folders WHERE user_id=$1',[ids[0]])).rows[0].n,1);
 await assert.rejects(write('watchlist_folders',{user_id:ids[0],name:'Over free quota',is_default:false}),/limit/);checks++;
 const paidResults=await Promise.allSettled(Array.from({length:24},(_,i)=>write('watchlist_folders',{user_id:ids[2],name:'Synthetic '+i,is_default:false},ids[2])));
 check(paidResults.filter(r=>r.status==='fulfilled').length,20);check((await pool.query('SELECT count(*)::int n FROM public.watchlist_folders WHERE user_id=$1',[ids[2]])).rows[0].n,20);
 const existingPaid=(await pool.query('SELECT id,name FROM public.watchlist_folders WHERE user_id=$1 LIMIT 1',[ids[2]])).rows[0];
 check(JSON.parse((await write('watchlist_folders',{id:existingPaid.id,user_id:ids[2],name:existingPaid.name,is_default:false},ids[2])).json)[0].id,existingPaid.id);
 const other=await ensureDefaultWatchlist(pool,claims(ids[1]));
 await assert.rejects(write('watchlists',{user_id:ids[0],folder_id:other.id,symbol:'SCOM',name:'Synthetic'}),/does not belong/);checks++;
 if(!preDdl){await assert.rejects(pool.query('INSERT INTO public.watchlists(user_id,folder_id,symbol) VALUES($1,$2,\'SCOM\')',[ids[0],other.id]),/watchlist_owned_folder_fk/);checks++;}
 const post={id:randomUUID(),user_id:ids[0],content:'Synthetic idempotent post'};
 const replies=await Promise.all(Array.from({length:12},()=>write('posts',post)));
 check(new Set(replies.map(r=>r.json)).size,1);check((await pool.query('SELECT count(*)::int n FROM public.posts')).rows[0].n,1);
 check(Object.keys(JSON.parse((await write('posts',post,ids[0],'POST','select=id')).json)[0]).join(','),'id');
 await assert.rejects(write('posts',{...post,content:'Different logical request'}),/different request/);checks++;
 await write('posts',{...post,id:randomUUID()});check((await pool.query('SELECT count(*)::int n FROM public.posts')).rows[0].n,2);
 const holding={id:randomUUID(),user_id:ids[0],symbol:'SCOM',name:'Synthetic',shares:7,avg_cost:12.34};
 const inserted=JSON.parse((await write('portfolios',holding)).json)[0];
 const search='id=eq.'+holding.id+'&updated_at=eq.'+encodeURIComponent(inserted.updated_at);
 const edits=await Promise.allSettled([write('portfolios',{shares:8},ids[0],'PATCH',search),write('portfolios',{shares:9},ids[0],'PATCH',search)]);
 check(edits.filter(r=>r.status==='fulfilled').length,1);check(edits.filter(r=>r.status==='rejected'&&r.reason.status===409).length,1);
 await assert.rejects(write('portfolios',{shares:10},ids[1],'PATCH',search),/no longer available/);checks++;
 for(const invalid of [{shares:1.5,avg_cost:1},{shares:1,avg_cost:0},{shares:1,avg_cost:1.005},{shares:2147483648,avg_cost:1}]){
  await assert.rejects(write('portfolios',{...holding,id:randomUUID(),...invalid}),/Shares|cost/);checks++;
 }

 const {combinedAverageCost}=await import('../../backend/src/data/holdingContract.js');
 for(const [a,b,c,d] of [[1,1,1,1.01],[7,12.34,2,10.01],[1,0.01,2,0.02]]){
  const numeric=(await pool.query('SELECT round(($1::numeric*$2::numeric+$3::numeric*$4::numeric)/($1::numeric+$3::numeric),2)::text cost',[a,b,c,d])).rows[0].cost;check(combinedAverageCost(a,b,c,d),Number(numeric));
 }
 if(!preDdl){
 // Hosted checkout initialization uses mocked HTTP and the same real SQL ledger.
 await pool.query('ALTER TABLE public.paystack_live_orders ADD COLUMN terms_version text,ADD COLUMN terms_accepted_at timestamptz');
 await pool.query(await read('infra/neon/security/phase2-hosted-checkout-intents.sql'));
 const {env}=await import('../../backend/src/config/index.js');
 env.PAYSTACK_LIVE_CHECKOUT_ENABLED=true;env.PAYSTACK_CHECKOUT_INTENTS_ENABLED=true;env.PAYSTACK_SECRET_KEY='sk_live_synthetic-fixture-only';env.PAYSTACK_CALLBACK_URL='https://fixture.example.test/checkout';
 const {pool:applicationPool}=await import('../../backend/src/storage/db.js');applicationPool.query=(...args)=>pool.query(...args);
 const {initializeLiveCheckout}=await import('../../backend/src/services/paystackLive.js');
 const originalFetch=globalThis.fetch;let providerCalls=0,ambiguous=false;
 globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.paystack.co/transaction/initialize');providerCalls++;if(ambiguous)throw Error('Synthetic ambiguous timeout');const body=JSON.parse(options.body);return Response.json({status:true,data:{reference:body.reference,authorization_url:'https://checkout.paystack.com/synthetic-intent',access_code:'synthetic-access'}});};
 try{
  const intent=randomUUID(),init=key=>initializeLiveCheckout(ids[0],'synthetic@example.test',{plan:'premium',cycle:'monthly'},'2026-10-12','card',key);
  const first=await Promise.allSettled(Array.from({length:12},()=>init(intent)));
  check(providerCalls,1);check(first.some(r=>r.status==='fulfilled'),true);
  const replay=await init(intent);check(providerCalls,1);check(replay.url,'https://checkout.paystack.com/synthetic-intent');
  await assert.rejects(initializeLiveCheckout(ids[0],'synthetic@example.test',{plan:'premium',cycle:'annual'},'2026-10-12','card',intent),/different request/);checks++;
  await init(randomUUID());check(providerCalls,2);
  ambiguous=true;const unknown=randomUUID();await assert.rejects(init(unknown),e=>e.code==='CHECKOUT_INITIALIZATION_PENDING');checks++;
  const count=providerCalls;await assert.rejects(init(unknown),e=>e.code==='CHECKOUT_INITIALIZATION_PENDING');checks++;check(providerCalls,count);
  check((await pool.query('SELECT public.effective_subscription_plan($1) plan',[ids[0]])).rows[0].plan,'free');
  const service=await pool.connect();try{await service.query('SET ROLE service_role');const paid=(await service.query('SELECT public.fulfill_paystack_live_order($1,801,now()) receipt',[replay.reference])).rows[0].receipt;check((await service.query('SELECT public.fulfill_paystack_live_order($1,801,now()) receipt',[replay.reference])).rows[0].receipt,paid);}finally{await service.query('RESET ROLE');service.release();}
 }finally{globalThis.fetch=originalFetch;}
 }
 if(process.argv.includes('--phase3')){const {phase3PaymentFixture}=await import('./phase3-payment-fixture.mjs');await phase3PaymentFixture({pool,read,ids});}
 console.log(JSON.stringify({fixtureOnly:true,database:'local PostgreSQL 17.11',checks,concurrentDefaultRequests:16,concurrentQuotaRequests:24,concurrentPostReplays:12,staleEditWinnerCount:1,productionTouched:false,preDdl,passed:true}));
}finally{
 process.exit=originalExit;
 await pool?.end();
 if(container){const label=docker(['inspect','--format','{{index .Config.Labels "continua.fixture"}}',container]);if(label!=='phase2')throw Error('Refusing unrelated container removal');docker(['rm','--force',container]);}
}
