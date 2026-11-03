# Neon bandwidth operations and approved rollout

## Deployment gate

**Not deployed. Explicit user approval is required before merging/pushing main,
deploying services/workflows, editing production environment/schedules or buying
capacity.** The earlier approvals in the authentication migration do not override
this incident's approval boundary. Local remediation branch:
`codex/neon-bandwidth-efficiency`; production reference `8a5b350`.

Do not resume anything automatically. At the Nov 1 inspection all eight workflows
were active, and the document/news flags were true. A future disabled flag may
be an intentional incident measure. Recheck it and request specific approval.
No data deletion, identity mutation, full migration, cleanup or new service is
required for these fixes.

## Prepared deployment order

1. Review this branch, the incident evidence and tests. Recheck live revision and
   production quota once. Save current code version and non-secret settings;
   existing recovery snapshots remain intact. Do not create another bulk export.
2. Approve merging/deploying the code and workflow changes as one reviewed release.
   A main push may trigger Render/Cloudflare automatically; therefore do not push
   main merely to obtain a review link. No remote push was made in this task.
3. Deploy backend and frontend through their existing pipelines. No database DDL,
   auth callback, pool host, subscription or payment configuration change is needed.
   Keep `PROCESSED_STORAGE_READS=prefer-r2` initially. The no-pointer fallback stays
   supported; corrupt cloud objects never silently fall back.
4. Deploy the updated existing scheduled-job code. Preserve all cron values,
   approved source/R2 byte ceilings and non-cancelling concurrency. Normal
   reconciliation must not pass migration/cleanup/prepare-schema flags.
5. Separately approve configuring the **existing** Upstash cache, if credentials
   and its allowance are available. Set server-only `UPSTASH_REDIS_REST_URL`,
   `UPSTASH_REDIS_REST_TOKEN`, `CACHE_DRIVER=upstash` and an isolated versioned
   `CACHE_NAMESPACE`. Do not commit secrets or put them in frontend Vite config.
   Reconcile the Blueprint (`render.yaml` currently specifies `memory`) before a
   subsequent Blueprint sync. Check existing Upstash capacity first; do not create
   a new paid database or assume arbitrary cache payload sizes are supported.
6. After explicit approval for one bounded manual verification run, let one normal
   reconciliation continue existing pending receipts. Check failures, coverage,
   duration, context-refresh count and decoded-result metrics. Do not launch a
   full backfill or repeated failed-job reruns. Cron may already be enabled;
   coordinate the manual run with its existing concurrency lock.
7. Complete the application verification below, then observe representative
   24–72-hour transfer trends. Only then assess sustainable monthly capacity.

No new environment variables are mandatory for the code-only release. Upstash is
a separate configuration task. No paid upgrade is bundled with this approval.

Latest pre-release deep health: Nov 2 14:50:59 UTC, HTTP 200 in 1,308 ms, database,
cache and quote freshness all true. A preceding 30-second HTTP check timed out;
one bounded follow-up passed. Free Render cold start is plausible, not proven by
those two observations. This confirms current connectivity, not post-release
performance or sustainable monthly transfer.

### Schema readiness and explicit maintenance

Routine collector/reconciliation now validates checkpoint tables instead of
replaying DDL. Existing production archived records already demonstrate that
these tables exist. If validation reports missing tables, stop the job; do not
automatically apply arbitrary SQL. Confirm target and approve the known additive
maintenance migration first. Reconciliation has a deliberately explicit
`--prepare-schema` maintenance switch; it is never included in cron. The existing
collector maintenance path remains available. Inspect its effects (it may process
evidence as well as prepare it) before invoking it. Neither path was run here.

## Monitoring without creating a new bandwidth source

### Authoritative project usage

Read the existing Neon project usage dashboard once per day and after an approved
bounded job when diagnosing a spike. Record UTC observation time, billing period,
network transfer, revision, jobs since last observation and whether a migration or
backlog ran. Dashboard snapshots: Nov 1 230.27 MB; Nov 2 662.56 MB. Reset was Nov 1;
the reported next reset is Dec 1 UTC. These are project-wide counters, not per-query
cost attribution. Never equate R2 logical budget receipts with Neon egress.

Use the provider's displayed limit/unit for percentages. Operational review at
70%, urgent review at 85%, and a critical response at 95% are suggested thresholds,
not settings changed here. Project month-to-date growth must be interpreted with
one-time backlog/migration periods labelled. A 5 GB allowance corresponds to about
167 MB/day averaged over 30 days; aim lower to retain headroom. No promise of Free
Plan viability is justified by the current 432.29 MB inter-observation increase.

Free has limited monitoring retention. The documented consumption-history API is
not universally available on Free; don't repeatedly call an unavailable plan-gated
endpoint or store usage samples in Neon itself. Existing GitHub failure/recovery
receipts remain active. A paid upgrade requires separate approval and does not
substitute for eliminating redundant reads.

Sources checked: [Neon plans](https://neon.com/docs/introduction/plans),
[consumption metrics](https://github.com/neondatabase/website/blob/main/content/docs/guides/consumption-metrics.md),
[connection pooling](https://neon.com/docs/connect/connection-pooling).

### Application and collector telemetry

* Node: existing protected `GET /api/v1/admin/diagnostics/query-volume` returns
  query fingerprints, calls, failures, sampled result-value bytes, sample truncations
  and cache driver/counters. It is behind the existing admin key and rate limiter,
  marked `no-store`, and requires no diagnostic SQL. Access directly through the
  existing trusted administrative route; do not expose the admin key to browser
  bundles or weaken the Cloudflare admin block. Once every 5–15 minutes during an
  incident is sufficient; no continuous polling is introduced here.
* Node also logs one result-volume summary every five minutes **only if queries
  occurred**. A window exceeding 8 MiB of estimated result values emits a warning
  for investigation. This is an anomaly threshold, not a Neon allowance alarm or
  automatic service cutoff. The timer is unreferenced and does not keep a worker alive.
* Coverage is explicitly limited to the shared query helper; direct client,
  transaction and separate identity-pool queries are excluded. Do not claim it
  accounts for all database traffic. Metrics reset with the process and logs
  provide the existing retention path.
* Python: `database-result-volume` JSON at database close includes helper and
  transaction query results. Top fingerprints/counts/sizes appear in the existing
  job logs. Job receipts include one `companyContextRefreshes` for normal completed
  reconciliation. Interrupted/budget-paused runs may stop before that phase.
* Bounded samples (eight rows, 4,096 visited values, depth limit and maximum
  fingerprint cardinality) estimate decoded scalar-value bytes, excluding protocol,
  column names, TLS and provider-managed auth. Row distribution and truncation can
  under/overestimate totals. A fingerprint is a diagnostic key, not raw SQL.
* Upstash metrics: hits/misses/failures/shared reads/producer runs. Shared in-flight
  work is process-local; Redis remains the shared settled cache. Limiter failures
  still fail closed. Never cache settled authorization to reduce query counts.

Keep credentials, JWTs, provider cookies, payment secrets, raw SQL/binds and private
records out of diagnostic reports. Do not paste full provider logs into issues.

## Incident response and recovery

1. If a provider quota error recurs, stop manual retries. Scheduled Python startup
   emits `DatabaseQuotaUnavailable` after one explicit connection request before
   creating the pool; other startup failures emit `DatabaseUnavailable`. One libpq
   request may try multiple resolved IP addresses. No mutation is replayed.
2. Record the failure run, step, safe error class and time. Distinguish quota from
   missing schema, credential, permission, rate-limit and transient network faults.
   Repeated IPv6-unreachable messages alone do not prove the primary cause.
3. Request approval to pause only the responsible source/document/news flag or
   workflow if needed. Do not pause auth/payment verification or change private
   data to make the app appear healthy. Flag names:
   `CONTINUA_SCHEDULED_DOCUMENTS_ENABLED`, `CONTINUA_SCHEDULED_NEWS_ENABLED`.
   Reconciliation shares the documents flag. Operational health/failure receipts
   should remain available. No flag has been toggled by this investigation.
4. Preserve queue leases, extraction/checksum versions and R2 verification receipts.
   Failed jobs must not be marked as successful processing. A finite checkpoint or
   budget pause is distinct from an exception/failure.
5. Once the dashboard indicates recovery, make one tiny read-only connection/probe,
   not a full registry export. On failure stop and inspect provider status.
6. After approval, resume a single bounded normal run, inspect receipts and compare
   distinct archived/processed versions before approving additional backfill.
   Existing idempotent archive and processing keys prevent resetting progress.
7. Collect 24–72 hours of representative post-release project growth plus job/API
   metrics. If projected usage plus headroom still exceeds Free, present a measured
   capacity/usage decision; obtain explicit approval for any upgrade.

The startup probe adds one short-lived connection for admitted command-line jobs
on healthy startup; it trades that small overhead for fail-fast quota rejection.
API callers retaining the default lazy database factory do not incur that probe.
Pool bounds remain two Python and ten shared Node connections. Direct-versus-pooled
hostnames were not changed: PgBouncer transaction pooling has session-state caveats
and is not a fix for transferring the same result repeatedly.

## Regression and release verification

Local results (complete final counts below; skipped provider fixtures are explicit):

| Check | Result |
|---|---|
| Backend Vitest, Python worker and local HTTP permitted | 603 passed, 18 skipped; admin diagnostics authorization included |
| Backend declaration/type check | Passed |
| Frontend Node tests | 184 passed; real QueryClient dedup included |
| Frontend app TypeScript check | Passed |
| Collector Python discovery | 207 tests, passed, 6 skipped (external PostgreSQL fixture not configured) |
| Engine Python discovery with pinned NumPy/SciPy | 166 tests passed |
| Health retry helper | 2 tests passed, no real network calls |
| Disposable embedded PostgreSQL canonical fixture | 99 checks passed, 6 fixture companies, zero production companies processed |
| Frontend production and backend JavaScript builds | Passed locally; no deployment |
| Browser artifact security and managed Auth issuer audits | 187 files scanned, zero credential findings; production issuer pinned |

Reproducible commands from repository root, using the existing local Python venv
or the CI Python with pinned dependencies installed:

```powershell
$env:ENGINE_PYTHON_BIN = '<local Python with backend/python/requirements.txt>'
$env:NATIVE_PYTHON_BIN = $env:ENGINE_PYTHON_BIN
$env:PYTHONPATH = 'financial-engine'
npm --prefix backend test -- --reporter=dot
npm --prefix backend run typecheck
npm --prefix app test
node app/node_modules/typescript/bin/tsc --noEmit -p app/tsconfig.app.json
& $env:ENGINE_PYTHON_BIN -m unittest discover -s financial-data-collector/tests
& $env:ENGINE_PYTHON_BIN -m unittest discover -s financial-engine/tests
node --test infra/security/health-probe.test.mjs
node infra/migration/canonical-financial-fixture.mjs
```

Tests cover complete numerical histories, exact indicator parity, rights gates,
cloud corruption/no-pointer handling, owner/entitlement boundaries, pending cache
failure recovery, terminal startup quota errors, preserved archive progress and
bounded telemetry without data disclosure. The real disposable SQL fixture checks
source revocation and archive/canonical behaviour. It is not a production load test.

After approved release verify: existing email/Google sign-in and confirmed sign-out;
first reaction/feed; all three plan displays; own portfolio/watchlist isolation;
other-owner read/write rejection; correct quote dates; Fundamentals instant cached
return and eventual fresh update; full financial periods; Engine numerical results;
signed payment handling through existing non-charge fixtures; source-rights revocation;
collector checkpoint resume; cache restart/miss/hit; and provider transfer slope.
Do not create users, initiate charges, reset passwords or revoke customer data for
these tests. Use the user's existing session and existing authorised fixtures.

## Rollback

Restore the previous deployed frontend/backend revision `8a5b350` using existing
deployment rollback. No schema migration is needed for this patch. Keep newly
written immutable evidence and receipts: rolling code back must not restore an
older database or erase newly collected filings/users. Return cache configuration
to its recorded prior state (`memory`, prior namespace) only if that configuration
change was approved and caused a regression. Leave archive pointers and source
permissions intact. Do not flush a shared Redis database, reuse staging keys or
disable limiter/authorization checks. Roll back workflow code separately while
preserving consciously paused flags; do not automatically restart expensive jobs.

If rollback restores the repeated-read implementation, keep the offending schedule
paused only with approval until repaired. A successful monthly reset is not closure.
