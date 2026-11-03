// Dedicated disposable PostgreSQL only. Never reads DATABASE_URL or .env files.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import pg from '../../backend/node_modules/pg/lib/index.js';
import {readPortfolioHistory} from '../../backend/src/data/portfolioHistory.js';
import {recordedPortfolioHistory} from '../../app/src/lib/recordedPortfolioHistory.js';
const docker=process.env.DOCKER_BIN??'docker',name='continua-phase7-history-'+randomUUID();
const label='continua.fixture=phase7-recorded-history';
const run=args=>execFileSync(docker,args,{encoding:'utf8',windowsHide:true,timeout:60000}).trim();
let id,pool;
try{
 id=run(['run','-d','--rm','--name',name,'--label',label,'--user','70:70','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--memory','256m','--memory-swap','256m','--cpus','1','--pids-limit','128',
  '--tmpfs','/tmp:rw,nosuid,noexec,size=16m','--tmpfs','/var/run/postgresql:rw,nosuid,noexec,size=4m,uid=70,gid=70','--tmpfs','/var/lib/postgresql/data:rw,nosuid,noexec,size=128m,uid=70,gid=70,mode=0700',
  '-p','127.0.0.1::5432','-e','POSTGRES_PASSWORD=continua-fixture-only','-e','POSTGRES_DB=continua_phase7_fixture',
  'postgres@sha256:b0f9560a2de083e2cc7382e75f808c7381a32852a7ec49117deedb300e552b24','postgres','-c','shared_buffers=16MB','-c','max_connections=10']);
 if(!/^[a-f0-9]{64}$/.test(id))throw Error('Owned fixture ID unavailable');
 const binding=run(['port',id,'5432/tcp']),port=/^127\.0\.0\.1:(\d+)$/.exec(binding)?.[1];if(!port)throw Error('Fixture must be loopback-only');
 pool=new pg.Pool({host:'127.0.0.1',port:Number(port),user:'postgres',password:'continua-fixture-only',database:'continua_phase7_fixture',max:1,connectionTimeoutMillis:1000});
 let ready=false;for(let attempt=0;attempt<15;attempt++){try{await pool.query('SELECT 1');ready=true;break;}catch{await new Promise(resolve=>setTimeout(resolve,500));}}if(!ready)throw Error('Fixture startup failed');
 await pool.query(`CREATE ROLE authenticated NOLOGIN;CREATE SCHEMA auth;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT (current_setting('request.jwt.claims',true)::jsonb->>'sub')::uuid $$;
 CREATE FUNCTION public.continua_session_guard() RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF current_setting('request.jwt.claims',true)::jsonb->>'session_status' IS DISTINCT FROM 'valid' THEN RAISE EXCEPTION 'Fixture revoked session' USING ERRCODE='42501'; END IF; END $$;
 CREATE TABLE public.portfolio_snapshots(id uuid PRIMARY KEY,user_id uuid NOT NULL,total_value numeric NOT NULL,total_cost numeric NOT NULL,snapshot_date date NOT NULL,created_at timestamptz NOT NULL);
 ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;
 CREATE POLICY owned_snapshot ON public.portfolio_snapshots FOR SELECT TO authenticated USING(auth.uid()=user_id);
 GRANT USAGE ON SCHEMA auth TO authenticated;GRANT SELECT ON public.portfolio_snapshots TO authenticated;
 INSERT INTO public.portfolio_snapshots VALUES
 ('11111111-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111',120.25,100,'2026-10-01','2026-10-01T12:00:00Z'),
 ('11111111-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111',125.75,100,'2026-10-01','2026-10-01T13:00:00Z'),
 ('11111111-0000-4000-8000-000000000003','11111111-1111-4111-8111-111111111111',0,0,'2026-10-03','2026-10-03T12:00:00Z'),
 ('22222222-0000-4000-8000-000000000001','22222222-2222-4222-8222-222222222222',99999,1,'2026-10-02','2026-10-02T12:00:00Z');`);
 const claims={sub:'11111111-1111-4111-8111-111111111111',role:'authenticated',session_status:'valid'},range={from:'2026-10-01',to:'2026-10-20'};
 const response=await readPortfolioHistory(pool,claims,new URLSearchParams(range));
 const points=recordedPortfolioHistory(JSON.parse(response.json),range);
 assert.deepEqual(points.map(p=>[p.date,p.value,p.cost]),[['2026-10-01',125.75,100],['2026-10-03',0,0]]);
 await assert.rejects(readPortfolioHistory(pool,{...claims,session_status:'revoked'},new URLSearchParams(range)));
 const empty=await readPortfolioHistory(pool,{...claims,sub:'33333333-3333-4333-8333-333333333333'},new URLSearchParams(range));assert.deepEqual(JSON.parse(empty.json),[]);
 assert.equal((await pool.query('SELECT current_user AS role')).rows[0].role,'postgres');
 console.log(JSON.stringify({passed:true,rows:points.length,checks:['owner-and-RLS','revoked-session','cross-user-empty','correction-order','no-synthetic-dates','numeric-value-and-cost-parity','transaction-role-cleanup'],productionAccess:false}));
}finally{
 await pool?.end();
 if(id&&/^[a-f0-9]{64}$/.test(id)){
  const owned=JSON.parse(run(['inspect',id]))[0];
  if(owned.Name!=='/'+name||owned.Config?.Labels?.['continua.fixture']!=='phase7-recorded-history')throw Error('Fixture cleanup ownership mismatch');
  run(['stop','--time','5',id]);
 }
}
