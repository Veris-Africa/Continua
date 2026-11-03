# Phase 5 performance results

Candidate only; not pushed or deployed. Compare against Phase 4 `7dfe140`. These are single comparable cold Home lab runs, empty synthetic account, fixed 2,000 ms identity delay, local uncompressed production assets. The mobile audits warned about this laptop's CPU; the final desktop audit had no warning. They do not establish full-data readiness, production percentiles or field INP.

| Metric | Mobile before | Mobile after | Desktop before | Desktop after |
|---|---:|---:|---:|---:|
| FCP, ms | 1668.88 | 1666.95 | 376.33 | 373.96 |
| LCP, ms | 11423.31 | 8813.25 | 2305.50 | 1861.80 |
| Lab TBT, ms | 1193 | 946 | 85 | 81 |
| CLS | 0 | 0 | 0.00001975 | 0.00001472 |
| Speed Index, ms | 6473.41 | 5954.81 | 2431.85 | 1932.75 |
| Transferred bytes | 1658414 | 1169006 | 1658414 | 1169006 |

Mobile LCP improved 22.8%, desktop LCP 19.2%, mobile blocking time 20.7%, total fixture transfer 29.5%. FCP is essentially unchanged. The empty-account initial waterfall no longer includes CartesianChart or the animation proxy chunk. LCP may reflect shell geometry rather than account-data readiness; do not equate it with a completed login. Mobile LCP still misses the good threshold. Repeat samples and populated/real-device measurements are required before an acceptance claim.

Main JS increased from 472.52 to 474.90 kB (gzip 150.67 to approximately 151.67 kB). The measured benefit is reduced initial route work, not a smaller main chunk. The 351.44 kB chart chunk remains available for covered charts; the 398.94 kB PDF library remains deferred. Home plot and rolling-digit boundaries add small deferred modules. Do not sum all emitted assets as initial load.

## Requests, caching and correctness

An executable synthetic transport/cache test proves concurrent following consumers share one minimal ID read, a fresh warm consumer adds none, and another account gets its own request. Full profile lists no longer load merely to decide Follow. Count-only reads preserve unknown versus confirmed zero. These are bounded request reductions, not a Neon billed-egress measurement. Published research hydration and original timestamps/expiry remain; no shared private caching was introduced.

Browser UI verified a synthetic peer profile, confirmed Following state, unfollow acknowledgement/count zero, follow acknowledgement/count one and propagation to a second open tab. Synthetic writes affected only in-memory loopback fixtures. Screenshots are ignored `.qa-artifacts/phase5-mobile-two-tab-follow.png`. This does not prove all account-switch or privacy races.

## Checks

- Frontend: 198 tests passed (194 existing plus four recovery/follow transport/cache tests).
- Production build: typecheck, 43 Worker tests, Vite build, 195-file artifact scan with no credential findings; managed issuer audit passed.
- Separate explicit typecheck and targeted lint for new typed helpers/skeleton and follow hook passed. Existing JSX files have no matching ESLint configuration; Vite compiles them. No lint rules were weakened.
- Dependency floor passed; no application dependencies added or upgraded. Lighthouse is isolated under ignored QA tooling.
- Existing chart normalization, coverage, portfolio-history, expiry, private-snapshot, identity race and financial presentation tests pass. Financial algorithms and backend code were untouched in Phase 5; Phase 4 parity receipts are retained, not rerun and mislabeled as Phase 5 numerical changes.
- Phase 4 live read-only negatives: billing renewal 401/no-store; internal observability 404/no-store at the Worker; managed JWKS 200/one key. These are point-in-time checks.

## Original 31-category checklist disposition

| # | Category | Phase 5 disposition |
|---|---|---|
| 1 | Skeletons | Added public/session/route geometry; status and motion-safe classes |
| 2 | Images | Existing preparation, async/lazy media and originals retained; responsive delivery remains to profile |
| 3 | Duplicate APIs | Shared following IDs, demand-loaded profile tabs, fresh chart reuse |
| 4 | Search debounce | Existing 250 ms behavior retained |
| 5 | Pagination | Existing limits retained; complete cursor contract needs backend work |
| 6 | CDN | Existing Cloudflare delivery retained; no production cache-rule changes |
| 7 | Background jobs | No changes; existing Phase 4 job-age evidence applies |
| 8 | N+1 | Removed automatic full follow lists; existing reaction/feed coupling and profile enrichment/backend aggregation remain |
| 9 | Compression | No change; lab intentionally uncompressed, production assets use edge compression |
| 10 | Redis | No activation or provider change |
| 11 | Dependencies | No production dependency changes; measured chart/animation deferral |
| 12 | Timeouts | Existing bounds retained; timed-out restore not multiplied by retries |
| 13 | AI streaming | Not applicable; no activation |
| 14 | Mutation UI | Follow pending/failure/acknowledged state corrected |
| 15 | Lazy loading | Home plot, rolling digits and image export split; existing PDF deferral retained |
| 16 | Parallel reads | Counts parallel, follower waterfall removed; no unbounded new fanout |
| 17 | Indexes | No production SQL; existing unresolved SQL findings remain |
| 18 | Tracing | Phase 4 deployed; no telemetry activation |
| 19 | Regions | No move or paid service; latency attribution remains limited |
| 20 | SSR/static | Existing SPA retained; no unmeasured rewrite |
| 21 | Third-party scripts | Auth/payment behavior preserved; lab CSP blocks external connections |
| 22 | Splitting | Initial waterfall excludes two large unnecessary chunks in empty account |
| 23 | Virtualization | Not added without long-list profiling evidence |
| 24 | Columns | ID-only follow projection and HEAD counts |
| 25 | Pooling | No backend changes |
| 26 | React renders | Stable follow lookup/key and exact-value lazy animation fallback; no React commit-duration claim |
| 27 | Browser cache | Existing owner and published-data boundaries retained; new graph data memory-only |
| 28 | Load balancing | Not applicable; no new service |
| 29 | Fonts | Existing local Inter retained; no remote font dependency or unverified weight removal |
| 30 | RUM | Disabled; field INP/p75 unavailable |
| 31 | Slow devices | Throttled mobile Lighthouse; actual mid-range handset and repeated warm tests outstanding |

Remaining acceptance limits: no calibrated navigation/reopen timing, complete populated-market baseline, actual handset, React commit profile, field INP, general account-switch browser race or full auth-outage browser matrix. A synthetic latency setting is not a production cold-start measurement. Stale October history and ingestion recovery are backend/data backlog, not a frontend curve-generation task. See deployment plan for remaining gates; do not deploy on these partial lab results alone.

## Additional browser checks

A populated synthetic fixture rendered the lazy Home chart with covered observations and a StockDetail month chart, retained the explicit intraday-unavailable state, and rendered two annual financial periods through a synthetic Premium Plus profile. Unsupported fixture source/disclosure endpoints still display explicit errors rather than invented evidence. This is UI fixture behavior, not production financial evidence.

A separate 50 ms/HTTP 503 synthetic identity outage exhausted bounded retries, showed Reconnect your account without claiming logout or redirecting to sign-in, and returned to Home after the service recovered and one Retry action. Two-tab follow propagation was checked at the browser's actual 1277 x 720 viewport. A requested responsive override did not change that measured viewport, so those screenshots are desktop evidence despite their legacy mobile-prefixed filenames. Mobile lab measurements above use verified Lighthouse 412 x 823 emulation, 4x CPU and 150 ms RTT/1638.4 Kbps preset; they are not real-handset evidence.

Warm financial-cache check: the populated fixture recorded five cumulative financial-history requests before reopening StockDetail and five afterward (zero additional requests). Loaded annual fields were visible after the existing identity/access gates; this is request reuse evidence, not a calibrated data-ready duration. Raw counter receipt: `.qa-artifacts/phase5-warm-financial-result.json`. Final Lighthouse receipts use `.qa-artifacts/phase5-final-{mobile,desktop}.json`; earlier after-candidate receipts are retained separately to expose run variance. Profile-only error/visibility copy added during final review does not participate in this empty Home waterfall.
