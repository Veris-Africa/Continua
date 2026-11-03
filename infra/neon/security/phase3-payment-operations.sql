-- Separate, explicitly approved production release ONLY. No activation or data backfill.
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='15s';
CREATE SCHEMA IF NOT EXISTS operations;
REVOKE ALL ON SCHEMA operations FROM PUBLIC,anon,authenticated;
CREATE TABLE operations.payment_work (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 kind text NOT NULL CHECK(kind IN ('webhook','renewal','native','hosted')),
 provider text NOT NULL DEFAULT 'paystack' CHECK(provider='paystack'),
 mode text NOT NULL CHECK(mode IN ('live','test')),
 fingerprint text NOT NULL UNIQUE CHECK(length(fingerprint)=64),
 event_type text NOT NULL CHECK(length(event_type) BETWEEN 1 AND 80),
 provider_event_id text CHECK(length(provider_event_id)<=64),
 reference text CHECK(reference ~ '^continua-(live|test)-[a-f0-9-]{36}$' AND reference LIKE 'continua-'||mode||'-%'),
 classification text NOT NULL CHECK(classification IN ('actionable','informational','review','ignored')),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','retry','completed','review','ignored','cancelled')),
 first_received_at timestamptz NOT NULL DEFAULT now(),
 last_received_at timestamptz NOT NULL DEFAULT now(),
 deliveries integer NOT NULL DEFAULT 1 CHECK(deliveries BETWEEN 1 AND 1000000000),
 last_attempt_at timestamptz,
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 12),
 next_attempt_at timestamptz NOT NULL DEFAULT now(),
 lease_id uuid,
 lease_until timestamptz,
 error_category text CHECK(error_category IN ('dependency_unavailable','provider_pending','unknown_reference','verification_conflict','retry_exhausted','verification_window_expired','policy_review','unsupported_event','lease_expired')),
 completed_at timestamptz,
 CHECK((lease_id IS NULL)=(lease_until IS NULL)),
 CHECK((status='processing')=(lease_id IS NOT NULL AND lease_until IS NOT NULL))
);
CREATE INDEX payment_work_due ON operations.payment_work(next_attempt_at,id) WHERE status IN ('pending','retry');
CREATE INDEX payment_work_expired_lease ON operations.payment_work(lease_until,id) WHERE status='processing';
CREATE INDEX payment_work_reference ON operations.payment_work(reference) WHERE reference IS NOT NULL;
CREATE UNIQUE INDEX payment_recovery_reference ON operations.payment_work(reference) WHERE kind IN ('renewal','native','hosted');
ALTER TABLE operations.payment_work ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON operations.payment_work FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA operations TO service_role;
GRANT SELECT,INSERT,UPDATE ON operations.payment_work TO service_role;
CREATE POLICY payment_operations_service ON operations.payment_work TO service_role USING(true) WITH CHECK(true);
-- Durable transition-only alert receipts. No email, body, card token or customer data.
CREATE TABLE operations.alert_state (
 category text PRIMARY KEY CHECK(length(category)<=64),
 state text NOT NULL CHECK(state IN ('clear','warning')),
 changed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE operations.alert_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON operations.alert_state FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON operations.alert_state TO service_role;
CREATE POLICY operations_alert_service ON operations.alert_state TO service_role USING(true) WITH CHECK(true);
CREATE TABLE operations.periodic_jobs (
 name text PRIMARY KEY CHECK(name='application-maintenance'),
 status text NOT NULL DEFAULT 'idle' CHECK(status IN ('idle','processing','retry','review')),
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 5),
 next_due_at timestamptz NOT NULL DEFAULT now(),
 lease_id uuid,
 lease_until timestamptz,
 last_started_at timestamptz,
 last_completed_at timestamptz,
 error_category text CHECK(error_category IN ('dependency_unavailable','retry_exhausted')),
 CHECK((lease_id IS NULL)=(lease_until IS NULL)),
 CHECK((status='processing')=(lease_id IS NOT NULL))
);
ALTER TABLE operations.periodic_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON operations.periodic_jobs FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON operations.periodic_jobs TO service_role;
CREATE POLICY periodic_job_service ON operations.periodic_jobs TO service_role USING(true) WITH CHECK(true);
COMMIT;
