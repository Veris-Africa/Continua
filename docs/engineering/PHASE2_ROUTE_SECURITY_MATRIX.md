# Phase 2 route security matrix

Generated literal-route inventory with reviewed mount boundaries. Run `node infra/security/route-security-matrix.mjs` after route changes; `--check` detects drift. This is an inventory, not proof of authorization. Tests exercise representative routes and shared middleware, not every handler.

All paths below have /api/v1 prefix. Main market router: project API key, pre-auth IP admission, workload/rate limits. /engine and /billing additionally verify the managed session and freshly read effective_subscription_plan before owner rate-key selection. Handlers can impose stricter plan requirements. No client role, price, user ID or subscription header determines entitlement.

| Method | Route | Effective identity / entitlement boundary | Source |
| --- | --- | --- | --- |
| GET | `/announcements/:symbol` | Public project API key; public market/research data | [announcements.routes.js:7](../../backend/src/api/routes/announcements.routes.js#L7) |
| POST | `/backtest` | Verified owner; fresh Premium or Plus | [backtest.routes.js:9](../../backend/src/api/routes/backtest.routes.js#L9) |
| POST | `/billing/checkout` | Verified owner; any plan | [billing.routes.js:46](../../backend/src/api/routes/billing.routes.js#L46) |
| POST | `/billing/native-checkout` | Verified owner; any plan | [billing.routes.js:25](../../backend/src/api/routes/billing.routes.js#L25) |
| GET | `/billing/native-verify/:reference` | Verified owner; any plan | [billing.routes.js:32](../../backend/src/api/routes/billing.routes.js#L32) |
| DELETE | `/billing/renewal` | Verified owner; any plan | [billing.routes.js:20](../../backend/src/api/routes/billing.routes.js#L20) |
| GET | `/billing/renewal` | Verified owner; any plan | [billing.routes.js:16](../../backend/src/api/routes/billing.routes.js#L16) |
| GET | `/billing/status` | Mounted verified owner; any plan (see declared handler) | [billing.routes.js:15](../../backend/src/api/routes/billing.routes.js#L15) |
| GET | `/billing/verify/:reference` | Verified owner; any plan | [billing.routes.js:53](../../backend/src/api/routes/billing.routes.js#L53) |
| GET | `/companies/:symbol` | Public project API key; public market/research data | [companies.routes.js:7](../../backend/src/api/routes/companies.routes.js#L7) |
| GET | `/corporate-actions/:symbol` | Public project API key; public market/research data | [corporateActions.routes.js:7](../../backend/src/api/routes/corporateActions.routes.js#L7) |
| GET | `/diagnostics/query-volume` | Public project API key; public market/research data | [admin.routes.js:11](../../backend/src/api/routes/admin.routes.js#L11) |
| GET | `/dividends/:symbol` | Public project API key; public market/research data | [corporateActions.routes.js:14](../../backend/src/api/routes/corporateActions.routes.js#L14) |
| GET | `/dividends/upcoming` | Public project API key; public market/research data | [corporateActions.routes.js:11](../../backend/src/api/routes/corporateActions.routes.js#L11) |
| GET | `/earnings/:symbol` | Public project API key; public market/research data | [corporateActions.routes.js:13](../../backend/src/api/routes/corporateActions.routes.js#L13) |
| GET | `/earnings/recent` | Public project API key; public market/research data | [corporateActions.routes.js:12](../../backend/src/api/routes/corporateActions.routes.js#L12) |
| GET | `/engine/:symbol` | Verified owner; fresh Premium or Plus | [engine.routes.js:28](../../backend/src/api/routes/engine.routes.js#L28) |
| POST | `/engine/assistant` | Verified owner; fresh Premium Plus | [engineWorkbench.routes.js:208](../../backend/src/api/routes/engineWorkbench.routes.js#L208) |
| GET | `/engine/basic/:symbol` | Verified owner; fresh Premium or Plus | [engine.routes.js:18](../../backend/src/api/routes/engine.routes.js#L18) |
| POST | `/engine/cash-flows` | Verified owner; fresh Premium Plus | [engineWorkbench.routes.js:187](../../backend/src/api/routes/engineWorkbench.routes.js#L187) |
| DELETE | `/engine/cash-flows/:id` | Verified owner; fresh Premium Plus | [engineWorkbench.routes.js:192](../../backend/src/api/routes/engineWorkbench.routes.js#L192) |
| GET | `/engine/financial-versions` | Verified owner; fresh Premium or Plus | [engineWorkbench.routes.js:144](../../backend/src/api/routes/engineWorkbench.routes.js#L144) |
| POST | `/engine/institutional/calculate` | Verified owner; fresh Premium or Plus | [institutional.routes.js:45](../../backend/src/api/routes/institutional.routes.js#L45) |
| POST | `/engine/institutional/company/:symbol` | Verified owner; fresh Premium or Plus | [institutional.routes.js:40](../../backend/src/api/routes/institutional.routes.js#L40) |
| POST | `/engine/institutional/graph` | Verified owner; fresh Premium Plus | [institutional.routes.js:59](../../backend/src/api/routes/institutional.routes.js#L59) |
| GET | `/engine/institutional/liquidity/:symbol` | Verified owner; any plan | [institutional.routes.js:32](../../backend/src/api/routes/institutional.routes.js#L32) |
| GET | `/engine/institutional/models` | Verified owner; fresh Premium Plus | [institutional.routes.js:31](../../backend/src/api/routes/institutional.routes.js#L31) |
| POST | `/engine/institutional/owned-liquidity` | Verified owner; fresh Premium Plus | [institutional.routes.js:51](../../backend/src/api/routes/institutional.routes.js#L51) |
| POST | `/engine/institutional/owned-simulation` | Verified owner; fresh Premium Plus | [institutional.routes.js:55](../../backend/src/api/routes/institutional.routes.js#L55) |
| GET | `/engine/institutional/profile/:symbol` | Verified owner; fresh Premium or Plus | [institutional.routes.js:26](../../backend/src/api/routes/institutional.routes.js#L26) |
| GET | `/engine/institutional/snapshots` | Verified owner; fresh Premium or Plus | [institutional.routes.js:65](../../backend/src/api/routes/institutional.routes.js#L65) |
| POST | `/engine/institutional/snapshots` | Verified owner; fresh Premium or Plus | [institutional.routes.js:66](../../backend/src/api/routes/institutional.routes.js#L66) |
| GET / DELETE | `/engine/institutional/snapshots/:hash` | Verified owner; fresh Premium or Plus; dynamic method loop | [institutional.routes.js:78](../../backend/src/api/routes/institutional.routes.js#L78) |
| POST | `/engine/interests` | Verified owner; fresh Premium Plus | [engineWorkbench.routes.js:181](../../backend/src/api/routes/engineWorkbench.routes.js#L181) |
| POST | `/engine/investment/calculate` | Verified owner; fresh Premium Plus | [engineWorkbench.routes.js:73](../../backend/src/api/routes/engineWorkbench.routes.js#L73) |
| GET | `/engine/investment/coverage` | Verified owner; fresh Premium Plus | [engineWorkbench.routes.js:91](../../backend/src/api/routes/engineWorkbench.routes.js#L91) |
| GET | `/engine/investment/event-preferences` | Verified owner; fresh Premium Plus | [engineWorkbench.routes.js:98](../../backend/src/api/routes/engineWorkbench.routes.js#L98) |
| POST | `/engine/investment/event-preferences` | Verified owner; fresh Premium Plus | [engineWorkbench.routes.js:101](../../backend/src/api/routes/engineWorkbench.routes.js#L101) |
| GET | `/engine/investment/evidence` | Verified owner; any plan | [engineWorkbench.routes.js:53](../../backend/src/api/routes/engineWorkbench.routes.js#L53) |
| POST | `/engine/investment/optimize-owned` | Verified owner; fresh Premium Plus | [engineWorkbench.routes.js:79](../../backend/src/api/routes/engineWorkbench.routes.js#L79) |
| GET | `/engine/investment/simulations` | Verified owner; fresh Premium Plus | [engineWorkbench.routes.js:87](../../backend/src/api/routes/engineWorkbench.routes.js#L87) |
| POST | `/engine/investment/simulations` | Verified owner; fresh Premium Plus | [engineWorkbench.routes.js:108](../../backend/src/api/routes/engineWorkbench.routes.js#L108) |
| DELETE | `/engine/investment/simulations/:id` | Verified owner; fresh Premium Plus | [engineWorkbench.routes.js:120](../../backend/src/api/routes/engineWorkbench.routes.js#L120) |
| GET | `/engine/investment/simulations/:id` | Verified owner; fresh Premium Plus | [engineWorkbench.routes.js:115](../../backend/src/api/routes/engineWorkbench.routes.js#L115) |
| POST | `/engine/labs/advanced` | Verified owner; fresh Premium Plus | [engineWorkbench.routes.js:125](../../backend/src/api/routes/engineWorkbench.routes.js#L125) |
| POST | `/engine/labs/bond` | Verified owner; fresh Premium Plus | [engineWorkbench.routes.js:177](../../backend/src/api/routes/engineWorkbench.routes.js#L177) |
| POST | `/engine/labs/earnings-sensitivity` | Verified owner; fresh Premium Plus | [engineWorkbench.routes.js:155](../../backend/src/api/routes/engineWorkbench.routes.js#L155) |
| POST | `/engine/labs/futures` | Verified owner; fresh Premium Plus | [engineWorkbench.routes.js:178](../../backend/src/api/routes/engineWorkbench.routes.js#L178) |
| GET | `/engine/labs/history-inputs` | Verified owner; fresh Premium Plus | [engineWorkbench.routes.js:134](../../backend/src/api/routes/engineWorkbench.routes.js#L134) |
| POST | `/engine/labs/intelligence` | Verified owner; fresh Premium Plus | [engineWorkbench.routes.js:31](../../backend/src/api/routes/engineWorkbench.routes.js#L31) |
| POST | `/engine/labs/stress` | Verified owner; fresh Premium Plus | [engineWorkbench.routes.js:166](../../backend/src/api/routes/engineWorkbench.routes.js#L166) |
| GET | `/engine/monitoring` | Verified owner; fresh Premium or Plus | [engineWorkbench.routes.js:195](../../backend/src/api/routes/engineWorkbench.routes.js#L195) |
| POST | `/engine/monitoring` | Verified owner; fresh Premium or Plus | [engineWorkbench.routes.js:196](../../backend/src/api/routes/engineWorkbench.routes.js#L196) |
| DELETE | `/engine/monitoring/:id` | Verified owner; fresh Premium or Plus | [engineWorkbench.routes.js:204](../../backend/src/api/routes/engineWorkbench.routes.js#L204) |
| GET | `/engine/monitoring/activity` | Verified owner; fresh Premium or Plus | [engineWorkbench.routes.js:206](../../backend/src/api/routes/engineWorkbench.routes.js#L206) |
| POST | `/engine/monitoring/check` | Verified owner; fresh Premium or Plus | [engineWorkbench.routes.js:205](../../backend/src/api/routes/engineWorkbench.routes.js#L205) |
| GET | `/engine/notebook` | Mounted verified owner; fresh Premium Plus | [engineNotebook.routes.js:16](../../backend/src/api/routes/engineNotebook.routes.js#L16) |
| POST | `/engine/notebook` | Mounted verified owner; fresh Premium Plus | [engineNotebook.routes.js:22](../../backend/src/api/routes/engineNotebook.routes.js#L22) |
| POST | `/engine/notebook/:id/:action` | Mounted verified owner; fresh Premium Plus | [engineNotebook.routes.js:52](../../backend/src/api/routes/engineNotebook.routes.js#L52) |
| GET | `/engine/peers` | Verified owner; fresh Premium Plus | [engineWorkbench.routes.js:194](../../backend/src/api/routes/engineWorkbench.routes.js#L194) |
| GET | `/engine/pipeline-health` | Verified owner; fresh Premium Plus | [engineWorkbench.routes.js:149](../../backend/src/api/routes/engineWorkbench.routes.js#L149) |
| GET | `/engine/portfolio` | Verified owner; fresh Premium Plus | [engineWorkbench.routes.js:185](../../backend/src/api/routes/engineWorkbench.routes.js#L185) |
| GET | `/engine/portfolio/overview` | Verified owner; any plan | [engineWorkbench.routes.js:186](../../backend/src/api/routes/engineWorkbench.routes.js#L186) |
| GET | `/engine/portfolio/scorecard` | Verified owner; any plan | [engineWorkbench.routes.js:193](../../backend/src/api/routes/engineWorkbench.routes.js#L193) |
| GET | `/engine/preferences` | Verified owner; fresh Premium Plus | [engineWorkbench.routes.js:179](../../backend/src/api/routes/engineWorkbench.routes.js#L179) |
| POST | `/engine/preferences` | Verified owner; fresh Premium Plus | [engineWorkbench.routes.js:180](../../backend/src/api/routes/engineWorkbench.routes.js#L180) |
| GET | `/engine/recommendations` | Verified owner; fresh Premium Plus | [engineWorkbench.routes.js:143](../../backend/src/api/routes/engineWorkbench.routes.js#L143) |
| GET | `/engine/research-access/:symbol` | Verified owner; fresh Premium or Plus | [engine.routes.js:15](../../backend/src/api/routes/engine.routes.js#L15) |
| GET | `/engine/risk/:symbol` | Verified owner; fresh Premium or Plus | [engine.routes.js:9](../../backend/src/api/routes/engine.routes.js#L9) |
| GET | `/engine/usage` | Verified owner; fresh Premium Plus | [engineWorkbench.routes.js:207](../../backend/src/api/routes/engineWorkbench.routes.js#L207) |
| GET | `/financials/:symbol` | Public project API key; public market/research data | [financials.routes.js:33](../../backend/src/api/routes/financials.routes.js#L33) |
| GET | `/financials/:symbol/collected-research` | Public project API key; public market/research data | [financials.routes.js:11](../../backend/src/api/routes/financials.routes.js#L11) |
| GET | `/financials/:symbol/history` | Public project API key; public market/research data | [financials.routes.js:34](../../backend/src/api/routes/financials.routes.js#L34) |
| GET | `/financials/:symbol/publisher-tables` | Public project API key; public market/research data | [financials.routes.js:26](../../backend/src/api/routes/financials.routes.js#L26) |
| GET | `/financials/candidates` | Public project API key; public market/research data | [admin.routes.js:14](../../backend/src/api/routes/admin.routes.js#L14) |
| GET | `/financials/candidates/:id` | Public project API key; public market/research data | [admin.routes.js:15](../../backend/src/api/routes/admin.routes.js#L15) |
| POST | `/financials/candidates/:id/confirm` | Public project API key; public market/research data | [admin.routes.js:16](../../backend/src/api/routes/admin.routes.js#L16) |
| POST | `/financials/candidates/:id/confirm-history` | Public project API key; public market/research data | [admin.routes.js:17](../../backend/src/api/routes/admin.routes.js#L17) |
| POST | `/financials/candidates/:id/reject` | Public project API key; public market/research data | [admin.routes.js:18](../../backend/src/api/routes/admin.routes.js#L18) |
| GET | `/health` | Public health; no customer payload | [health.routes.js:6](../../backend/src/api/routes/health.routes.js#L6) |
| GET | `/health/live` | Public health; no customer payload | [health.routes.js:5](../../backend/src/api/routes/health.routes.js#L5) |
| GET | `/historical/:symbol` | Public project API key; public market/research data | [historical.routes.js:9](../../backend/src/api/routes/historical.routes.js#L9) |
| GET | `/historical/:symbol/performance` | Public project API key; public market/research data | [historical.routes.js:10](../../backend/src/api/routes/historical.routes.js#L10) |
| GET | `/historical/sparklines` | Public project API key; public market/research data | [historical.routes.js:8](../../backend/src/api/routes/historical.routes.js#L8) |
| GET | `/indicators/:symbol` | Public project API key; public market/research data | [indicators.routes.js:7](../../backend/src/api/routes/indicators.routes.js#L7) |
| GET | `/indices` | Public project API key; public market/research data | [indices.routes.js:16](../../backend/src/api/routes/indices.routes.js#L16) |
| GET | `/instruments` | Public project API key; public market/research data | [instruments.routes.js:7](../../backend/src/api/routes/instruments.routes.js#L7) |
| GET | `/market-research/earnings` | Public project API key; public market/research data | [marketResearch.routes.js:26](../../backend/src/api/routes/marketResearch.routes.js#L26) |
| GET | `/market-research/intelligence` | Public project API key; public market/research data | [marketResearch.routes.js:6](../../backend/src/api/routes/marketResearch.routes.js#L6) |
| GET | `/market-research/records` | Public project API key; public market/research data | [marketResearch.routes.js:13](../../backend/src/api/routes/marketResearch.routes.js#L13) |
| GET | `/market-statistics` | Public project API key; public market/research data | [indices.routes.js:17](../../backend/src/api/routes/indices.routes.js#L17) |
| GET | `/models` | Public project API key; public market/research data | [admin.routes.js:22](../../backend/src/api/routes/admin.routes.js#L22) |
| POST | `/models/:id/status` | Public project API key; public market/research data | [admin.routes.js:23](../../backend/src/api/routes/admin.routes.js#L23) |
| GET | `/movers` | Public project API key; public market/research data | [movers.routes.js:7](../../backend/src/api/routes/movers.routes.js#L7) |
| GET | `/news` | Public project API key; public market/research data | [news.routes.js:7](../../backend/src/api/routes/news.routes.js#L7) |
| GET | `/news/:symbol` | Public project API key; public market/research data | [news.routes.js:9](../../backend/src/api/routes/news.routes.js#L9) |
| GET | `/news/item/:id` | Public project API key; public market/research data | [news.routes.js:8](../../backend/src/api/routes/news.routes.js#L8) |
| GET | `/ownership/:symbol` | Public project API key; public market/research data | [corporateActions.routes.js:15](../../backend/src/api/routes/corporateActions.routes.js#L15) |
| GET | `/price-history/:symbol` | Public project API key; public market/research data | [priceHistory.routes.js:14](../../backend/src/api/routes/priceHistory.routes.js#L14) |
| GET | `/quotes` | Public project API key; public market/research data | [quotes.routes.js:7](../../backend/src/api/routes/quotes.routes.js#L7) |
| GET | `/quotes/:symbol` | Public project API key; public market/research data | [quotes.routes.js:8](../../backend/src/api/routes/quotes.routes.js#L8) |
| POST | `/relationships/:id/review` | Public project API key; public market/research data | [admin.routes.js:30](../../backend/src/api/routes/admin.routes.js#L30) |
| GET | `/relationships/pending` | Public project API key; public market/research data | [admin.routes.js:29](../../backend/src/api/routes/admin.routes.js#L29) |
| GET | `/research/:symbol` | Public project API key; public market/research data | [research.routes.js:9](../../backend/src/api/routes/research.routes.js#L9) |
| GET | `/research/batch` | Public project API key; public market/research data | [research.routes.js:8](../../backend/src/api/routes/research.routes.js#L8) |
| GET | `/screener` | Public project API key; public market/research data | [screener.routes.js:7](../../backend/src/api/routes/screener.routes.js#L7) |
| GET | `/sectors` | Public project API key; public market/research data | [sectors.routes.js:5](../../backend/src/api/routes/sectors.routes.js#L5) |
| GET | `/securities` | Public project API key; public market/research data | [admin.routes.js:19](../../backend/src/api/routes/admin.routes.js#L19) |
| GET | `/statistics/:symbol` | Public project API key; public market/research data | [statistics.routes.js:13](../../backend/src/api/routes/statistics.routes.js#L13) |
| GET | `/valuation/:symbol` | Public project API key; public market/research data | [valuation.routes.js:11](../../backend/src/api/routes/valuation.routes.js#L11) |
| GET | `/valuation/:symbol/history` | Public project API key; public market/research data | [valuation.routes.js:10](../../backend/src/api/routes/valuation.routes.js#L10) |
| GET | `/valuation/batch` | Public project API key; public market/research data | [valuation.routes.js:9](../../backend/src/api/routes/valuation.routes.js#L9) |
| GET | `/volume-profile/:symbol` | Verified owner; fresh Premium or Plus | [volumeProfile.routes.js:8](../../backend/src/api/routes/volumeProfile.routes.js#L8) |

## Nonliteral and separately mounted surfaces

| Surface | Server boundary and ownership | Rate / cache policy |
| --- | --- | --- |
| /identity/session, /verify, /capabilities, /factors; POST /identity/:operation | API key; exact Origin or same-origin fetch plus session bridge header; provider cookies; verify checks JWT, local binding and live revocation; operation allowlist; bot verification on login/signup/recovery/Google/password proof. Email/MFA operations return explicit unsupported. Recovery/reset stay provider-backed. | Pre-auth IP and bounded dedicated identity buckets; no-store. Managed identity limiter currently process-local, not durable across replicas. |
| /data/:table (GET/HEAD/POST/PATCH/DELETE) | API key; compiled static table/column/filter allowlist; SET LOCAL authenticated or anon and JWT claims; session guard; RLS. Anonymous writes denied. Portfolio version filters; create intents; watchlist owner/quota locks. | Pre-auth IP; bounded SQL rows/bytes/time. No private response caching. |
| /data/community_feed | Verified session; session guard and owner-aware RLS feed SQL. | Bounded feed; no-store. |
| /data/rpc/:name | Static function and argument allowlist; verified owner except public company_processing_status; SET LOCAL role/claims; session guard. New default-watchlist RPC accepts no owner argument. | SQL timeout; no-store. |
| /functions/check-price-alerts, /delete-account, /stock-thesis | Verified owner first; alerts scoped by verified ID; deletion additionally recent-auth and existing disabled managed deletion flag; thesis explicitly disabled. | Owner-scoped protectionStore; 120/min; fail closed on configured shared-store outage. |
| /billing/paystack/webhook | Raw body HMAC, configured mode, provider verification, atomic fulfillment and owner-bound orders. No public key/user session required for provider delivery. | Dedicated pre-verification limiter; never cache. |
| /internal/* | Dedicated maintenance secret, not public project key; owned job SQL. | Bounded job/SQL leases; no browser route. |
| Cloudflare Worker proxy | Exact route/method/origin allowlists; private auth passthrough; no arbitrary upstream URL; key stays server-side. | Public read cache only; rejects Set-Cookie/private/auth responses; no private Engine cache. |
| Private financial R2 document route | Server source-rights decision and object hash/path validation; no client-supplied bucket/key or signed entitlement. | Private/no-store when required; original source rights remain authoritative. |
| Background ingestion | Workflow secrets and approved flags; SQL claim/lease ownership. | Scheduled enabled states unchanged; no extra production jobs dispatched. |

## Review limitations and decisions

Raw /research, /financials, /market-research and other market APIs remain public project-key APIs. They do not acquire a Premium paywall merely because the UI offers paid expanded Fundamentals. The paid /engine routes enforce server plan requirements. Whether a public raw dataset should become paid is a product/source-rights policy decision; no silent compatibility-breaking gate was added.

Rate controls distinguish verified owners after authentication, with a coarse unauthenticated IP guard retained for abuse. Billing admission and owned functions now use the verified owner key and configured protectionStore. Engine-specific and identity supplemental buckets remain bounded per-process; multi-replica guarantees require an approved shared store. No Upstash database exists or was enabled.

The separate E01 migration strips administrative table grants; it preserves DML and RPC grants. See PHASE2_SECURITY_RESULTS.md for actual role tests and remaining SQL rollout gates.
