-- Synthetic disposable PostgreSQL ONLY. Not a production migration.
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE SCHEMA auth; CREATE SCHEMA app_identity;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid$$;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role'$$;
GRANT USAGE ON SCHEMA auth TO anon,authenticated,service_role;
CREATE FUNCTION public.continua_session_guard() RETURNS void LANGUAGE plpgsql AS $$BEGIN IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Session required'; END IF; END$$;
CREATE TABLE app_identity.users(id uuid PRIMARY KEY,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb,created_at timestamptz,updated_at timestamptz,source_provider text);
CREATE TABLE app_identity.provider_links(provider text,subject text,user_id uuid REFERENCES app_identity.users(id),evidence text,PRIMARY KEY(provider,subject));
CREATE TABLE app_identity.continua_auth_user(id uuid PRIMARY KEY,email text,name text,"emailVerified" boolean,"userMetadata" jsonb,"createdAt" timestamptz,"updatedAt" timestamptz);
CREATE TABLE public.profiles(id uuid DEFAULT gen_random_uuid() PRIMARY KEY,user_id uuid UNIQUE REFERENCES app_identity.users(id),full_name text,email text,subscription_plan text DEFAULT 'free');
CREATE TABLE public.watchlist_folders(id uuid DEFAULT gen_random_uuid() PRIMARY KEY,user_id uuid NOT NULL REFERENCES app_identity.users(id),name text NOT NULL,is_default boolean NOT NULL DEFAULT false,sort_order int DEFAULT 0,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
CREATE TABLE public.watchlists(id uuid DEFAULT gen_random_uuid() PRIMARY KEY,user_id uuid NOT NULL REFERENCES app_identity.users(id),folder_id uuid NOT NULL REFERENCES public.watchlist_folders(id) ON DELETE CASCADE,symbol text,name text,created_at timestamptz DEFAULT now(),UNIQUE(user_id,folder_id,symbol));
CREATE TABLE public.portfolios(id uuid DEFAULT gen_random_uuid() PRIMARY KEY,user_id uuid NOT NULL REFERENCES app_identity.users(id),symbol text NOT NULL,name text,shares integer NOT NULL CHECK(shares>0),avg_cost numeric(10,2) NOT NULL CHECK(avg_cost>0),sector text,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now(),UNIQUE(user_id,symbol));
CREATE TABLE public.posts(id uuid DEFAULT gen_random_uuid() PRIMARY KEY,user_id uuid NOT NULL REFERENCES app_identity.users(id),content text,image_url text,image_urls text[],poll jsonb,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
CREATE VIEW public.profiles_public WITH(security_invoker=true) AS SELECT user_id,full_name FROM public.profiles;
CREATE FUNCTION public.fixture_touch() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN NEW.updated_at=clock_timestamp();RETURN NEW;END$$;
CREATE TRIGGER fixture_portfolio_touch BEFORE UPDATE ON public.portfolios FOR EACH ROW EXECUTE FUNCTION public.fixture_touch();
DO $policies$
DECLARE target text;
BEGIN
 FOREACH target IN ARRAY ARRAY['profiles','watchlist_folders','watchlists','portfolios','posts'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',target);
  EXECUTE format('CREATE POLICY fixture_owner ON public.%I FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid())',target);
  EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO authenticated',target);
 END LOOP;
END $policies$;
