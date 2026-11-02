# Phase 1 implementation

Date: 2 November 2026. Branch: `codex/phase1-efficiency`. Status: local implementation and disposable PostgreSQL verification; **not deployed and no findings closed**. The four engineering audit documents remain the baseline. No Go cutover, production job dispatch, environment edit, paid service, identity mutation or production DDL occurred.

## What was wrong and what was already fixed

**E02:** Render still serves `8a5b350`, while GitHub main and the successful Cloudflare build are `ff99c35`. Render's live settings show root directory `backend`, no additional included/ignored paths, and **After CI Checks Pass**. Its events show no newer attempted backend deployment. Intermediate releases had failed checks; the final repair changed only `app/tests/alertFunctions.test.ts` and `infra/migration/native-bundle-parity.mjs`, outside that root. This is a release admission/trigger gap, not evidence of a failed newer Render build. Provider events do not identify the precise check that suppressed every intermediate commit. Root-filter behavior is documented by [Render](https://render.com/docs/monorepo-support); deployment after successful checks is described in its [deployment documentation](https://render.com/docs/deploys).

The prior bandwidth patch already batches context refreshes, projects collector fields, avoids R2-authoritative payload transfer through Neon, shares technical observations, deduplicates frontend history windows and bounds health retries. Root lockfile and CI fixture failures were already repaired. The new successful scheduled reconciliation at `ff99c35` confirms that the Python/GitHub path has the earlier changes. Render's old revision does **not** contain that backend patch.

**E03:** There is no existing Upstash database to activate. The authenticated Redis inventory shows zero commands, zero storage and $0.00 cost, with “No database has been created yet.” Render uses memory and has no Upstash REST credentials. No service was created. Retain memory for this release; the optional adapter is prepared, not activated.

**E10:** Portfolio enrichment made up to 20 dividend queries. Browser data limited rows but transferred serialized results before checking its 4 MiB response cap. Neither justifies dropping historical data or changing calculations.

**E08:** Logging was mounted after identity/data/function routes and used raw paths. SQL estimates covered only one helper, omitting direct pool clients and transactions. Existing collector receipts already record retries, transfer budgets and processing counts; no new monitoring database is needed.

## Implemented changes

| Finding | Files | Before → after | Verification / compatibility |
|---|---|---|---|
| E02 | `backend/src/release.js`, `api/controllers/health.controller.js`, `infra/deployment/phase1-release-manifest.mjs`, `phase1-observed-release.json` | Health exposed only Render SHA; now also exposes a non-secret configuration/schema contract. Manifest separates observed components from candidate HEAD and dirty worktree. | No SQL in liveness. Missing/invalid SHA remains null. Legacy applied migration and source migration digest are explicitly different. |
| E08 | `monitoring/poolMetrics.js`, `queryVolume.js`, `storage/db.js`, `auth/runtime.js`, `api/routes/admin.routes.js` | Instrument actual acquired clients once, including callbacks, direct callers and transactions in both pools. Report acquisition count, failures, wait duration and pool gauges. Remove helper double counting. | Callback/release/result behavior tested. Pool limits remain application 10 / identity 3. Streaming Query objects and other processes remain excluded. Protected diagnostic route remains admin-only/no-store. |
| E08 | `api/middleware/requestLogger.js`, `api/server.js` | Early middleware measures all entrypoints with a generated/validated UUID, fixed route category, status, time and response bytes. | No raw path, query, token, email, body, portfolio, payment reference or content logged. Fixed categories bound cardinality. Response bytes are application body bytes, not TLS/network billing. |
| E10 | `storage/repositories/corporateActionsRepository.js`, `services/research/engineWorkspace.js` | Up to 20 complete per-security dividend reads → one bounded `ANY(text[])` query grouped by security. | Actual SQL fixture retains all 500 historical rows, dates, cancelled records and precise values. Existing 20-holding product limit and missing-data behavior stay explicit. |
| E10 | `data/browserData.js` | Full result sent to Node before size rejection → materialized serialized result and exact UTF-8/comma/bracket byte check in SQL; oversized result returns only a sentinel. | Existing 4 MiB cap, row limits, exact counts, claims, local role, live guard and response shape preserved. Oversized mutation representation rolls back without replay. This bounds transfer, not PostgreSQL work/memory. |
| E03 | `storage/cache.js`, `cache.d.ts`, `upstashCache.js` | Entry-count-only memory cache / unbounded REST writes → 1 MiB entry cap, 64 MiB approximate serialized-value memory budget, 24-hour maximum TTL, metrics and versioned REST ordinary-data keys. | Oversized producers still return their result; prior cached value is removed. TTL expiry, restart, user-key isolation, remote miss and outage fixtures pass. JS object overhead is additional to the serialized budget. |
| E03 | `services/research/publicationPolicy.js`, `engineBundle.js` | A last-good bundle could survive source ACL revocation → fresh SQL source-policy digest before every bundle cache read. Cache envelopes and assembly keys bind to that digest. | Permission dependency failure is 503, not stale research. Changed digest cannot reuse old contents. No settled auth/plan decision cache introduced. See limitations below. |
| E01 | Separate security SQL, grant snapshot and PostgreSQL role fixture | Remove only profile administrative privileges; preserve all existing DML/column grants. | Separate migration/release, never automatically applied to a remote database. See [E01](E01_PRIVILEGE_REMEDIATION.md). |

Added focused cache, policy and telemetry tests; adjusted stale-cache/concurrency fixtures and native company-bundle fixture to supply a synthetic policy digest. Runtime API/numerical outputs remain unchanged. Language rationale is recorded in `docs/architecture/FEATURE_LANGUAGE_DECISIONS.json`: existing JavaScript, SQL and Python, with no additional runtime.

## Cache policy and limits

- Quotes/instruments/public observations retain existing exchange/symbol/date-window keys and TTLs. Optional REST ordinary-data keys add `:cache:v2:` after the approved environment namespace; limiter keys keep their separate namespace and Lua contract.
- Never put session validity, effective subscription, private portfolio aggregates or provider permissions into a settled ordinary-data cache. Backend owner/plan verification still precedes private routes. Private browser responses remain private/no-store.
- Source policy is checked live for company bundles, including last-good responses. One small SQL digest per request is an intentional security cost. A source-wide change invalidates more issuers than necessary; measure CPU/latency before activation. A statement already in flight has normal database/request snapshot race limits; this is not instantaneous cancellation of bytes already sent.
- Node publishers already invalidate the stable Engine bundle and last-good keys. When last-good is absent, the new code discards the matching policy-keyed assembly before rebuilding. Python ingestion does not directly invalidate Node memory; existing 60-second freshness and dated background refresh remain. Do not claim cross-process immediate ingestion invalidation.
- REST authoritative miss never falls back to stale local data. Transport errors may use local ordinary values only within their remaining TTL; rights checks and all live security decisions remain independent. Configured shared limiters propagate outages and fail closed. No fallback can authorize a request.
- Single-flight prevents duplicate producer/GET work **within one process**. There is no distributed lock or cross-instance stampede guarantee. The current deployment is one process.
- New oversized writes delete an old entry, rather than retaining obsolete content. Older remote namespaces are not reused. Memory tracks serialized bytes plus an entry-count bound; it does not guarantee an RSS ceiling.
- Valid Engine responses above 1 MiB remain available but are not cached. They may repeat producer/database work; measure representative bundle sizes before choosing a different cap. The TCP `CACHE_DRIVER=redis` adapter was inspected but is not activated or newly certified by the REST/memory tests.

## Upstash decision and command budget

No existing database means no account-specific plan/throughput/maximum-value allowance can be verified. The public [Redis pricing page](https://upstash.com/pricing/redis) currently lists Free at 250 MB storage, 10 GB monthly bandwidth and 500K monthly commands; PAYG lists $0.20/100K commands. These are vendor offers, not an activated account plan. Actual limits must be checked on any future database before credential configuration.

Count Lua subcommands, not only HTTP requests: Continua's limiter executes EVAL, INCR, PTTL and sometimes PEXPIRE. [Upstash's cost examples](https://upstash.com/docs/redis/sdks/ratelimit-ts/costs) likewise count commands executed inside scripts. For illustration, three limiter admissions plus one cache GET cost roughly **10–13 commands/request**, before SET/DEL, background work, retries or additional routes. 1,000 such requests/day over 30 days models 300K–390K commands; 10,000/day models 3M–3.9M. At PAYG's listed rate the latter is about $6–$7.80 command cost, excluding other applicable charges. These are workload models, not measured traffic or a cost authorization. Free quota exhaustion would affect fail-closed limiters, so do not silently activate Free for all traffic.

Required future server-only variables: `CACHE_DRIVER=upstash`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and an isolated `CACHE_NAMESPACE` such as `continua:production:phase1-v1`. No credentials belong in the frontend, reports or git. Existing memory remains the justified zero-service alternative for this single-instance release; it loses cache and local counters on restart and cannot coordinate multiple instances.

## Reviewed changes deliberately not made

Publisher candle SQL already filters dates server-side and preserves source/version/correction gates. Do not reduce its observation coverage. Historical and corporate-action reads used by risk alignment have different contracts from trailing dividend calculations; do not reuse a partial list merely to reduce a query count.

Browser reads remain limited to 1,000 rows and offset 1,000,000. No generic cursor was added: arbitrary tables have different keys/order/null semantics, and no measured list-specific cursor bottleneck justified changing the browser contract. Existing feed behavior and UI pagination remain intact. No new index was added without a production plan/cardinality case. The dividend batch uses the existing security lookup; the fixture index is synthetic, not a proposed migration.

The bounded calculation queue remains concurrency 2, maximum waiting 8, with existing wait/worker/input/output limits. No numerical worker, payment, entitlement, ownership or collector architecture was rewritten.

## Remaining gates

See [measurements](PHASE1_PERFORMANCE_RESULTS.md), [deployment](PHASE1_DEPLOYMENT_PLAN.md) and [rollback](PHASE1_ROLLBACK_PLAN.md). Full seven-flow deployed staging measurements, independent HTTP Worker SHA attestation, real Upstash atomicity/capacity and representative provider egress remain unverified. Local fixtures do not close E02/E03/E08/E09/E10 or establish production bandwidth savings. E01 stays open until separately approved live application and verification.
