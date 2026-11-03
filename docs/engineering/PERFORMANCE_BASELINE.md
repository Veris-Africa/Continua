# Continua performance baseline and toolkit audit

2 November 2026, source `ff99c35`. This is a baseline with explicitly unmeasured
items, not a claim that performance SLAs or Core Web Vitals have passed.
Finding details: [audit](CONTINUA_AUDIT.md), especially E02/E03/E08/E10/E13.

## Observed measurements

| Observation | Result | Evidence and limits |
|---|---|---|
| Public production HTML | HTTP 200, `text/html`, Brotli, 951 ms | Single request 15:23:40 UTC; not browser render, TTFB percentile, login, LCP or user-session performance |
| Backend liveness during this audit | One 30-second timeout; no retry | Cause unproven; Render Free wake-up can exceed 50 seconds. Do not label this a Neon quota failure |
| Current backend artifact | Render dashboard reports `8a5b350`, not repository `ff99c35` | Live-source drift must be resolved before claiming new API optimisations/metrics are active |
| Earlier deep health | 2 Nov 14:50:59 UTC HTTP 200 in 1,308 ms, DB/cache/quote freshness true | Historical same-day evidence; not a continuously healthy interval |
| Cloudflare production/preview builds | `ff99c35` passed | Verified during preceding release repair; build success is not authenticated journey performance |
| Main JS | 469.91 kB; gzip 149.52 kB | Clean local production build, rounded bundler output; not all route assets load initially |
| Main CSS | 186.15 kB; gzip 28.87 kB | Same build; actual browser cache/critical render cost unmeasured |
| StockDetail route JS | 164.68 kB; gzip 43.76 kB | Deferred route chunk |
| Engine route JS | 189.84 kB; gzip 46.98 kB | Deferred route chunk |
| CartesianChart JS | 351.44 kB; gzip 102.83 kB | Shared/deferred asset; do not add every asset to initial-page totals |
| jsPDF JS | 398.94 kB; gzip 129.62 kB | Export-related asset; on-demand behavior needs scenario waterfall verification |
| Local Vite production build | 5.10 seconds | Specific warm/local tool environment, not Cloudflare total build latency |
| Browser artifact audits | 187 files, no credential findings; pinned managed issuer | Security/build checks, not performance results |
| Prior context query projection | 147 rows; 539,828 → 495,357 JSON text bytes | Nov 1 bounded aggregate; not billed/wire bytes |
| Prior 305-archive complete-drain fixture | 62 → 1 context refresh, all 305 receipts retained | Context-only model 33,469,336 → 495,357 bytes (~98.52%); not total-job or production egress reduction |
| Prior technicals fixture | Three → one history repository read; exact outputs | Complete 100-observation case; not a measured production latency percentile |
| Provider transfer | Nov 1 230.27 MB; Nov 2 662.56 MB since billing reset | Earlier incident dashboard snapshots, not a current continuous time series or per-service attribution |

Local receipts/build logs are ignored under `.qa-artifacts/engineering-audit-20261102/`
and `.qa-artifacts/neon-bandwidth-20261101/`. No production load test, customer
export, paid AI call or repeated failed DB connection was made for this baseline.

## All 31 App-performance Toolkit categories

Status vocabulary: **Implemented**, **Needs Improvement**, **Not Applicable**,
**Unverified**. Implemented means a control was found, not that it is optimal or
proved effective on every live deployment. Each improvement below maps to an
audit finding with complexity/security/cost/verification details.

| # | Category | Status | Evidence / qualification | Next verification or action |
|---|---|---|---|---|
| 1 | Loading skeletons | Implemented | `app/src/components/ui/skeleton.tsx`, StockDetail/portfolio loading states | Check layout shift, error/empty transitions and screen-reader status; E13 |
| 2 | Image optimisation | Needs Improvement | `lib/imagePreparation.js` caps/resizes/converts images; `PostAttachments.tsx` lazy/async loads, R2 media caps | Profile responsive delivery, avatar over-fetch and decode memory; E13 |
| 3 | Duplicate API requests | Needs Improvement | QueryClient dedup, in-flight reads and covering financial windows exist | Profile polling/hidden views, especially 30/60-second hooks; E03/E10/E13 |
| 4 | Search debouncing | Implemented | TradersHub directory search waits 250 ms, sanitizes input and limits 30 | Verify stale result suppression/cancellation and shared-IP fairness; E07/E13 |
| 5 | Pagination | Needs Improvement | Data API bounds rows/offset; community feed fixed latest 50; some lists use explicit limits | Define cursor/full-history contracts rather than silently clipping legitimate older rows; E10 |
| 6 | CDN delivery | Implemented | Cloudflare Worker/Assets; observed public HTML 200 | Measure actual edge hits, asset cache and authenticated bypass; E03/E13 |
| 7 | Background jobs | Needs Improvement | Durable GitHub collector/checkpoints plus Render crons and bounded calculator queue | Job-age/restart guarantees for work dependent on sleeping API; E06/E10 |
| 8 | N+1 queries | Needs Improvement | Batched quotes/sparklines and one feed transaction; per-holding dividends/history remain | Measure DB trips and use justified batches, not huge Cartesian joins; E10 |
| 9 | Compression | Needs Improvement | Frontend HTML Brotli observed; Node server has no explicit compression middleware | Verify API encoding at the serving edge before adding CPU work; E10/E13 |
| 10 | Redis caching | Needs Improvement | Redis/Upstash adapters exist; live Render still memory | Verify provider limits/config, TTLs, rights/owner isolation and limiter outages; E03 |
| 11 | Unused dependencies | Unverified | Several workspaces, native/legacy/fixture import paths | Reachability and bundle evidence before removal; E14 |
| 12 | External API timeouts | Implemented | Paystack 15 s, assistant 25 s, Worker upstream 60 s; bounded numerical worker | Verify cancellation and total request deadline across layers; E05/E10 |
| 13 | AI streaming | Not Applicable | No approved streaming requirement; optional assistant uses bounded non-streaming responses, live activation unverified | Reassess only if AI activation/streaming is separately approved; E12 |
| 14 | Optimistic UI | Needs Improvement | Post-acknowledgement query-cache publishing and mutation-specific UI exist | Inventory rollback/pending semantics; never optimistically grant paid access or confirm a payment; E11/E13 |
| 15 | Lazy loading | Implemented | `App.tsx` lazy routes, Suspense, `lazyWithRetry` and image lazy loading | Check network waterfall and fallback accessibility; E13 |
| 16 | Parallel requests | Implemented | Engine bundle uses `Promise.all`; concurrency bounds and optional section deadlines | Verify pool wait/partial failure, avoid unbounded parallel holdings work; E10 |
| 17 | Database indexes | Needs Improvement | Owner/symbol/receipt keys; sampled folder user index present | No default-folder unique invariant; inspect measured plans before additional indexes; E04/E10 |
| 18 | Backend tracing | Needs Improvement | Worker request ID/Server-Timing, basic request logs | Correlate route templates and unobserved identity/data/transaction paths; E08 |
| 19 | Hosting regions | Unverified | Neon Ohio verified earlier; Blueprint declares Render Oregon | Confirm actual Render region/network latency; do not move services without measured benefit/approval; E02/E10 |
| 20 | Server/static rendering | Needs Improvement | Static Assets + client-rendered React SPA, no SSR entrypoint | Evaluate public marketing SEO/pre-render separately; private authenticated app does not automatically need SSR; E13 |
| 21 | Third-party scripts | Unverified | Turnstile/Paystack integration; analytics dependency does not prove script execution | Inspect real waterfall/privacy before removing essential auth/payment code; E12/E14 |
| 22 | Code splitting | Implemented | Route/shared production chunks measured above | Investigate measured initial JS/shared dependencies; do not globally preload lazy routes; E13 |
| 23 | List virtualisation | Needs Improvement | Lists bounded in places; no demonstrated general virtualised-list implementation | Only add after large-list DOM/scroll profiling and accessibility tests; E13 |
| 24 | Selective database columns | Needs Improvement | Narrow directory/projection reads coexist with generic `select('*')`/1,000-row default | Per-resource response contracts and before-fetch bounds; E10 |
| 25 | Connection pooling | Implemented | Node application max 10, identity max 3, Python max 2 per process; deadlines | Total deployment connection budget/pool wait; no blind pool-size increase or PgBouncer switch; E03/E10 |
| 26 | React render optimisation | Needs Improvement | useMemo/useCallback and route boundaries exist; query persistence serializes bounded state after cache events | Profile commits/serialization before memoising or rewriting contexts; E13 |
| 27 | Browser caching | Implemented | Public-query allowlist, timestamp retention, 100-query/~2M-character cap; owner-scoped private hints | Verify logout/account switch, expiry and rights-sensitive freshness; E03/E13 |
| 28 | Load balancing | Not Applicable | No measured need for multi-instance API; Free Render is single-service and edge CDN already exists | Reassess only after capacity evidence; shared state/locks before horizontal scaling; E03/E10 |
| 29 | Font optimisation | Implemented | Local Inter Latin 400–800 imports in `main.tsx`, no runtime Google Font fetch required | Measure used weights/paint; avoid deleting requested weights without visual tests; E13/E14 |
| 30 | Real-user monitoring | Needs Improvement | Local error boundary/basic server logs; no demonstrated redacted field-vitals collection | Privacy-safe low-volume route/device cohorts and alerting; E08/E13 |
| 31 | Slow-device testing | Unverified | No reproducible current real-device performance run supplied or executed | Approved test accounts/data plus real low-end phone and throttled lab scenarios; E13 |

## Reproducible scenario matrix for Phase 5

All are **Unverified as current performance scenarios**. Behavioral unit/parity
tests do not establish their timing. Use synthetic/disposable data for mutations;
do not create accounts, charges or customer changes without explicit authorization.

| Scenario | Variants | Capture |
|---|---|---|
| App launch/account | cold browser, warm browser, backend sleep; all plan display states | time to useful content, session/profile dependencies, retries/errors, query counts |
| Existing sign-in/sign-out | email/Google, expired/revoked/dependency failure | network stages, confirmed revocation, no false signed-out/paid state |
| Home/Markets | open/closed session, warm/cold public cache | quote dates, bytes/encoding/hits, long tasks and render latency |
| StockDetail/Fundamentals | first load/revisit; short/full financial windows; corrected data | waterfall, covering-window dedup, period coverage, stale/fresh dates |
| Portfolio/Engine | few/many holdings, unavailable price/history, concurrent requests | bounded trips/pool waits, alignment coverage, job/cancel latency, memory |
| TradersHub | 0/50 posts, images/polls, search, retry and first reaction | DOM/scroll cost, image decode, per-action requests and error recovery |
| Profile/onboarding photos | small/large camera image, unsupported format, slow upload | preprocessing memory/time, capped bytes, progress, retained state on failure |
| Checkout | synthetic signed fixtures/test-mode only after approval | duplicate intent, provider ambiguity, safe recovery; no real payment |
| Offline/reconnect/account switch | storage disabled/full, stale data, new account | private cache isolation, bounded retries and no invented freshness |
| Export/chart interaction | PDF/chart package first use, reduced motion/touch | lazy chunk timing, input delay, frame/memory behavior and accessibility |

Proposed evaluation targets, **not measured achievements**: p75 LCP ≤2.5 s,
INP ≤200 ms and CLS ≤0.1 where applicable, following
[Web Vitals guidance](https://web.dev/articles/vitals). Set separate budget/SLOs
for cold backend wake-up, warm APIs and expensive asynchronous jobs. Do not hide
cold-start failures by excluding them from the user-visible launch measure.

Use identical data and network/device profiles for before/after comparisons.
Record device/OS/browser/build SHA, effective server SHA, data/cache age, region,
network shaping, CPU throttling and run count. Report medians/percentiles only
with enough samples and distinguish lab distributions from field p75 cohorts.

## Measurement privacy and infrastructure limits

Never collect session/callback/reset tokens, raw URLs containing credentials,
private portfolios, prompts, payment references/secrets, source bodies or email
addresses in RUM/trace labels. Prefer route templates, safe request IDs, timings,
error classes, sample/truncation counts and aggregate sizes. Keep telemetry bounded
and low-frequency; do not store every request's measurement back in Neon.

Do not enable paid APM, analytics, always-on workers, CDN image services or AI
evaluation as part of this baseline. Start with existing logs/CI and local browser
profiling, then request specific cost/privacy approval if justified.
