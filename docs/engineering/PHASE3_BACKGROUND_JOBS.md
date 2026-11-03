# Phase 3 background jobs

## Existing work and guarantees

| Work | Category | Recovery and scheduling decision |
| --- | --- | --- |
| Quote/profile/API reads; bounded numerical calculations | Short synchronous | Preserve existing query/cache/source-rights guards. CalculationQueue concurrency=2, bounded waiting and five-second child deadline; no durable queue for every request. |
| Cache refresh/bootstrap | Finite best effort | Process-local work may be lost; restart/current-data requests retry. It does not own paid financial effects. |
| Paystack receipts and uncertain references | Durable business critical | New SQL receipt, uniqueness, leases, bounded GET verification and review; existing fulfillment remains atomic. |
| Application expiry/alerts | Periodic maintenance | New fixed periodic_jobs entry, one live SQL lease, fenced completion and five-attempt budget. Expiry-aware entitlement reads remain correct even before profile cleanup. Existing alert SQL marks/delivers atomically. |
| Financial documents, archive pages and extraction versions | Durable business critical | Existing GitHub finite collectors, document_jobs, archive checkpoints, hashes and version receipts preserved. Stricter completion fence plus bounded backoff. |
| Price/index/candle/financial/publication cron | Periodic / refresh | Existing Render timers and startup passes retained. Candle bootstrap/backfill can recover gaps on restart; a sleeping timer alone is not guaranteed delivery. Existing GitHub collection/reconciliation remains independent. |
| Owner Engine research, risk, simulations and exports | Synchronous bounded or existing persisted result | Preserve server entitlement/owner checks and persisted simulations. No measured task justified a new async user-job API; client exports are not turned into server queues. |

The new maintenance ledger has one reviewed name, application-maintenance. It is not a browser-programmable executor. Claim and completion are separate atomic SQL operations; callbacks do not hold a connection for their full duration. Lease is ten minutes, retry delay is bounded, five consecutive failed/expired attempts lead to review. Success resets the retry streak and sets the next due time to the next UTC hour. A stale worker cannot acknowledge after lease loss. Business functions must remain idempotent because lease recovery can execute work again.

New payment verification uses the existing pool and a process-local coalescer only as a latency optimization. Each drain starts at most five items and stops admitting items after its 40-second budget. An already started bounded provider verification may finish later; its SQL completion must still own an unexpired 180-second lease. Existing provider requests each have a 15-second timeout. There is no unbounded retry loop, private browser result cache or new polling timer.

The existing independently scheduled Cloudflare application-maintenance request is the wake-up path while Render Free sleeps. When the Phase 3 flag is approved, it seeds at most 20 native and 20 hosted old known references per wake-up, kicks verification, admits at most two due renewal candidates and runs/observes fixed maintenance. References already under actionable recovery or review are not cycled back through initiation. Busy/uncertain mandates do not consume the entire due-candidate batch and starve other users.

No cron expression, workflow enablement or deployment flag was changed in production. Independent scheduler configuration, its secret and observed execution must be verified before activation. Without a healthy independent wake-up, recovery waits for user traffic or the next service wake. Current hourly wake-up can imply roughly hour-scale recovery plus cold start/backoff; a tighter cadence is a separately reviewed operational/cost change, not silently enabled here. No paid worker/queue is needed for the tested low-volume workflow, but no strict uptime/latency SLO is claimed for free sleeping infrastructure.

## Ingestion recovery and monitoring

Document completion now requires matching attempt, processing status and an unexpired lease. Failed attempts back off with jitter from about one hour up to 24 hours; existing scheduled retry ceilings remain. Exhausted items retain their failed state and evidence for operator review. Hash aliases, immutable extraction receipts, source/checksum/version identity, issuer fairness and full NSE scope are unchanged. No history, archives or job rows are deleted or merged.

GET /diagnostics/document-recovery in the native collector operator API is protected by its existing operator key. It performs one aggregate read for source/status counts, first-work age, last-update age, due items, expired leases and scheduled retry exhaustion. No URLs, document bodies or private payment data are returned. This candidate API has not replaced the deployed scraper service.

The backend's existing maintenance-secret router adds GET /api/v1/internal/payment-operations only while the new flag is enabled. It returns aggregate payment, periodic and document recovery state. GET performs no alert-state writes. Scheduled observations batch alert transitions in operations.alert_state and log safe categories only when warning/clear state changes. Categories cover payment review/backlog/expired leases, unobserved/overdue/review maintenance, unavailable ingestion, aged backlog, retry exhaustion and expired document leases. Existing market-open quote freshness checks remain authoritative for missing market updates.

## Operator recovery

1. Inspect aggregate status and configured scheduler receipts; do not respond to a timeout by sending another charge.
2. For payment review, use trusted SQL tooling to read a bounded set of internal receipt IDs, modes, original references and safe categories. Verify the same reference through the existing server/provider read path. Resolve amount/currency/owner/status conflicts before any financial action.
3. For document failures, inspect existing dead letters and provenance. Approve a targeted retry only after fixing the source/dependency issue; preserve archive IDs, checksums, versions and checkpoints. Do not reset all attempts or reopen disabled sources.
4. For a failed maintenance lease, verify the previous worker is no longer active and business effects are reconciled before an approved targeted retry. Never clear a live lease merely because a caller disconnected.
5. Review rows and terminal receipts are retained. Retention/archival and a public progress/cancellation API for a genuinely long Engine workload are future scoped decisions; no automatic destructive cleanup was introduced.

A total scheduler/database outage cannot report its own durable alert while unavailable. Existing Cloudflare/GitHub failure receipts and operator probes provide the outside view. No new outbound email/Slack service was configured.
