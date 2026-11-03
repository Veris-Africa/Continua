# Phase 4 validation receipt — 3 November 2026

Local branch codex/phase4-observability-recovery; initial implementation b7aa83f and local merge4e190c9 include current main history. Final follow-up commit records the Engine queue context fence, browser-hook integration tests and supported development-tool/lockfile corrections. No Phase4 push/deployment occurred.

| Executed check | Final result / private receipt |
| --- | --- |
| Clean root/backend npm ci | Passed; both report zero vulnerabilities; no production dependency version change in frontend tooling correction |
| Full backend | **646 passed,18 existing skips**,150 files passed/3 skipped; phase4-final-backend.log |
| Backend typecheck/build | Passed; phase4-final-types.log / phase4-final-backend-build.log |
| Frontend | **194 passed**; phase4-verified-app.log |
| Worker | **43 passed**, included in production build |
| Worker+deployment+health tools | **51 passed**; phase4-tool-tests-final.log |
| Production build / browser secrets / managed issuer | Passed;189 artifacts,zero findings,pinned issuer; phase4-verified-build.log |
| Changed frontend/config lint | Passed with supported compiler/parser; phase4-targeted-lint-final.log; no claim of a full legacy lint cleanup |
| Dependency floor and real glob API | Passed for every installed locked minimatch; deepmerge absent; no advisory dismissal |
| Real PostgreSQL | **311 Phase2 +54 Phase3 +8 restore checks passed**; phase4-final-sql.log |
| Canonical financial fixture | **99 checks passed**; phase4-financial-parity.log |
| Native company-bundle parity | **6 passed**,no native cutover; phase4-bundle-parity.log |
| Monitoring microbenchmark |20,000 records44.36ms;2.22us/record; incremental async dependency~12.08us; heap delta120,704bytes; zero SQL/external telemetry calls |

Final restore took10.73s and includes financial orders plus identity/ownership/policy/ACL/payment-work/job/history checks. It uses synthetic PostgreSQL17.11, existing cluster roles and a synthetic R2 manifest. Production is PostgreSQL18; complete current-schema/provider/cross-cluster/global-role/managed-Auth/R2 recovery and achieved RPO/RTO remain unproved.

Fault coverage includes dependency outages, malformed/private browser inputs, unavailable metrics, expected credential denials, async queue ownership, callback/promise pool contracts, alert notification failure/cooldown/recovery, wrong deployment SHA, absent GitHub source-equivalence proof, migration activation without receipt, signed webhook persistence/duplicate/crash recovery and post-backup source writes. No destructive production test, real payment or user-data copy was run.

Initial sandbox loopback denial, missing Python path, a cache wrapper promise-turn regression, database-name comparison normalization and a stopped Docker daemon were corrected and rerun. No assertions/timeouts/security gates were weakened. Source matrix, staged secret scan and whitespace validation accompany the final commit; ignored QA receipts are not deployed or committed.
