# Phase 6 implementation

Local branch: codex/phase6-repository-structure, based on released main 9ab1945a7165a866200717a51f6d3fb34d3cf7f1. Phase 6 has not been pushed or deployed.

## Phase 5 release verified 2026-11-03

All GitHub checks passed. Cloudflare serves 9ab1945a7165a866200717a51f6d3fb34d3cf7f1, Worker dd40a3bb-70d4-41a5-b237-b6f63c10adae. Render serves 7dfe140d009ac78db072dc7b2dc4a30c7805e12b. Release verification passed at 15:20:41.772Z using --allow-equivalent-backend-tree: both commits have identical backend tree fd54fdffd46f7dab10c23433d6db667b35d3bf80. No restart or environment update was required. Existing additive schema is existing-additive-20261102.

An authenticated, read-only browser journey covered Home, Portfolio, Markets, SCOM Stock Detail, TradersHub, Engine and upgrade interfaces. No checkout or customer mutation was performed. Captured frontend error logs were empty for this bounded journey; fleet-wide error rates were not measured. SCOM still displayed dated 2026-10-23 evidence. Historical completeness is not established by a rename. Phase 5 synthetic mobile LCP remains 8.81 seconds; no field INP or physical-device improvement is claimed.

## Implemented locally

Inventory all tracked source roots and major subdirectories in ../architecture/PHASE6_REPOSITORY_INVENTORY.json. Three responsibility-based root moves retain all package/module identities. A complete 483-file map and one document move are in ../architecture/PHASE6_PATH_MAPPING.json. Updated 57 existing path consumers, candidate Docker contexts, workflow paths, operator scripts and documentation. Added a case-sensitive component manifest, safe shared tooling path resolver, source-identity receipt and regression guard. Three differential tools now share path resolution; financial implementations remain independent oracles.

Removed only the unreachable blank starter page, unused starter CSS and unused root analytics dependency. Corrected placeholder architecture documentation, provider comments, service ownership READMEs and migration inventory. Production app/backend/scraper roots, SQL, APIs, authentication, payment rules, schedules and numerical semantics are preserved.

Collector Docker ignore required a separately recorded correction: include the two existing COPY dependency roots. This is an explicit reviewed fix in the mapping rather than a falsely reported path-only change.

See PHASE6_TEST_RESULTS.md for actual verification and limitations, PHASE6_DEPLOYMENT_PLAN.md for activation boundaries. No production SQL, environment changes, account operations, payments, paid AI, schedule activation or candidate cutover occurred.


## Tooling improvements beyond path changes

The disposable PostgreSQL PowerShell harness now accepts Docker/Go/Python application paths instead of a developer-specific absolute Docker path or an assumed ignored virtualenv. Its dedicated loopback/label/cleanup safeguards remain and all seven database fixtures passed. Linux Go fixture inventory explicitly classifies the existing owned-object provider test and reports exit/skip diagnostics. Windows numerical parity hides child console windows and reports only operation/status/signal/process-code on failure; inputs and provider credentials are not logged. Numerical deadlines and tolerances are unchanged.


## Contract and duplication review

| Area | Decision |
|---|---|
| Frontend auth SDK, Worker broker, server session verifier | Retain separate trust boundaries; do not merge browser and server credentials or session authority. |
| Node API and Go candidate repositories/routes | Retain as production/reference versus incomplete candidate; shared-looking handlers do not establish equivalent policy. |
| Python numerical package and shipped backend calculators | Retain independent parity oracles; 497 differential cases and 166 Engine unit tests pass. |
| Collector and Node scraper discovery/extraction | Retain compatibility and finite-run boundaries; 96 source/report/discovery differential cases pass. |
| Frontend cache/queries and server/edge caches | Retain account/source/entitlement scope and distinct expiry contracts. No generic cache consolidation. |
| Financial/portfolio/chart formatters | Preserve null, unavailable, as-of date and period/precision distinctions; no cosmetic deduplication. |
| Repository tooling path arithmetic | Consolidated only three equivalent differential-tool root resolvers into a validated shared component map. |
| Large modules and historical compatibility shims | Document ownership and retain unless a separately scoped behavior/coverage review proves safe decomposition or removal. |

No new network waterfall, global runtime state, service split, financial semantics or public interface was introduced. The bounded inventory and conservative reachability checks are evidence for these changes, not a claim that all technical debt or dynamic-code uncertainty has been eliminated.
