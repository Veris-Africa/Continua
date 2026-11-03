import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
// Invoked only by the labelled phase2 harness; never accepts a cloud URL.
export async function phase4RestoreFixture({pool,container}){
 if(!/^[a-f0-9]{64}$/.test(container))throw Error('Disposable container required');
 const docker=args=>execFileSync('docker',args,{encoding:'utf8',windowsHide:true,timeout:30000,maxBuffer:4194304}).trim();
 assert.equal(docker(['inspect','--format','{{index .Config.Labels "continua.fixture"}}',container]),'phase2');
 assert.equal((await pool.query('SELECT current_database() db')).rows[0].db,'continua_phase2_fixture');
 const sql=(db,text)=>docker(['exec',container,'psql','-U','postgres','-d',db,'-At','-v','ON_ERROR_STOP=1','-c',text]);
 const source='continua_phase2_fixture',target='continua_phase4_restore',file='/tmp/phase4-synthetic.dump';
 assert.equal(sql(source,`SELECT count(*) FROM pg_database WHERE datname='${target}'`),'0');
 const started=performance.now();let created=false;
 await pool.query(`CREATE SCHEMA recovery_fixture;
 CREATE TABLE recovery_fixture.identity_map(issuer text,subject text,user_id uuid REFERENCES app_identity.users(id),PRIMARY KEY(issuer,subject));
 INSERT INTO recovery_fixture.identity_map SELECT 'https://synthetic.invalid','subject-'||id,id FROM app_identity.users;
 CREATE TABLE recovery_fixture.checkpoints(id int PRIMARY KEY,version int NOT NULL,checksum text NOT NULL,r2_key text NOT NULL);
 INSERT INTO recovery_fixture.checkpoints VALUES(1,7,'synthetic-sha256','synthetic/original.pdf');
 CREATE TABLE recovery_fixture.new_writes(id int PRIMARY KEY);
 ALTER TABLE recovery_fixture.identity_map ENABLE ROW LEVEL SECURITY;
 GRANT USAGE ON SCHEMA recovery_fixture TO authenticated;
 GRANT SELECT ON recovery_fixture.identity_map TO authenticated;
 CREATE POLICY owner_map ON recovery_fixture.identity_map TO authenticated USING(user_id=auth.uid());`);
 const snapshot=`SELECT jsonb_build_object(
 'users',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM app_identity.users t),
 'mapping',(SELECT jsonb_agg(to_jsonb(t) ORDER BY subject) FROM recovery_fixture.identity_map t),
 'profiles',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.profiles t),
 'portfolios',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.portfolios t),
 'watchlists',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM public.watchlists t),
 'orders',(SELECT jsonb_agg(to_jsonb(t) ORDER BY reference) FROM public.paystack_live_orders t),
 'receipts',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM operations.payment_work t),
 'jobs',(SELECT jsonb_agg(to_jsonb(t) ORDER BY name) FROM operations.periodic_jobs t),
 'history',(SELECT jsonb_agg(to_jsonb(t) ORDER BY id) FROM recovery_fixture.checkpoints t),
 'policies',(SELECT jsonb_agg(to_jsonb(t) ORDER BY schemaname,tablename,policyname) FROM pg_policies t),
 'constraints',(SELECT jsonb_agg(jsonb_build_array(n.nspname,c.relname,k.conname,pg_get_constraintdef(k.oid)) ORDER BY n.nspname,c.relname,k.conname) FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN('public','app_identity','operations','recovery_fixture')),
 'privileges',(SELECT jsonb_agg(to_jsonb(t)-'table_catalog' ORDER BY table_schema,table_name,grantee,privilege_type) FROM information_schema.role_table_grants t WHERE table_schema IN('public','app_identity','operations','recovery_fixture')),
 'rls',(SELECT jsonb_agg(jsonb_build_array(n.nspname,c.relname,c.relrowsecurity,c.relforcerowsecurity) ORDER BY n.nspname,c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN('public','app_identity','operations','recovery_fixture') AND c.relkind='r'))`;
 const hash=x=>createHash('sha256').update(x).digest('hex');
 try{
  const sourceSnapshot=JSON.parse(sql(source,snapshot));const before=hash(JSON.stringify(sourceSnapshot));
  docker(['exec',container,'pg_dump','-U','postgres','--format=custom','--file='+file,source]);
  // Simulate legitimate writes after the backup/application release.
  await pool.query('INSERT INTO recovery_fixture.new_writes VALUES(1)');
  docker(['exec',container,'createdb','-U','postgres',target]);created=true;
  docker(['exec',container,'pg_restore','-U','postgres','--exit-on-error','--dbname='+target,file]);
  const restoredSnapshot=JSON.parse(sql(target,snapshot));
  const differences=Object.keys(sourceSnapshot).filter(key=>JSON.stringify(sourceSnapshot[key])!==JSON.stringify(restoredSnapshot[key]));
  if(differences.length)console.log(JSON.stringify({restoreDifferences:differences}));
  assert.equal(hash(JSON.stringify(restoredSnapshot)),before);
  assert.equal(sql(source,'SELECT count(*) FROM recovery_fixture.new_writes'),'1');
  assert.equal(sql(target,'SELECT count(*) FROM recovery_fixture.new_writes'),'0');
  assert.equal(sql(target,'SET ROLE anon; SELECT has_schema_privilege(current_user,\'operations\',\'USAGE\')'),'SET\nf');
  const owner=(await pool.query('SELECT id FROM app_identity.users ORDER BY id LIMIT 1')).rows[0].id;
  assert.equal(sql(target,`SET ROLE authenticated; SET request.jwt.claims='{"sub":"${owner}","role":"authenticated"}'; SELECT count(*) FROM recovery_fixture.identity_map`),'SET\nSET\n1');
  // R2 itself is not restored by pg_dump. Verify a synthetic object manifest,
  // then deliberately remove an object to prove missing references are caught.
  const objects=new Map([['synthetic/original.pdf','synthetic-sha256']]);
  const refs=JSON.parse(sql(target,"SELECT json_agg(json_build_object('key',r2_key,'checksum',checksum)) FROM recovery_fixture.checkpoints"));
  assert.equal(refs.every(r=>objects.get(r.key)===r.checksum),true);objects.clear();assert.equal(refs.every(r=>objects.get(r.key)===r.checksum),false);
  console.log(JSON.stringify({phase4Restore:'passed',fixtureOnly:true,productionCopied:false,checks:8,durationMs:Math.round(performance.now()-started),preserved:'rows, mapping, ownership, constraints, policies, grants, RLS, payment work, job checkpoints, synthetic history',roleScope:'existing cluster roles; cross-cluster role export is a separate recovery requirement',r2:'synthetic manifest only; real R2 restore not exercised',newSourceWritesPreserved:true}));
 }finally{
  if(created)docker(['exec',container,'dropdb','-U','postgres',target]);
  docker(['exec',container,'rm','-f',file]);
 }
}
