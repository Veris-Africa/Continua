# Phase 1 rollback and recovery

Prepared 2 November 2026. No production rollback, restore, data copy or scheduler change has been run.

## Code rollback preserves new writes

The Phase 1 API/bandwidth release changes no production schema or stored financial values. It retains the old API, identity, payment, RLS, historical and job checkpoint contracts. Therefore the first rollback is **code/configuration only against the same current database**, preserving registrations, edits, portfolios, posts, receipts, subscriptions, ingestion and other writes made after deployment.

Before releasing, retain the existing Render deployment `dep-dbf1b734qb4c73a3kgug` at `8a5b3509d353d06f1b1cc82218dee57bfccfc885`, the approved candidate artifact/SHA, effective non-secret settings and access to existing secret versions without copying secrets into a report. Record the frontend/Worker artifact as well. Code rollback to the older Render artifact also restores its known bandwidth inefficiencies; it is a short recovery action, not a sustainable final state.

After explicit operator approval:

1. Halt further releases and new manual jobs. Observe active webhooks, SQL transactions/leases, archive copy operations and calculations. Prefer letting bounded operations drain. Do not mark an interrupted request/job as successful or replay a payment/mutation without its existing idempotency contract.
2. Roll Render back to the recorded prior artifact, leaving the current Neon branch, identities, R2 objects and completed job checkpoints in place. Do not deploy an old app that cannot read current additive schema. Confirm exact live revision on liveness rather than inferring it from dashboard success.
3. Retain `CACHE_DRIVER=memory`; this plan has no secret/cache activation to reverse. New local caches/queues vanish on process replacement. If a separately approved future Redis cutover is rolled back, restore captured configuration and isolate old namespaces; never flush the whole shared Redis database or restore cached auth/entitlement decisions. Changing to memory for security counters needs its own capacity/security decision and must not occur automatically on a configured shared limiter outage.
4. Check liveness, one dependency health check, designated managed-auth session, owner/plan denials, portfolio totals, financial periods and feed. Observe webhook/ingestion completion via existing receipts. Do not use health retries to hide repeated dependency failure.
5. If Cloudflare was separately released and incompatible, roll back its recorded Worker/assets artifact coherently. Backend rollback does not imply rolling back identities or browser data. Confirm the resulting component manifest.

Rollback triggers: unexpected authorization/plan bypass, publication-rights leak, wrong numerical/historical results, repeated API failures, pool saturation, unbounded memory growth, corrupted receipts or sharp provider usage increase. Pause future ingestion with explicit approval if needed, and preserve checkpoints for recovery. An in-flight provider call can finish after workflow cancellation; inspect receipts rather than immediately starting another run.

## E01 is separate

The administrative-privilege revocation is not required to run the performance release. Do not reverse it as an incidental code rollback. Existing application DML, trigger execution, provisioning and payment SQL do not require browser TRUNCATE/TRIGGER/REFERENCES/MAINTAIN.

If an E01-specific regression is demonstrated, retain the error and role context, investigate the precise missing authority and prefer a narrow legitimate-operation correction. Only after separate security approval may the operator restore **specific previously captured privileges to specific original grantees**. Never use `GRANT ALL`, restore guessed inherited memberships, broaden DML or disable RLS/paid-tier guards. No generic privilege-expanding rollback script is shipped. If the migration's effective privilege assertion fails, its transaction rolls back automatically; diagnose inherited/PUBLIC/column grants instead of using CASCADE blindly.

## Data recovery is not routine rollback

The existing `infra/security/restore-fixture.mjs` is a guarded `pg_dump`/`pg_restore` rehearsal against a disposable CI PostgreSQL container. It requires `CONTINUA_DISPOSABLE_FIXTURE=true` and a validated explicit container ID, verifies the expected fixture database, creates a separate empty restore target, and compares synthetic rows, queue versions, policies and RLS. It does not accept a production URL. Existing CI wires the disposable fixture; a current production recovery rehearsal has **not** been performed here.

New PGlite fixtures prove SQL semantics, not physical backup restorability, Neon recovery window, actual RPO/RTO or current operator access. These remain E09 gates. Before any data-affecting future release, verify the current Neon plan's actual recovery window and backup coverage, private R2 immutable objects, schema/role/extension compatibility and a restore rehearsal under specific approval. Do not assume a Free plan offers an arbitrary historical restore point.

If production corruption ever requires restoration, obtain a separate incident authorization. Preserve the current branch, bound the incident interval, identify all writes after the proposed restore point and restore into an isolated target for validation. Reconcile post-point identity/account links, payments/receipts, positions/watchlists, posts, source versions and job state before any switch. Validate source hashes, RLS/roles, financial precision and owner relationships. A blind rollback to an old branch would discard newer writes and is expressly excluded.

No production-derived copy was created and no existing data was removed in Phase 1. A successful code rollback can preserve all new database writes; a database restore cannot make that promise without explicit reconciliation.
