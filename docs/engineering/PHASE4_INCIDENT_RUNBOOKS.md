# Phase 4 incident response runbooks

Use current provider access; no new notification credentials or permanent production changes are pre-authorized by this document. Public diagnostics are bounded GETs; private endpoints require existing operator authority. Never put secrets/customer records in GitHub issues. See PHASE4_ROLLBACK_PLAN.md for exact artifact/config/write-preservation gates.

## Neon transfer quota exhaustion

**Symptoms:** API/database errors, compute suspended or provider allowance close to exhausted.

**Detection and safe diagnosis:** Neon project Usage/Billing and dated capacity receipt; private query-volume/pool snapshot if already available. Do not run broad SELECT or EXPLAIN ANALYZE during exhaustion.

**Immediate mitigation:** Stop optional new operator probes/exports. Obtain approval before pausing an existing collector or changing quota/plan; keep evidence/checkpoints. Never replace live data with synthetic data.

**Escalation:** Escalate immediately at actual suspension or >=90% transfer; investigate cache misses, duplicate queries and scheduled result projections before requesting capacity.

**Recovery or rollback:** Use provider billing-period resumption or separately approved capacity/traffic repair, then one bounded liveness/JWKS/owner read.

**Verification after recovery:** Verify usage slope over24–72h, current source timestamps and controlled job receipts.

**Data integrity:** No deletion to free transfer, history reduction, repeated archive downloads or identity reset.


## Render backend outage

**Symptoms:** Health timeout/5xx, failed deploy or exhausted pool; a Free instance can take50+seconds to wake.

**Detection and safe diagnosis:** Render Events/Deploys/Logs; one public liveness read with a bounded cold-start allowance; distinguish process liveness from SQL readiness.

**Immediate mitigation:** Avoid repeated retry storms and forced logins. Preserve current deployment and logs. Roll back only a proven incompatible application artifact under the release incident approval.

**Escalation:** Escalate after bounded wake allowance and provider incident check; repeated failures/connection pressure need operator action.

**Recovery or rollback:** Use known-good retained Render artifact; inspect target config and auto-deploy effect. Do not restore SQL.

**Verification after recovery:** Verify exact health SHA/schema, managed session and owner reads; observe pool wait and warm latency separately.

**Data integrity:** In-flight charge outcome is unknown until original-reference verification; no second initiation.


## Cloudflare deployment failure

**Symptoms:** Failed Worker build, missing assets, gateway errors or frontend/backend SHA skew.

**Detection and safe diagnosis:** GitHub check details, Cloudflare build logs/version traffic; run verify-release.mjs only after release metadata is deployed.

**Immediate mitigation:** Keep last successful version serving. Fix build/lock issue locally with clean build; use reviewed Worker+Assets rollback for a live regression.

**Escalation:** Escalate if no compatible serving artifact or identity/media bindings differ; do not weaken secret/issuer checks.

**Recovery or rollback:** Select known-good recorded version; verify bindings and deployment metadata separately.

**Verification after recovery:** Load frontend, auth bridge, public market and private owner pages; private cache/no-store and callback origins remain intact.

**Data integrity:** No database rollback or credential exposure in public build logs.


## Managed Auth dependency outage

**Symptoms:** 503/502 session checks while existing session may still be valid; JWKS or managed SDK unavailable.

**Detection and safe diagnosis:** Pinned JWKS probe, typed auth dependency metrics and Neon Auth/provider dashboard. Never log cookies/JWTs or paste verification links.

**Immediate mitigation:** Keep access fail-closed and distinguish unavailable from revoked; frontend retains retry state. Avoid password resets, replacement accounts and provider switching.

**Escalation:** Escalate sustained provider5xx/timeouts versus normal credential4xx; verify branch/issuer and provider incident.

**Recovery or rollback:** Restore compatible provider configuration only with approval or wait for provider recovery; code rollback must retain live-session/owner checks.

**Verification after recovery:** Existing-session verification and read-only owner/plan path; no signup/reset mutation as health probe.

**Data integrity:** Preserve subject-to-user mapping, revocations and linked financial records.


## GitHub ingestion failure

**Symptoms:** Failed/missing scheduled collector receipt, aged document queue or failed checkpoint.

**Detection and safe diagnosis:** Actions latest scheduled run and enabled state; workflow variables/budget checkpoints, operator ingestion aggregate. Successful budget pause is not a failure.

**Immediate mitigation:** Fix dependency/source/transient issue locally; keep lease/attempt/hash and source permission rules. A targeted retry/reactivation requires approval.

**Escalation:** Escalate missing expected run beyond approved cadence or exhausted retries; source publication timing may be unknown.

**Recovery or rollback:** Resume approved finite job from existing checkpoint after proving no live conflicting lease; do not restart paused workflows automatically.

**Verification after recovery:** New successful receipt, fenced checkpoint/version and expected source coverage; compare prior originals/checksums.

**Data integrity:** No archive truncation, reset-all-attempts, historical deletion or broad crawler expansion.


## Paystack webhook delivery failure

**Symptoms:** Provider delivery errors or valid webhook storage/verification5xx; unknown payment state.

**Detection and safe diagnosis:** Provider delivery status, safe webhook logs and enabled-state check. If Phase3 off, durable metrics are unavailable; inspect existing order/receipt authority privately.

**Immediate mitigation:** Preserve raw signature guard. Provider retries failed delivery; never acknowledge an unpersisted event merely to silence failure.

**Escalation:** Escalate repeated5xx or payment-to-entitlement disagreement; do not expose webhook/customer bodies or refs in issues.

**Recovery or rollback:** Verify original reference using existing server GET and reconcile through existing idempotent fulfillment; approved provider replay only after review.

**Verification after recovery:** Correct owner/currency/amount/provider transaction and exactly one fulfillment; no real test charge.

**Data integrity:** Already ACKed Phase3 work may not redeliver; retain operational ledger on rollback.


## Stuck subscription renewal

**Symptoms:** Unknown/active reference, overdue verification or review/deadline reached.

**Detection and safe diagnosis:** Private Phase3 aggregate only if enabled; otherwise existing native attempt/mandate and provider original reference through trusted operator tooling.

**Immediate mitigation:** Do not clear active_reference or repeat charge POST. Approve pause of future admissions if necessary; in-flight provider effect may still finish.

**Escalation:** Escalate unknown conflicting status,12-attempt/48h review or currency/owner mismatch.

**Recovery or rollback:** Reconcile original reference with provider GET and existing atomic fulfillment, preserving cancellation timing and approved policy.

**Verification after recovery:** Exactly one paid-term effect, consistent order/attempt/mandate, no second initialization.

**Data integrity:** Do not revoke access/refund/reset attempts to exercise recovery; new refund policy is not authorized.


## Excessive API errors

**Symptoms:** Warm request error ratio beyond threshold with sufficient samples; startup/unavailable samples kept separate.

**Detection and safe diagnosis:** Private category/status histogram, safe request UUID and dependency summaries; current release SHA. Do not copy customer URLs/state into issues.

**Immediate mitigation:** Reduce optional operator load; identify auth/database/cache/provider/Engine category before changing code/config.

**Escalation:** Escalate >5%/100 requests in five buckets or critical owner-read failure even below volume threshold.

**Recovery or rollback:** Reviewed forward fix or application rollback retaining schema/write compatibility.

**Verification after recovery:** Error/clear transitions and same route/workload baseline, owner/plan/security regression checks.

**Data integrity:** No relaxation of entitlement/auth, public caching of private data or fabricated success fallback.


## Database connection exhaustion

**Symptoms:** Pool waiting/acquisition timeouts,53300 or database dependency errors.

**Detection and safe diagnosis:** In-memory poolSnapshot/query fingerprints and provider active connections/compute; no new pool/query loop.

**Immediate mitigation:** Stop optional diagnostic traffic; inspect transaction duration, leaked clients and bounded concurrency. Restart only with incident approval and understand in-flight unknown payments.

**Escalation:** Escalate sustained wait/timeouts beyond current workload budget or provider connection limit; do not blindly enlarge max10 pool.

**Recovery or rollback:** Release leaked clients/fix transaction scope; deploy compatible code or known-good artifact.

**Verification after recovery:** Pool wait recovers, query failures clear, owner/financial read and transaction fixture behavior remains valid.

**Data integrity:** A lost commit acknowledgment is not proof of rollback; inspect original receipt before retrying a mutation.


## Incorrect release deployment

**Symptoms:** Main, frontend, Worker or backend revisions disagree or flags/schema contract differ.

**Detection and safe diagnosis:** Provider deployment IDs, /release.json and /health/live using verify-release.mjs; source hash alone is insufficient.

**Immediate mitigation:** Keep compatible version; do not change expected SHA to hide drift. Manual deployment needs scoped approval if not covered by rollout authorization.

**Escalation:** Escalate deployment skipped after checks, unrecognized config or incompatible SQL requirement.

**Recovery or rollback:** Deploy exact approved compatible commit or retained known-good artifact; record scheduler/flag/config effects.

**Verification after recovery:** Exact live SHAs, health and read-only session/portfolio/watchlist/Engine/stock checks.

**Data integrity:** No force push or database snapshot rollback; preserve new legitimate writes.


## Failed database migration

**Symptoms:** Bounded DDL transaction fails, ownership/constraint drift or unknown commit outcome.

**Detection and safe diagnosis:** Read-only catalog and recorded normalized SQL hash/preflight/ACL snapshot. Stop before another apply; do not run wholesale grant scripts.

**Immediate mitigation:** If transaction aborted retain old app/flags off. After commit prefer targeted forward repair with explicit approval.

**Escalation:** Escalate lock timeout, mismatched owner/ACL or potential data loss; require DBA/operator review.

**Recovery or rollback:** Rehearse repair on isolated approved schema, verify both app versions and original-role access. Production-derived copy/restore requires its own approval.

**Verification after recovery:** Postflight constraints, RLS, exact grants/functions, owner boundaries, receipt uniqueness and checkpoint evidence.

**Data integrity:** No CASCADE/drop/delete, blanket GRANT ALL or overwrite of post-release writes.


## Financial-data freshness incident

**Symptoms:** Historical prices/fundamentals/publications stale, failed lease or expected filing missing. SCOM UI onNov3 reported last historical closeOct23.

**Detection and safe diagnosis:** Quote timestamps/market calendar, historical coverage, issuer publication evidence, latest Actions receipts and operator ingestion aggregate. A table rendering is not proof of current data.

**Immediate mitigation:** Keep dated evidence and unavailable states visible. Determine source availability/rights and failed pipeline stage before targeted recovery.

**Escalation:** Escalate missing expected refresh beyond configured cadence or exhausted source attempts; do not invent an expected filing date.

**Recovery or rollback:** Approved bounded continuation of existing collector/checkpoint or publication repair; no new archive scope or source permission.

**Verification after recovery:** Coverage/version/checksum and publication dates match authoritative source; stale UI updates without removing history.

**Data integrity:** No forward filling fabricated prices, neutral scores for missing data, mathematical changes or archive deletions.
