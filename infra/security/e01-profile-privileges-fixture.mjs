// In-process disposable PostgreSQL. Never accepts DATABASE_URL or live identities.
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../../.qa-artifacts/canonical-fixture/package.json',import.meta.url));
const {PGlite}=require('@electric-sql/pglite');
const db=new PGlite();let checks=0;
const read=path=>readFile(new URL('../../'+path,import.meta.url),'utf8');
const check=(a,b)=>{assert.deepEqual(a,b);checks++;};
const denied=async sql=>{await assert.rejects(db.query(sql),/permission denied|Subscription access/);checks++;};
const owner='12345678-1234-4123-8123-123456789012',other='22345678-1234-4123-8123-123456789012';
async function role(name,sub=owner){await db.exec('RESET ROLE');await db.query("SELECT set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub,role:name})]);await db.exec('SET ROLE '+name);}
try {
 await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
 CREATE SCHEMA auth; CREATE SCHEMA app_identity; CREATE SCHEMA fixture_attack; GRANT USAGE,CREATE ON SCHEMA fixture_attack TO anon,authenticated;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid $$;
 CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role' $$;
 GRANT USAGE ON SCHEMA auth TO anon,authenticated,service_role;
 CREATE TABLE app_identity.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb,created_at timestamptz,updated_at timestamptz,source_provider text);
 CREATE TABLE app_identity.provider_links(provider text,subject text,user_id uuid REFERENCES app_identity.users(id),evidence text,PRIMARY KEY(provider,subject));
 CREATE TABLE app_identity.continua_auth_user(id uuid PRIMARY KEY,email text,name text,"emailVerified" boolean,"userMetadata" jsonb,"createdAt" timestamptz,"updatedAt" timestamptz);
 CREATE TABLE public.profiles(id uuid DEFAULT gen_random_uuid() PRIMARY KEY,user_id uuid UNIQUE REFERENCES app_identity.users(id),full_name text,email text,
 avatar_url text,subscription_plan text DEFAULT 'free',created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now(),bio text,
 portfolio_public boolean,followers_count int,following_count int,banner_url text,handle text,tradershub_onboarded boolean,
 portfolio_hide_amounts boolean,portfolio_hide_gains boolean,portfolio_top_holdings_only boolean,portfolio_followers_only boolean,
 interests text[],trading_experience text,gender text);
 ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
 CREATE POLICY fixture_owner ON public.profiles FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
 CREATE POLICY fixture_service ON public.profiles FOR ALL TO service_role USING(true) WITH CHECK(true);`);
 // Actual payment function and checks, excluding only the external cron registration.
 const billing=(await read('supabase/migrations/20261010210000_paystack_live_checkout.sql')).split('-- Supabase\'s database scheduler')[0]
   .replaceAll('REFERENCES auth.users(id)','REFERENCES app_identity.users(id)');
 await db.exec(billing);
 await db.exec(await read('infra/neon/billing-owner-guard.sql'));
 await db.exec(`CREATE TRIGGER trg_prevent_self_upgrade BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.prevent_self_upgrade();`);
 await db.exec(await read('infra/neon/auth-profile-metadata.sql'));
 await db.exec(`CREATE TRIGGER fixture_provision AFTER INSERT OR UPDATE ON app_identity.continua_auth_user FOR EACH ROW EXECUTE FUNCTION app_identity.sync_auth_identity();`);
 const grants=(await read('infra/neon/application-grants.sql')).split('\n').filter(line=>/^(GRANT|REVOKE) .* ON TABLE public\.profiles (TO|FROM) /.test(line)).join('\n');
 await db.exec(grants);
 // Reproduce the confirmed pre-remediation administrative authority in isolation.
 await db.exec('GRANT TRUNCATE,TRIGGER,REFERENCES,MAINTAIN ON public.profiles TO anon,authenticated');
 check((await db.query("SELECT has_table_privilege('anon','public.profiles','TRUNCATE') allowed")).rows[0].allowed,true);
 await db.exec(await read('infra/neon/security/e01-profile-administrative-privileges.sql'));
 await db.exec(await read('infra/neon/security/e01-profile-administrative-privileges.sql'));
 for(const name of ['anon','authenticated'])for(const privilege of ['TRUNCATE','TRIGGER','REFERENCES','MAINTAIN'])
   check((await db.query('SELECT has_table_privilege($1,\'public.profiles\',$2) allowed',[name,privilege])).rows[0].allowed,false);
 // Actual provisioning trigger still creates canonical identity, provider link and profile.
 for(const id of [owner,other])await db.query(`INSERT INTO app_identity.continua_auth_user VALUES($1,'synthetic@example.test','Synthetic',true,'{}',now(),now())`,[id]);
 check((await db.query('SELECT count(*)::int n FROM public.profiles')).rows[0].n,2);
 check((await db.query('SELECT count(*)::int n FROM app_identity.provider_links')).rows[0].n,2);
 await db.exec(`CREATE FUNCTION public.fixture_trigger() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;`);
 for(const name of ['anon','authenticated']){
   await role(name);await denied('TRUNCATE public.profiles');
   await denied('CREATE TRIGGER unauthorized BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.fixture_trigger()');
   await denied('CREATE TABLE fixture_attack.unauthorized_fk(profile_id uuid REFERENCES public.profiles(id))');
 }
 await role('authenticated');
 check((await db.query("UPDATE public.profiles SET full_name='Edited' WHERE user_id=$1 RETURNING full_name",[owner])).rows[0].full_name,'Edited');
 check((await db.query('SELECT user_id FROM public.profiles')).rows.length,1);
 check((await db.query("UPDATE public.profiles SET full_name='Forbidden' WHERE user_id=$1 RETURNING user_id",[other])).rows.length,0);
 await denied("UPDATE public.profiles SET subscription_plan='premium_plus'");
 await denied('SELECT public.fulfill_paystack_live_order(\'fixture\',1,now())');
 await db.exec('RESET ROLE');
 // Exercise the real trigger even if a future column grant is accidentally expanded.
 await db.exec('GRANT UPDATE(subscription_plan,subscription_expires_at) ON public.profiles TO authenticated');
 await role('authenticated');await denied("UPDATE public.profiles SET subscription_plan='premium_plus'");
 await role('service_role');
 const reference='continua-live-12345678-1234-4123-8123-123456789012';
 await db.query(`INSERT INTO public.paystack_live_orders(reference,user_id,email,plan,cycle,amount_minor) VALUES($1,$2,'synthetic@example.test','premium','monthly',80000)`,[reference,owner]);
 const paid=(await db.query('SELECT public.fulfill_paystack_live_order($1,901,now()) receipt',[reference])).rows[0].receipt;
 check((await db.query('SELECT public.fulfill_paystack_live_order($1,901,now()) receipt',[reference])).rows[0].receipt,paid);
 check((await db.query('SELECT subscription_plan FROM public.profiles WHERE user_id=$1',[owner])).rows[0].subscription_plan,'premium');
 await db.query("UPDATE public.profiles SET subscription_expires_at=now()-interval '1 second' WHERE user_id=$1",[owner]);
 check((await db.query('SELECT public.effective_subscription_plan($1) plan',[owner])).rows[0].plan,'free');
 await role('authenticated',other);check((await db.query('SELECT user_id FROM public.profiles')).rows[0].user_id,other);
 console.log(JSON.stringify({fixtureOnly:true,actualPostgresRoles:true,payments:'synthetic SQL fulfillment only; no provider call',checks,passed:true}));
} finally {await db.close();}
