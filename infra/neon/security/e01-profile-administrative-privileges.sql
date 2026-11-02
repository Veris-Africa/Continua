-- SEPARATE SECURITY RELEASE. Explicit operator approval required for production.
-- PostgreSQL 17+ (production inventory: 18). Never run at API startup or in collectors.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '10s';
-- Preserve every existing row/column DML grant, RLS policy, trigger and service ACL.
-- RESTRICT avoids silently cascading grants made by these roles.
REVOKE TRUNCATE, TRIGGER, REFERENCES, MAINTAIN ON TABLE public.profiles
  FROM anon, authenticated RESTRICT;
DO $verify$
DECLARE browser_role text; administrative_privilege text;
BEGIN
  FOREACH browser_role IN ARRAY ARRAY['anon','authenticated'] LOOP
    FOREACH administrative_privilege IN ARRAY ARRAY['TRUNCATE','TRIGGER','REFERENCES','MAINTAIN'] LOOP
      IF has_table_privilege(browser_role,'public.profiles',administrative_privilege) THEN
        RAISE EXCEPTION 'E01 effective administrative privilege remains: % %',browser_role,administrative_privilege;
      END IF;
    END LOOP;
  END LOOP;
END
$verify$;
COMMIT;
