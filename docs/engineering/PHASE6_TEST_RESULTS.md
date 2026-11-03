# Phase 6 test results

This report distinguishes successful checks from failures and pending work. Detailed logs remain local under .qa-artifacts/phase6-*; they are not committed because they may include local machine metadata.

| Check | Observed result |
|---|---|
| Frontend build, TypeScript, Worker tests | Passed; 43 Worker tests, asset and managed issuer checks passed |
| Frontend unit tests | 198 passed |
| Layout guard | 4 passed; case-sensitive entrypoints and safe shared paths |
| Moved source receipt | 483 files plus one document move; collector Docker allowlist correction separately recorded |
| Windows Go full tests | Passed |
| Windows collector | 205 passed, 6 disposable PostgreSQL tests explicitly skipped in base run |
| Disposable database recovery | All 6 collector tests and Go atomic quote/outbox migration test passed separately |
| Windows financial Engine | 166 passed with pinned numerical virtual environment |
| Linux financial Engine | 166 passed in isolated container |
| Candidate API Docker build | Passed locally; no deployment |
| Clean npm installs | Root, backend and scraper passed |

Initial failures are retained as evidence: system Python lacked NumPy; backend default Linux Python executable was unavailable on Windows; default scraper Poppler was unavailable in Windows PATH; Python PDF fallback then exceeded the existing 5-second sequential fixture deadline under concurrent load. Do not change runtime deadlines or weaken test assertions to hide environment failures. Collector image build initially failed because its ignore file omitted existing COPY dependencies; allowlist corrected locally and rebuild required.

Follow-up and final receipts below supersede the initial pending statuses. Production activation still requires approval. No new performance improvement is inferred from filesystem changes. Existing Phase 5 performance and accessibility limitations remain.

## Completed follow-up checks — 2026-11-03

- Backend build and full suite: 646 passed, 18 existing explicit integration skips. Loopback test execution required the authorized local process boundary and ENGINE_PYTHON_BIN pointing to the isolated pinned numerical environment. No backend implementation changes.
- Scraper build: passed. Full Python-backed suite: 95 passed and one sequential PDF deadline failure under concurrent host load; the unchanged PDF test then passed both cases in isolation. Together all 96 assertions are covered, but the single full-suite run was not completely green. Default Windows Poppler was not installed; Python extraction was explicitly selected in the test process only. Production extraction settings were not changed.
- Linux clean frontend install: 496 packages; typecheck, production build, all 43 Worker tests, all 198 frontend tests, 195-asset scan (zero findings) and pinned managed issuer check passed. Node image digest c86ecead9e55a5210ac1727de38a4ca840bf03dcaf34dc9749addbf383b1920c. Archive excludes environment files; release revision honestly reports unknown. Its public test configuration produces main JS 475.07 kB / gzip 151.71 kB. Windows production-config build remains 474.90 kB / gzip 151.67 kB, equal to Phase 5; no new performance improvement claim.
- Both candidate Docker images built successfully after the collector ignore correction. No push/deployment or live browser collection.
- Go module verification, vet and build passed. All 17 Linux test packages passed with numerical-worker integration; four explicit external fixture skips: Redis roundtrip, PostgreSQL atomic outbox (tested separately), owned-news deadline and owned prepared-object read. No race-detector run, full Chromium resource/load test or native production parity certification is claimed.
- Linux collector: 211 discovered, 204 passed, six PostgreSQL skips covered separately, one Windows-only process test skipped (passed on Windows). Linux Engine: all 166 passed.
- Shared-path differential tools: 6 tab discovery, 52 publisher-parser and 38 financial-report comparisons passed. Full numerical parity run final receipt is recorded below when completed; initial full runs interrupted at child-process deadlines on different operations. Isolated research_synthesis passed all 36 cases. No numerical mismatch was reported before those process failures. Original five-second deadlines and tolerance remain intact; hidden child windows and redacted process-exit diagnostics improve Windows fixture execution.
- Layout: all 4 tests passed. Identity receipt: all 483 moved files verified, with one explicitly recorded Docker ignore fix, plus one completed document move. YAML: all 10 tracked files parsed; collector/reconciliation and Render semantics match the base after path substitution. SQL and production backend source changes: zero. All retained lock versions/resolution/integrity unchanged; only analytics and concat-map removed.
- Secret scan: 2335 tracked text files checked, zero findings. Source reachability inventory: 269 backend and 58 scraper runtime modules, no additional unreferenced runtime/declaration candidates.

Initial Linux harness failures were environmental and corrected: incomplete source archive consumed before completion, unwritable npm cache, noexec temporary build/test directories, and a required workflow source missing from a read-only test mount. A newly enumerated existing provider-only objectstore skip is now explicit in the Linux runner; unexpected skips still fail. No test assertions, numerical tolerances or release vulnerability thresholds were relaxed.

The clean Linux archive precedes final report-only edits and Windows fixture diagnostics. The renamed runtime source is unchanged; final local layout/identity/secret checks cover the staged revision. No physical mobile-device or new end-to-end accessibility certification was performed; existing frontend accessibility assertions pass. Phase 5 read-only production journeys are described in PHASE6_IMPLEMENTATION.md.

## Final numerical parity receipt

The complete native/reference differential suite passed all **497 cases across 45 operations** after the Windows tooling adjustment, with the original five-second child deadlines and relative numeric tolerance intact. This verifies the moved worker/package paths for the existing fixture coverage, not exhaustive native production cutover readiness.

## Final full scraper receipt

The final full scraper run passed **all 96 tests in all 33 files** with the explicit local Python extraction fixture and the existing assertions/deadlines (59.13 seconds). This supersedes the earlier load-sensitive Windows fixture failures. Final required local suites have no outstanding failing assertions; configured external/integration skips and release limitations remain explicit above.
