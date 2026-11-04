# Phase 7 addendum: validation and performance

Date: 4 November 2026. Baseline: main commit `3a78c6a00189aa4d8d33bcc3da8a3ce1774eb011`. Candidate: local `codex/phase7-chart-visual-addendum`. No addendum push, deployment, production mutation or ingestion activation.

## Functional validation

- Frontend: 216 tests passed, zero skipped or failed. New cases cover Nairobi midnight, date-only versus timestamp parsing, each supported range, weekends/holiday gaps, sparse/old records, duplicate conflicts, null values, historical state distinctions and SVG safety/size.
- Backend: 653 tests passed, 18 existing integration skips across 151 passing files and three skipped files. The successful run used the existing isolated numerical Python environment; the initial run without that environment failed seven Engine tests. No production environment was changed.
- Seven portfolio route tests passed, including empty versus HTTP failure and Nairobi midnight.
- Disposable PostgreSQL: owner/RLS, revoked session, cross-user isolation, correction ordering, no synthetic dates, numerical value/cost parity and role cleanup passed. Fixture removed; no production write.
- Production build passed: Worker tests (43), TypeScript, Vite, browser secret audit (216 artifacts, zero findings) and managed Auth issuer audit. Backend build passed. Repository layout tests (four), dependency floor and tracked-file secret audit passed.

Actual sandbox browser checks used production bundles and synthetic offline accounts. Home/Portfolio series and one-observation states render; Portfolio timeframe controls retain the Portfolio route. Stock controls 1D, 1W, 1M, 3M, 1Y and ALL were exercised; 1D displayed one dated point with no implied trend. These fixtures are not evidence of genuine NSE holiday trading or recovered production prices. Domain tests use missing-session/weekend/holiday examples without manufacturing observations.

The Home error/recovery fixture reproduced the swallowed Retry click before the pointer-capture fix. After the fix, Retry made the next request and restored eight recorded fixture observations. The same guarded handler is applied to Portfolio; dedicated Portfolio click recovery was not separately repeated in the browser. Owner isolation was verified by PostgreSQL, not by opening two real customer identities.

## Visual evidence

Actual local screenshots, with synthetic financial values only. DOM viewports were 372 × 813 and 1437 × 1000; browser image captures are 372 × 805 and 1437 × 998 respectively. The error capture is a shorter 372 × 209 view. JPEG capture bytes are stored with .jpg extensions:

| View | Before | Candidate |
|---|---|---|
| Small phone, actual 372 × 813 | [Home](screenshots/phase7-addendum-before-mobile.jpg) | [Home](screenshots/phase7-addendum-after-mobile.jpg) |
| Desktop, actual 1437 × 1000 | [Home](screenshots/phase7-addendum-before-desktop.jpg) | [Home](screenshots/phase7-addendum-after-desktop.jpg) |

Additional captures: [final loading geometry](screenshots/phase7-addendum-loading.jpg), [service error](screenshots/phase7-addendum-error-mobile.jpg), [retry recovery](screenshots/phase7-addendum-retry-recovered.jpg), [one observation](screenshots/phase7-addendum-point-portfolio.jpg), [dark Home](screenshots/phase7-addendum-home-dark.jpg), [dark Learn artwork](screenshots/phase7-addendum-learn-dark.jpg), [public resources artwork](screenshots/phase7-addendum-public-art.jpg).

No visible generic skeleton title remains in the reviewed state. Navigation, financial values and chart priority are retained; soft grouping is selective. Light and dark Home and desktop Learn/public artwork were inspected. The Learn SVG was confirmed decoded from its local asset. Empty-state art placements are guarded in code; not every empty state was separately exercised in this final browser pass. AMOLED, OS reduced-motion, full keyboard/screen-reader behavior and every small-device safe-area combination are not certified by these captures. Reduced-motion CSS and image dimensions are present, and no animated illustration runtime was added.

## Measurement method

Serial sandbox runs, one active QA app tab, same synthetic populated account, eight portfolio snapshots, fixed 2,000 ms identity fixture delay. Cold mobile used fresh loopback origins 5202/5203; desktop reused the resulting asset caches. Actual viewport dimensions above differ slightly from requested 375/1440 widths. Loopback fixture traffic never forwards to production. The timing script is QA-only and logs no customer values, tokens or private IDs.

An earlier probe recognized only the old coverage wording and kept scanning the candidate page. Its timings were rejected. The corrected probe recognizes both versions, disconnects its content observer when the plot appears and records actual SVG plot readiness. Below are single paired observations, not medians, throttled mobile CPU results or field p75 metrics.

| Metric | Mobile before | Mobile candidate | Desktop before | Desktop candidate |
|---|---:|---:|---:|---:|
| First contentful paint, ms | 384 | 260 | 256 | 252 |
| Last observed LCP, ms | 2452 | 2476 | 2456 | 2568 |
| Useful Home content marker, ms | 2393.9 | 2456.8 | 2486.9 | 2605.5 |
| Plot path present, ms | 3119.7 | 3164.5 | 3707.0 | 4091.5 |
| Observed non-input layout shift sum | 0.01920 | 0.01934 | 0.00286 | 0.00278 |
| Long-task duration in initial 5 seconds, ms | 557 | 552 | 356 | 459 |
| Initial asset request count | 90 | 90 | 86 | 86 |
| Initial transfer bytes | 1,508,910 | 1,519,151 | 0 (cached) | 0 (cached) |

Layout-shift sums are bounded observation sums, not a full field CLS session-window calculation. Mobile plot readiness increased 44.8 ms; desktop increased 384.5 ms with 103 ms more observed long-task work. This does **not** establish zero performance regression. Repeat controlled CPU-throttled runs and profile the desktop plot before treating performance acceptance as complete. No artificial auth delay improvement is claimed. Home requested no illustration assets. There was no extra initial request count; mobile transfer rose 10,241 bytes (approximately 0.68%).

Desktop encoded asset bodies: JS 1,039,908 → 1,044,617 bytes, CSS 184,395 → 189,927, fonts unchanged at 121,144, illustrations zero. Cached transfer is not compressed network cost. Baseline Home-to-Portfolio heading acknowledgment measured 75.4 ms; candidate acknowledgment was not captured within the observer lifetime. No paired route-navigation improvement is claimed, nor is a route heading a complete-data readiness measurement.

## Build and artwork budget

Paired gzip measurements use the same Node compression settings:

| Artifact | Before raw / gzip bytes | Candidate raw / gzip bytes |
|---|---:|---:|
| Entry JS | 29,907 / 11,527 | 29,959 / 11,543 |
| Main JS | 254,389 / 80,186 | 254,449 / 80,218 |
| Main CSS | 184,395 / 28,743 | 189,927 / 29,924 |

Three original SVG scenes total 4,921 raw bytes / 2,294 gzip bytes, individually 1,553–1,734 bytes. They are lazy, static and dimensioned, with no external resources or script. Tests enforce the family budget. No package or lockfile changes; no animation library. Decorative failure cannot block the adjacent text/actions. Actual image decoding CPU cost, React commit work, mobile CPU percentage and field INP were not measured. No claim of certification is made for those metrics.

## Remaining production blockers

Production snapshots contain zero rows; no historical portfolio values were created. Sampled SCOM/KCB permitted history ends 23 October, with zero observations in the newest seven calendar dates. The original screenshot's specific upstream HTTP failure is not conclusively attributed. Safe operation/request correlation logging is added, and the independently reproduced Retry defect is fixed. See the diagnosis and portfolio reports for exact counts and contracts.

Release requires review of this branch and normal CI/build checks. Activating a snapshot writer, schema changes, backfill or ingestion schedules requires separate explicit approval and provenance/rights validation. This work does not authorize those operations. Existing authentication and source-security checks remain intact.
