# Phase 4 observability contract

## Correlation and privacy

The Worker generates a fresh UUID before dispatch, overwriting browser-supplied X-Request-ID. General API and managed identity forwarding carry it to Render; all returned edge responses expose it. Render validates UUID syntax, generates one for direct callers and uses AsyncLocalStorage so concurrent requests do not share context. Existing logs gain request ID/route through the logger mixin. Internal jobs receive independent IDs. External services are measured locally; unsupported provider tracing headers are not invented. OAuth redirect round-trips and jose's internal JWKS HTTP are explicit coverage gaps.

Logs use finite route categories, not URLs/query strings. SQL labels are existing bounded hashes, never SQL or bind values. New metrics retain no tokens, emails, payment references, portfolio values, prompts, document bodies or user IDs. Logger redaction additionally censors legacy sensitive field names and raw errors/paths/cache keys. Error handler uses a fixed category. Provider-native access logs have their own configuration/retention: application redaction is not proof that every provider log is sanitized.

## Windows and measurements

Five UTC one-minute buckets, maximum 128 series, 14 histogram bounds. No database telemetry writes. Snapshots disclose exact current window/start/restart time. Counts, mean, error/timeout rate and bytes cover instrumented requests; histogram quantiles are upper bounds, not exact values. p50/p95/p99 require 20/100/1000 samples respectively; null also covers values beyond the highest finite 60-second bucket. Sparse traffic is unavailable rather than a zero-latency success.

Warm and first-60-process-second startup requests have separate series, as do fixed route categories and methods. Startup is not a measurement of all Render cold-start latency; an outside probe includes host wake/network delay. Health, public market data, authenticated data, Engine and background work must be evaluated separately. Response bytes are bytes passed to Express before wire compression. Request bytes are declared Content-Length, not an independent measurement of chunked uploads. Dependency durations can overlap and must not be summed as critical-path latency.

Database metrics cover pool acquisition, ordinary promise/callback queries, failures/timeouts/transaction categories and sampled decoded result-value size. Cache metrics cover get/set/delete/rate counters; hit/miss ratio uses only get outcomes. Redis fallback may conceal a remote failure and is explicitly disclosed. Managed SDK expected 4xx credential rejections are not provider outages; 5xx/timeouts are. Paystack instrumentation includes response validation and has no extra GET or charge POST. Python queue/execution and company bundle assembly expose aggregate durations; Node formulas remain route-timed. No paid AI call is enabled or instrumented as if it ran.

GET /api/v1/internal/observability requires the existing maintenance key, no browser Origin, rate admission and no-store. It reads memory only and exposes coverage, pool/query estimates, flags and signal availability. /ingestion-operations adds one explicit aggregate query, not a poller. /payment-operations remains gated by Phase 3. Neither diagnostics path is allowlisted through the public Worker.

## Service objectives

Proposed warm p95 targets: public market reads <=1s; authenticated data/session <=2.5s; bounded Engine <=5s. Proposed warm API server-error ratio <=1% over a representative day. Alert thresholds are >5% over at least 100 requests in the current five buckets and p95 above the class target where at least 100 observations exist. These are tuning/acceptance targets, not achieved production SLOs. Auth dependency error threshold >5% needs at least 20 operations. Render Free sleep, independent six-hour health probes and small traffic do not substantiate strict uptime or p99 promises. Establish a 24–72-hour representative baseline before tuning.

## Frontend collection

Disabled unless both reviewed frontend/Worker flags are enabled; Do Not Track disables installation. Reports include only kind, coarse route, source revision, coarse browser/device and timestamp; no stack/message/URL/user state. Per-page/kind dedup, five reports/minute and twenty/session; delivery uses a separate original fetch with omit credentials, two-second timeout and no retries. Worker checks same-origin JSON, exact keys/enums, freshness, 1KB streamed body cap, existing IP rate binding and max60 accepted reports/min/isolate. Client reports are marked untrusted and cannot authorize actions. A React boundary failure is recorded without inspecting the error. Asset-load failures remain detectable through global error/render categories; no complete browser crash/offline delivery guarantee is claimed.

A differing backend SHA may be accepted only when explicit --allow-equivalent-backend-tree mode obtains matching backend subtree hashes from GitHub for expected and observed commits. The report retains both SHAs and proof; missing/rate-limited metadata fails closed. This matches Render's verified rootDir=backend, not configuration equivalence or general cross-service compatibility.
