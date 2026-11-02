# Phase 1 deployment plan — approval required

Prepared 2 November 2026. No production operation in this plan has been executed. The implementation branch is local only. Source approval, backend deployment, job execution and E01 role changes are separate decisions.

## Release consistency

The observed component inventory is [phase1-observed-release.json](phase1-observed-release.json). Run:

```powershell
node infra/deployment/phase1-release-manifest.mjs
```

The manifest records candidate git SHA and dirty-worktree flag, frontend/Worker source build, Render live SHA, Actions revision, applied legacy schema ledger version, a source migration digest and non-secret configuration version. Never deploy a dirty candidate. Use the **final clean reviewed HEAD** emitted by this command, not a moving “latest.” Documentation-only commits may follow implementation commits; record the complete release HEAD.

Previous live backend: `8a5b3509d353d06f1b1cc82218dee57bfccfc885`. Observed main/Cloudflare build: `ff99c350e080b369ecf4f9a3ffeed9911c407f8c`. Cloudflare's active deployment `4240418c` serves 100% traffic and its deployment row maps to that commit; this was rechecked read-only. Backend candidate includes the prior `b46eb16` bandwidth implementation plus Phase 1 commits. The legacy Neon migration ledger reports `20261022010000`; actual catalog checks confirm canonical history, processed archive and canonical identities. Separately applied Neon integration SQL is not fully represented in that ledger. The source digest is not proof of applied production DDL.

Render's effective `backend` root and successful-check trigger mean a root/infra-only CI repair does not itself cause a backend deploy. Keep that root; do not enlarge Docker context or weaken successful-check gating to solve a missed release. After approval, explicitly select the reviewed commit for a one-time deploy. `render.yaml` requires no functional change for this correction. Frontend is Cloudflare despite stale descriptive comments in the old Blueprint header; do not redeploy the legacy frontend merely because of those comments.

## Gates before release

1. Review clean candidate diff and all local receipts, including fixture skips. Push/PR publication is itself approval-gated because merging/pushing main can deploy Cloudflare/Render. CI on the published candidate must pass before selecting it.
2. Complete seven-flow verification on an isolated disposable full-service staging setup, including synthetic Free/Premium/Plus owners, expired/revoked sessions, watchlist/portfolio cross-owner denial and source policy revocation. The localhost baseline runner is prepared, not executed as a hosted staging claim. Native fixtures do not replace this gate.
3. Verify current production environment inventory without printing secrets: managed provider/branch pin, current cache driver, workers, database host/TLS, R2 reader mode, calculation runtime and polling intervals. Do not copy a production connection string to a test process.
4. Capture old Render deployment ID and artifact, current schema/ACL metadata, worker/job status and provider usage. Confirm the E09 rollback plan and who can stop a release. Do not create a production-derived branch or restore as a routine code-release step.
5. Confirm source-rights digest query latency and permission availability in staging. Missing `scraping.sources` or database dependency fails research closed; do not bypass that check to make a smoke test pass.

## Minimal backend release

No new schema is required for the bandwidth/API change. **Do not execute the E01 SQL as part of this deployment.** No new secret or production environment edit is required: retain `CACHE_DRIVER=memory`, existing namespace/provider/worker configuration and all current authorization settings. `phase1-v1` is a code-defined non-secret contract identifier, not an environment secret hash.

After explicit deployment approval:

1. Observe active requests, process-local calculations and SQL-owned job leases. Avoid starting new operator jobs during restart. Do not blindly terminate a collector, webhook or financial publication transaction. Follow existing graceful shutdown; a killed process must not be mistaken for a completed in-memory calculation. Durable leases/checkpoints are recovered by existing jobs.
2. Deploy the exact approved backend SHA. Render replacement resets memory caches and process-local queues. Expect cold cache/hosting wake-up latency, without adding keep-alive traffic or paid compute. Root configuration alone does not prove rollout.
3. Read `/api/v1/health/live` once and verify exact `revision`, `configurationVersion=phase1-v1` and schema contract. Liveness makes no SQL call. Run one dependency health check after warm-up; avoid repeated deep polling that adds Neon reads.
4. Smoke-test managed login/logout/refresh with a designated synthetic account; do not reset existing passwords or create replacement production identities. Verify unauthenticated and cross-owner denials, expired-plan denial, portfolio totals/coverage, current financial periods, Engine rights denial, feed read and cache hit/invalidation. A production synthetic mutation requires its own approved account/scope.
5. Verify protected diagnostic pool limits/gauges and query estimates, safe request IDs, cache metrics, and no credential-bearing request paths in logs. Watch errors/latency, unavailable financial sections, quote dates and restart recovery. Do not replay mutations on network failure.
6. Record exact Render SHA and deployment ID, Cloudflare active Worker version/source SHA, GitHub jobs SHA and schema/config observations. Cloudflare build success alone is not independent runtime attestation.

## Upstash

There is no database. **No activation is part of this release.** Retain the bounded memory alternative. A future shared-cache release requires separate permission to create/select a service, verify plan/region/command/value/bandwidth limits, test real concurrent Lua/outage behavior, set server-only credentials and a distinct namespace, then observe command and payload volume. The prepared mock adapter tests prove local behavior, not provider atomicity/capacity. Fail-closed limiter errors must remain visible; never change to fail-open to conceal quota exhaustion.

## Ingestion and controlled restart plan

Current flags were already true; leave them untouched. Reconciliation runs at `11 0,6,12,18 * * *` UTC, news at `17 */8 * * *`, documents at `43 6,12,20 * * *`. Both collection paths share `continua-scheduled-collector`, with cancellation disabled. The observed daily source/R2 budget is 201,326,592 bytes; the normal reconciliation per-run budget is 16,777,216 bytes, 600 seconds with final receipt reserve, workflow timeout 15 minutes. **Neither budget bounds Neon billed egress.**

No cron, company universe, historical backfill or transfer ceiling was changed. Existing SQL slot admission, idempotent/versioned writes, extraction/content checksums, R2 readback, CAS receipts and durable checkpoints remain. Normal reconciliation validates existing schema and never opts into raw migration, legacy cleanup or `--prepare-schema`. Failed copies are not claimed complete; ambiguous uploads drain before releasing clients/budgets.

If paused, obtain approval before reactivation or dispatch. For the first approved execution: ensure no competing run/lease, select the exact candidate revision, keep existing normal bounded flags, start **one** reconciliation (no raw/cleanup/schema options), observe at most one run and review its final failure/retry/record/context-refresh/SQL-estimate/source-R2 receipt. A successful checkpointed status means resumable backlog, not all history complete. Stop future scheduling via separately approved flag/workflow change if errors, unexpected duplication, large provider usage or rights failures appear. Prefer disabling future runs and letting the active bounded operation finish; cancellation cannot instantly stop synchronous provider I/O. Preserve durable checkpoints for resumption.

Record a provider usage baseline and follow-up at comparable 1-hour, 24-hour and multi-day windows after approved operations. Sample cost must stay small. Distinguish backlog catch-up from steady state. Alert through existing logs/receipts: SQL failure, pool saturation, unusual decoded volume, repeated retries, failed archive checks, missing final receipts and SHA mismatch. The existing 8 MiB estimated-result log warning is an investigation cue, not a Neon quota alarm. Do not silently raise budgets or create paid monitoring.

## Exact future approvals

- Publish reviewed branch/PR and merge/push main only after review; this can deploy frontend/Worker.
- Deploy the final reviewed SHA to Render and run the scoped production smoke checks.
- Any production environment/worker/schedule edit or manual production ingestion run, separately.
- E01 preflight/application/verification as a separate security release.
- Any new Redis service, paid plan or credential activation separately; none is necessary now.

Production approval readiness remains conditional on the full staging and runtime evidence gaps above. No live bandwidth reduction is asserted in advance.
