# Neon transfer optimisation

## Implemented changes

| Component | Previous behaviour | Prepared behaviour |
|---|---|---|
| `reconcile_cloud.py` | Context assembly after every processing batch, including empty batches following raw archival | Defer assembly in batches; one final refresh; bounded final object export; retain resumable checkpoints |
| `research_processing.py` | Latest full payload JSON for up to 2,000 context contributors | Same eligibility/order/limit, selecting status, destination, category, financial fields, cloud flag and existing context only |
| `scheduled_collect.py` | Repeat DDL; process before reservation/lock; refresh contexts both before and after collection | Validate existing schema, process only after slot admission, refresh once after collection |
| Python database | Lazy pool retries startup quota failures in workers | Explicit one-attempt startup probe for scheduled/maintenance jobs; otherwise retain lazy factory; finite pool reconnect window; unchanged two-connection ceiling |
| Collected research API | Transfer payload from SQL even when immediately replaced by current verified R2 object | Return null SQL payload with current pointer; preserve full no-pointer fallback in `prefer-r2`, strict-mode errors, source rights and integrity failures |
| Engine technicals | Three identical candle repository reads per bundle | Reuse one complete observation window within the job for SMA/RSI/MACD; no cross-request rights cache |
| Frontend financial history | Separate annual 10/20 queries; duplicate explicit warm-up | Covering annual-20/quarterly-50 keys, latest-N slices for short views, explicit larger requests preserved; one StockDetail warm-up |
| Upstash `getOrSet` | Each concurrent caller GETs Redis before checking pending work | Share lookup and producer together; clear pending on failure; count coalesced reads and producer runs |
| Health probe | Retry all HTTP failures with constant delay | At most three idempotent reads, exponential delay plus jitter; stop on terminal 4xx/rate limits; never log bodies |
| Telemetry | Slow SQL text logs, no result-size counters | Bounded hashed statement counters and decoded-value estimates; no SQL/binds/rows; protected admin read endpoint; Python aggregate job receipt |

No periods, source documents, tickers, corrections, historical returns or users are
removed. No financial rounding, algorithm changes, owner-scope changes, auth-cache
change, payment mutation replay or entitlement changes are included.

## Controlled comparisons

Baseline aggregate observed Nov 1 17:12 UTC, production read-only transaction,
two-second statement timeout, one connection, no returned financial records:

| Comparison | Before | After | Meaning |
|---|---:|---:|---|
| Context contributors | 147 | 147 | Identical bounded latest-input selection |
| JSON payload UTF-8 text bytes for one pass | 539,828 | 495,357 | 8.24% smaller projection on current data; not wire-byte accounting |
| Complete-drain 305-archive-record offline fixture | 62 context passes | 1 | 98.39% fewer context passes; all 305 archive receipts retained |
| Payload model for that fixture using measured input set | 33,469,336 bytes | 495,357 bytes | 98.52% reduction in this context-result model only; not total-job egress |
| SMA/RSI/MACD history reads in one bundle | 3 repository reads | 1 | Same complete 100-observation fixture and exact outputs; daily repository path ordinarily issues two SQL queries, so 6 → 2 for this part |
| Concurrent Upstash miss fixture, two callers | 2 GET + 1 SET | 1 GET + 1 SET | Producer still runs once; no limiter fail-open |
| Annual short/full frontend history views | 2 query keys | 1 | Real QueryClient dedup test; 20 rows retained and last 10 displayed where requested |
| Quota-rejected scheduled startup | Multiple observed worker attempts | 1 attempted connection before pool creation | Mocked provider failure test; no production quota was induced |

The real 515-second Nov 1 job checkpointed after 305 archives, so it executed at
least 61 batches rather than necessarily the 62 passes in the complete-drain
fixture. The 98.52% figure is deliberately **not** advertised as a measured total
Neon reduction. Other queries, raw snapshot reads, TLS/protocol/auth traffic,
writes/RETURNING and cache misses remain outside that comparison. Production
before/after throughput and billed-transfer trends require approved deployment.

## Database and API audit

Frequency below describes code/configuration, not measured request counts.
Historical per-endpoint transfer sizes are unavailable. New telemetry provides
sampled decoded-value estimates only; actual network usage remains a Neon metric.

| Implemented area | Database dependency and transfer shape | Reuse, frequency and disposition |
|---|---|---|
| Managed login/session/revocation | `managedVerifier`, broker and identity database; owner/issuer-bound small session/user rows; live managed session check plus touch | JWK metadata already cached; live authorization retained. No settled decision cache added |
| Subscription/account/Paystack | Owner-scoped plan/profile rows; signed/idempotent webhook transaction and renewal worker | Preserve live plan ownership, downgrade and payment guarantees; no shared private-result cache |
| Community feed | `communityFeed.js`: one guarded bounded SQL feed including authors/reactions | Existing set-based feed avoids per-post auth/query fan-out. Not a full financial registry read |
| Portfolio/watchlist and sparklines | Owner-scoped records; `getQuotesBatch` and `getRecentClosesBatch` | Existing list batching retained. Portfolio holdings are not put in public caches |
| Quote/indices/instruments | Price/securities repositories, small market-wide quote sets | Existing public cache; price worker 30 seconds, index worker 30 minutes in Render config; market calendar gates remain |
| Canonical financial history | `market.canonical_financial_history`: issuer, annual/quarterly and max periods; latest helper asks one | Frontend covering-window dedup; rights stay server-side. No indefinite financial result cache added |
| Public publisher detail | `collectedResearch`: issuer/destination/page, latest category, current rights and current archive pointer | Discarded SQL JSON removed in cloud path. R2 object reader verifies identity/hash/size; no rights bypass |
| Candle history/technicals | Canonical date-range bars plus eligible publisher observations, merge chronological rows | Required range preserved; technical bundle shares one job read. No blanket row truncation |
| Company Engine analysis/forecast/scenarios/factors | `engineBundle`, `engineAnalytics`, Python calculators: quote, annual 10, quarterly 12, actions, publisher research | Existing 60-second bundle cache, bounded concurrency and dated last-good retention; mathematical functions unchanged |
| Portfolio risk/correlation/attribution | `engineWorkspace`, `stockRisk`, `enginePortfolioRisk`: owned holdings plus public historical bars/actions | Existing quote-revision/range-keyed 30-second public risk history cache; shared within risk workflow. Alignment/gap rules unchanged |
| Optimisation/backtesting/stress/notebooks | Engine workbench routes, investment/institutional Python modules and owner-scoped snapshots | Backend calculations retain full appropriate samples, inputs/bounds/Plus checks. No browser bulk export added |
| Liquidity/macro/exposure/graph tools | Source-gated investment/relationship records and calculator inputs | Existing evidence/verification gates preserved; do not assert a planned tool is implemented merely from its name |
| Engine snapshots/comparisons/monitoring | Two latest issuer snapshots, per-owner monitor rules; finite cron and bundle reuse | Already bounded latest-state reads; per-holding dividends/history still scale with owned positions but existing concurrency/range limits retained. Not proven dominant; monitor before a broader rewrite |
| Raw document collection/archive | Durable jobs, checksums, immutable extraction version receipts, small archive batches | Necessary first-time snapshot reads remain; no repeated full DB comparison. Logical gzip/R2 counters are separate |
| Reconciliation company assembly | Latest eligible input per security/destination/category | Principal proven repeated-read fix; full registry coverage retained, once per run rather than per archive batch |
| Health | Liveness no DB; deeper health has short-lived in-flight coalescing and small status SQL | Not treated as a primary GB source. Probe retries finite; no new frequent polling |

### Query and index choices

Source-rights predicates, SHA validation, latest-category order and revision equality
remain in SQL. Projected JSON fields include every value consumed by
`company_context`; full original objects stay in private storage. No timestamp-only
incremental filter was introduced: corrected older filings, late arrivals and
permission changes still enter the existing version/checksum/rights selection.
Routine raw/processed archiving retains receipt keys and compare-and-swap guards.

No speculative index is prepared or applied. Reduced transfer comes from selecting
less and executing less; current 147-row result does not justify an unmeasured
production index. Existing issuer/date/owner/receipt keys and bounded predicates
remain. If new counters reveal slow high-volume queries, inspect a bounded plain
`EXPLAIN` and existing indexes first; obtain approval for production index DDL.

## Workflow audit

| Workflow | Production DB access | Prepared action |
|---|---|---|
| `cloud-reconciliation.yml` | Collector DB secret; four UTC runs/day | Remove irrelevant raw-migration allowance settings, keep regular 16 MiB source/R2 reservation; fixed shared Python loop; routine schema validation only |
| `scheduled-collector.yml` | Collector DB secret; news/documents three runs/day each | Same schedules/flags/budgets; shared fail-fast/metrics, no routine DDL, processing after lock, one context assembly |
| `operational-health.yml` | No DB credential; bounded HTTP live/HTML/market | Test retry helper before live checks; exponential jitter/terminal-stop logic |
| `operational-alerts.yml` | No provider secrets/checkouts; workflow metadata only | Existing failure/recovery issue receipts retained, exact workflow names unchanged |
| `api-protection-tests.yml` | Local fixtures, no production DB secret | New backend regression tests run in existing suite |
| `native-rewrite-tests.yml` | Disposable Postgres/Redis and local numerical fixtures | New Python recovery/volume tests run in existing discover suite; no native production cutover |
| `security-checks.yml` | Dependency/static checks | Retained |
| `codeql.yml` | Static analysis, including weekly schedule | Retained; not a collector or DB export |

Collector and reconciliation still share `continua-scheduled-collector` concurrency
with `cancel-in-progress: false`; critical writes are not cancelled. Normal cron
contains no `--migrate-raw`, cleanup or import flags. Raw migration remains explicit
maintenance. No existing flag or cron value was modified in production.

## Cache configuration and freshness

The implementation supports `CACHE_DRIVER=upstash`, but Render currently uses
`memory` and exposes no Upstash/Redis credential keys in its service variable list.
Enable the existing server cache only after approval and confirming existing
provider credentials/limits. Required keys: `UPSTASH_REDIS_REST_URL`,
`UPSTASH_REDIS_REST_TOKEN`, `CACHE_NAMESPACE`, `CACHE_DRIVER`.
Never expose the token via Vite/browser variables. Keep a versioned production
namespace distinct from staging. Avoid changing the Blueprint back to `memory`
after manual configuration; review `render.yaml` during approved configuration.

Single-flight is per key/process, not a distributed lock. Redis TTLs, invalidation
and key ownership remain unchanged. `rateLimitCommand` still propagates failures;
ordinary-cache fallback does not become authorization or limiter bypass. No new
stale-while-revalidate policy was applied to protected/rights-sensitive decisions.

New instrumentation is in-memory on Node, bounded to 128 fingerprints plus overflow,
eight sampled rows, depth/node limits. Python emits one aggregate on close,
including transactional query results. Neither logs raw SQL, parameters, tokens,
source contents, payment data or private records. Sampling may under/overestimate;
truncation counts identify incomplete samples. See the operations guide for limits.

## Validation record

Final suite counts and commands are maintained in the operations guide. The
initial sandbox backend failures were local loopback/Python execution restrictions;
rerunning with permitted local execution and the pinned worker passed 602 tests
(18 skipped). The initial collector run exposed eager probing in a lazy-factory
test; probing is now explicit only for jobs, preserving the original lazy factory.
The initial Engine environment lacked NumPy; pinned NumPy/SciPy were installed only
in the ignored local test environment. These failed attempts are not hidden as
production faults or counted as passing validation.
