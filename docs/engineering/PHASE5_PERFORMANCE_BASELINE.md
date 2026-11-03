# Phase 5 measured baseline

Baseline source: released Phase 4 `7dfe140`. Official Lighthouse 13.6.0, installed only under ignored `.qa-artifacts/performance-tools`. Chrome, temporary isolated profile, local uncompressed production assets, empty synthetic account and 2,000 ms synthetic identity delay. Loopback server has no provider credentials, forwarding or production connection. Default-mode non-GET requests are denied. Optional populated mode permits only tightly scoped in-memory synthetic follow writes, rewrites the public market API origin in served JavaScript responses to loopback, and never changes production assets. Enable with LAB_POPULATED=true on a separate LAB_PORT; LAB_PLAN can select a synthetic paid UI state. No real account is created. The unsupported market routes deliberately return 404 rather than fabricated prices.

| Cold Home measurement | Mobile preset | Desktop preset |
|---|---:|---:|
| FCP, ms | 1668.88 | 376.33 |
| LCP, ms | 11423.31 | 2305.50 |
| Lab TBT, ms | 1193 | 85 |
| CLS | 0 | 0.00001975 |
| Speed Index, ms | 6473.41 | 2431.85 |
| Transferred bytes | 1658414 | 1658414 |

Both presets are lab conditions, not an actual handset or field sample. Lighthouse warned that this machine's CPU was slower than expected. No assertion of field INP, production LCP percentile, Neon billed-byte savings or universal sub-second readiness is made. A spinner's FCP is not useful account data. The 12-14 second production opening time remains an owner report, not this measurement.

Baseline network evidence: Home loaded `CartesianChart` (351,748 transfer bytes in this uncompressed fixture) even without covered history, and animation's `proxy` chunk (131,572 bytes). Main asset 472.52 kB / gzip 150.67 kB. The original local production-build receipt is `.qa-artifacts/phase4-release-build.log`. Raw Lighthouse baseline receipts are ignored `.qa-artifacts/phase5-baseline-{mobile,desktop}.json`.

## Repeat procedure

1. Check out the named source and run `npm run build` with existing pinned managed-auth build configuration. Do not copy production credentials into the lab.
2. Run `node infra/performance/lab-server.mjs` from repository root. It binds only 127.0.0.1:5185. `LAB_AUTH_DELAY_MS` and `LAB_AUTH_OUTAGE=true` provide controlled slow/error scenarios; use a separate loopback port with `LAB_PORT` if needed.
3. Set `CHROME_PATH` to installed official Chrome. Run the QA-installed Lighthouse CLI against `http://127.0.0.1:5185/`, `--only-categories=performance --output=json --chrome-flags="--headless --disable-extensions"`; use `--preset=desktop` for the desktop case. Save each result separately, never run simultaneous audits on this laptop.
4. Keep identity delay, bundle mode, CPU/network preset and fixture contents fixed. Report run warnings. Multiple comparable samples are required before a production performance acceptance decision.
5. Use browser UI for route/reopen/skeleton/accessibility inspection. The server's `/__lab/requests` lists synthetic request paths and timestamps, not billed bytes.

## Scenario coverage

Cold signed-in empty Home has comparable lab baselines. Reopen and Home-to-TradersHub were inspected through browser UI but have no calibrated before/after timing. Portfolio, populated feed/profile, StockDetail fundamentals/chart, two-account browser race, actual mid-range phone and field p75/INP need realistic isolated fixtures or controlled approved observation. Unit tests cover account retry/expiry/cache boundaries and existing financial transforms; they do not replace those browser scenarios.
