# Phase 6 dependency audit

Root, app, backend, scraper, Go module and both Python lock/requirements manifests reviewed. Removal is evidence-based; absent static imports alone are insufficient for operational dependencies.

Removed root @vercel/analytics: only manifest/lock references, no runtime/CLI/workflow consumer. Lock update removed that package and unreachable concat-map only; added packages: zero; retained package version changes: zero. Root, backend and scraper clean npm ci completed successfully. No Go/Python version changes, major upgrades, strictness changes or vulnerability threshold reductions.

Root runtime packages serving separate operator/compatibility responsibilities are retained pending specific ownership evidence. Go native libraries, Python collector dependencies, numerical NumPy/SciPy and all testing/reference packages remain. Independent financial oracles are intentionally retained.

Clean install warnings: root ESLint 9.39.5 EOL/deprecation; backend transitive React Email markdown/tailwind/code-block deprecations; scraper whatwg-encoding 3.1.1 deprecation. These require compatibility-reviewed follow-up, not uncontrolled major upgrades during a path refactor.

Current advisory results and pip/module checks are recorded in PHASE6_SECURITY_RESULTS.md. A clean audit is time-specific, not an absence-of-future-risk guarantee.

## Audit results

All three npm audits: zero vulnerabilities. Collector pip-audit: no known vulnerabilities; both isolated Python environments: pip check passed. Go module verify passed. Go govulncheck: zero called/imported-package vulnerabilities, one pre-existing uncalled module advisory GO-2026-5932 (openpgp in x/crypto v0.58.0); retained and disclosed pending separately validated patch review. No claim of an entirely advisory-free Go dependency graph. Runtime source audit found no additional orphan backend/scraper modules to justify dependency removal.
