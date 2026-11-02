# Continua production engineering audit

Date: 2 November 2026. Audited repository revision: `ff99c350e080b369ecf4f9a3ffeed9911c407f8c`.
Scope: architecture, database, HTTP/identity boundaries, payments, ingestion,
Engine, operations and frontend. This is an evidence-based engineering review,
not a penetration-test certificate or approval to implement changes.

**Audit only. No fixes, deployment, production data changes, account resets,
entitlement changes, schema changes, schedule changes or paid-service activation
were performed.** The four documents in this directory are the deliverables.

## Evidence and limitations

Evidence classes: **L** = current read-only live observation; **S** = inspected
source; **T** = existing automated test/fixture result from this session;
**H** = earlier dated incident evidence; **U** = not verified in production.
Source coverage does not imply that every migration is installed or that every
possible request/concurrency interleaving has been tested.

* **L:** frontend HTML returned 200, Brotli encoding, 951 ms on 2 Nov at
  15:23:40 UTC. One backend liveness request timed out after its 30-second
  deadline; no retry was made for this audit. This is not a percentile or proof
  that Neon is unavailable.
* **L:** Render dashboard still identifies `8a5b3509d353d06f1b1cc82218dee57bfccfc885`
  as its last successful live backend deployment. It is a Free instance, with
  a provider warning of 50+ second wake-up. Cloudflare's `ff99c35` production
  and preview builds passed in the immediately preceding release investigation.
* **L:** current Render settings show `AUTH_PROVIDER=neon-managed`, production
  enabled, branch `br-noisy-block-b4z5yxup`, issuer endpoint
  `https://ep-nameless-voice-b4ygobrp.neonauth.c-6.us-east-2.aws.neon.tech/neondb/auth`,
  `CACHE_DRIVER=memory`, and `WORKERS_ENABLED=true`. Only these non-secret
  values were revealed. Upstash support in code is not proof it is deployed.
* **L:** one pinned read-only Neon catalog session at 15:27:55 UTC used a
  two-second statement timeout and bounded metadata results: six profile-role
  grants, 33 constraints and two watchlist-folder indexes. No customer rows,
  duplicate scans, large exports or `EXPLAIN ANALYZE` were fetched.
* **H:** Neon project `orange-bird-13151544`, database `neondb`, production branch
  above, Ohio region. Nov 2 usage snapshot: 662.56 MB since Nov 1. See
  [the bandwidth incident](../neon-bandwidth-incident.md) for the limits of
  historical attribution, quotas, dates and source/R2 versus SQL byte accounting.
* **T:** local clean-install production build, 184 app tests, 40 Worker tests,
  credential/issuer audits, six native company-bundle cases and adjacent parity
  fixtures passed during the preceding release repair. GitHub subsequently
  passed the native candidate job and browser/security job for `ff99c35`.
  These were not rerun or represented as production load tests in this audit.
* **U:** production duplicate prevalence, comprehensive current RLS/ACL catalog,
  every deployed index, actual Paystack delivery history, enabled payment/AI
  secrets, provider MFA roadmap, production restore rehearsal, authenticated
  slow-device metrics, p95/p99 latency and monthly steady-state egress.

Ignored diagnostic receipts are in `.qa-artifacts/engineering-audit-20261102/`;
they contain bounded status/schema metadata, not credentials or customer records.

## Architecture actually present

| Layer | Implementation and evidence | Qualification |
|---|---|---|
| Frontend | React/TypeScript SPA; lazy routes in `app/src/App.tsx`; Cloudflare Worker/Assets | Vercel also reports deployments; that is not proof it is the customer-serving production origin |
| API | Render Node/Express compatibility service, `backend/src/index.js`, `api/server.js` | Go candidate exists but is not the deployed replacement; no cutover is recommended here |
| Database | Neon PostgreSQL; `public`, `market`, `scraping`, `app_identity` | App identities and relations use application UUIDs; managed subjects are mapped, not assumed equal |
| Auth | Neon managed Better Auth plus Continua's owned broker, encrypted provider-cookie vault, live-session verifier and SQL guard | Old self-hosted implementation remains a compatibility reference; managed MFA/email-change endpoints explicitly report unavailable |
| Financial documents | Private R2 originals, extraction snapshots and processed objects; SQL receipts/checksums | Public media is a separate R2 use case; do not make financial evidence buckets public |
| Cache | Memory in current Render; Redis/Upstash adapter available | Shared cache and distributed counters require a reviewed future configuration change |
| Collection | Bounded GitHub jobs plus durable SQL jobs, leases and version receipts | Render still runs application/market/publication workers; not every cron is durable or independent of service sleep |
| Payments | Paystack server initialization/verification, raw-body signed webhook, SQL fulfillment and optional native renewal | Mode/enable flags must be verified before asserting a live feature is active |
| Engine | Node orchestration, Python numerical worker, source-linked SQL/R2 evidence and candidate Go/Python parity | Preserve numerical and evidence contracts; planned/native features are not automatically production features |

## Ten highest-impact issues, in recommended order

No demonstrated Critical/P0 remote exploit was established. High/P1 includes
confirmed exposure of excessive authority and serious reliability/data-integrity
risks; it does not imply that an exploit or loss has occurred.

| Rank / ID | Severity / priority | Main issue | Must precede |
|---|---|---|---|
| 1 — E01 | High / P1 | Excess browser-role database privileges, confirmed live | New SQL surfaces, expanded roles and schema/role changes |
| 2 — E02 | High / P1 | Backend release drift: bandwidth fixes on main are not yet demonstrated live on Render | Claims of production remediation or capacity sizing |
| 3 — E03 | High / P1 | Memory cache and unproven monthly transfer budget | Scaling, shorter polling intervals, additional analytical traffic |
| 4 — E04 | High / P1 | Watchlist default/quota races and missing ownership coupling | New uniqueness constraints or folder semantics changes |
| 5 — E05 | High / P1 | Webhook lifecycle/recovery gaps beyond successful charge fulfillment | Expanded billing lifecycle automation |
| 6 — E06 | High / P1 | Unknown renewal outcome can remain unresolved indefinitely | Enabling/expanding automatic renewal |
| 7 — E07 | High / P1 | Provider/database failures can be reported as invalid sessions | Auth availability SLOs and new retry/recovery policies |
| 8 — E08 | High / P1 | Incomplete end-to-end telemetry and alert coverage | Measured optimisation claims and reliable incident closure |
| 9 — E09 | High / P1 | No current production restore/compatibility proof | Destructive migrations, rollback claims, native cutover |
| 10 — E10 | Medium / P2 | Remaining expensive read/request and process-local job boundaries | Broader caching/queue rewrites or capacity upgrades |

The [roadmap](IMPLEMENTATION_ROADMAP.md) preserves the requested six phases.
Phase 1 may perform approved measurement/read-only verification first; E01's
narrow security work should be fast-tracked with separate approval before any
access expansion. Do not silently implement it during this audit.

## Detailed findings

Each finding records status, evidence, impact, correction, complexity, compatibility,
cost and verification. Estimates are engineering effort bands, not delivery promises:
S = 0.5–2 days, M = 2–5 days, L = 1–2 weeks, subject to staging evidence.

### E01 — Excess database authority

* **High / P1; confirmed live plus source.** `infra/neon/application-grants.sql`
  grants `TRUNCATE`, `TRIGGER` and `REFERENCES` on `public.profiles` to both `anon`
  and `authenticated`; the bounded catalog query confirmed all six grants.
  Other broad `GRANT ALL` statements warrant a complete role review, not an
  assumption that all tables share the same installed ACL.
* **Impact:** an unnecessarily large blast radius if another SQL entrypoint or
  injection flaw is introduced. PostgreSQL RLS does not turn `TRUNCATE` into an
  owner-filtered operation. Current `browserData.js` parameterizes values and
  allowlists methods/identifiers; it does **not** expose arbitrary SQL/TRUNCATE.
  No Internet-exploitable truncate path was demonstrated or exercised.
* **Proposed correction:** least-privilege ACL matrix; remove unused administrative
  table privileges from browser roles, review SECURITY DEFINER/search paths and
  direct EXECUTE grants. Preserve necessary trigger execution and owner/service
  operations. No new grant or revoke is executed here.
* **Complexity:** M. **Risks:** careless revokes can break valid CRUD, triggers,
  auth provisioning or billing; apply on staging with the real contract first.
  **Cost:** engineering/test time, no new service. **Verify:** role-scoped CRUD,
  cross-user denial, paid-column denial and explicit administrative-operation
  denial on disposable data; then approved bounded production ACL comparison.

### E02 — Release and configuration drift

* **High / P1; confirmed live.** Main is `ff99c35`, Cloudflare passed that release,
  but Render's live revision remains `8a5b350`. `render.yaml` uses backend
  `rootDir`, `autoDeployTrigger: checksPass`; root/fixture-only follow-up commits
  need not constitute a new backend build. Exact provider skip/trigger reason
  is unverified; do not guess that one setting alone caused the drift.
* **Impact:** new Node bandwidth telemetry/read optimisation may be absent while
  operators assume the fix is live; incompatible rollout assumptions can hide regressions.
* **Correction:** release manifest with frontend/Worker/backend/job SHAs and
  configuration version; explicitly verify an approved backend deploy after all
  gates. **Complexity:** S–M. **Risks:** deployment can restart workers; verify
  schema compatibility and retain the previous artifact. **Cost:** no paid service.
  **Verify:** dashboard plus liveness revision, authenticated canaries, public
  financial/owned-data checks and job receipts. No deploy is performed now.

### E03 — Shared caching and transfer sustainability are not established

* **High / P1; live configuration/source/historical incident.** Render is on
  `CACHE_DRIVER=memory`; `backend/src/storage/cache.js`, `upstashCache.js`,
  `api/middleware/sharedRateStore.js`; Blueprint also declares memory. Prior
  5 GB exhaustion and 662.56 MB Nov 2 project usage do not establish a sustainable
  monthly rate. Nov 1/2 backlog work must be separated from normal demand.
  `services/research/engineBundle.js` also retains a 60-second public bundle and
  dated last-good research for up to 24 hours. A producer's source-rights query
  alone does not prove prompt revocation/invalidation of already cached evidence;
  current revocation propagation needs an explicit test.
* **Impact:** cold cache after sleep/restart; independent process counters;
  repeated research retrieval and inaccurate capacity assumptions.
* **Correction:** verify the existing Upstash account/limits before proposing
  server-only configuration, versioned namespaces, public-data TTL/invalidation
  and measured hit/miss/error rates. Keep live authorization outside settled caches.
* **Complexity:** M. **Risks:** key collisions, stale source rights, plan payload/
  command limits, fail-closed limiter availability. **Cost:** existing allowance
  first; any upgrade requires approval. **Verify:** miss/hit/restart/outage tests,
  multi-client counters and representative 24–72-hour provider transfer deltas.

### E04 — Watchlist concurrency and relational ownership

* **High / P1; source plus bounded live catalog.** `app/src/hooks/useWatchlist.tsx`
  reads zero folders then inserts a default. `20260817210000 watchlist folders.sql`
  uses a count-based quota trigger without a per-owner lock. Current catalog
  has only folder PK and user-id index, no unique default-per-owner index.
  `watchlists.folder_id` references folder ID alone; user ID is a separate FK.
  No actual duplicate/customer-record scan or cross-user exploit was run.
* **Impact:** concurrent tabs can race quota/default creation; ownership consistency
  is not guaranteed by the FK itself. Attaching an own watchlist row to an unrelated
  folder must be rejected independently of frontend filtering. This is not proof
  that private foreign rows can currently be read.
* **Correction:** one transactional owner-scoped get-or-create operation and quota
  lock; assess existing data before a partial unique default index and an
  ownership-consistent relational constraint/trigger. Preserve the current limits.
* **Complexity:** M. **Risks:** pre-existing duplicate/default or cross-owner links
  require an approved preservation plan, never silent deletion. **Cost:** engineering,
  bounded index work only after approval. **Verify:** concurrent two-tab creation,
  duplicate retry, quota edges, foreign-folder insertion and deletion behavior.

### E05 — Payment webhook lifecycle and durable intake

* **High / P1; source.** `backend/src/api/routes/billing.routes.js:paystackWebhook`
  validates raw-body SHA-512 HMAC/mode, then synchronously verifies `charge.success`.
  Other event types receive 200 without recorded handling; no durable general
  webhook inbox is evident. `paystackLive.js` permits 15-second provider calls.
  Actual configured provider subscriptions/events and delivery loss are unverified.
* **Impact:** refund/dispute/failure/subscription events and relevant unknown
  references may be operationally invisible; provider latency couples intake to
  the API. This is **not** a finding that repeated charge-success currently grants twice.
* **Correction:** signed bounded durable event receipt, documented supported/ignored
  event matrix, idempotent leased processing and reconciliation. Unsupported
  events need safe classification, not arbitrary membership changes.
* **Complexity:** L. **Risks:** acknowledge only after durable acceptance; preserve
  signature checks, reference/transaction uniqueness and atomic fulfillment.
  Refund/entitlement policy needs separate business approval. **Cost:** existing
  SQL queue/finite jobs first; no new broker by default. **Verify:** signed replay,
  concurrent callback/webhook, provider timeout, malformed signature, delayed
  event, unknown reference, failure/refund/dispute fixtures; no real charges.

### E06 — Safe renewal ambiguity lacks a bounded resolution workflow

* **High / P1; source, feature activation unverified.**
  `backend/src/workers/cardRenewalWorker.js` durably reserves `active_reference`
  and never repeats a charge on ambiguous failure. A crash after reservation but
  before initiation leaves a reference that later ticks only verify. Failed verify
  or unknown states can continue without an age-based operator resolution path.
* **Impact:** stuck renewals/support work and delayed membership recovery; blindly
  charging again would introduce a more serious double-charge risk.
* **Correction:** explicit state/age/retry deadlines, safe provider reconciliation,
  an operator queue and redacted alert. Preserve one-charge intent and cancellation.
* **Complexity:** M–L. **Risks:** retrying an ambiguous POST is forbidden; creating
  a new intent requires a proven terminal result/approved policy. **Cost:** existing
  infrastructure initially. **Verify:** crash at every boundary, duplicate workers,
  network ambiguity, cancellation during processing, terminal provider statuses.

### E07 — Auth unavailability can masquerade as session invalidity

* **High / P1; source.** `api/middleware/requireSubscriber.js:requireEngineUser`
  catches any `verifyAccess` failure and emits 401. `data/browserDataRoutes.js`
  and `data/functionRoutes.js` similarly flatten failures. `auth/managedVerifier.js`
  performs real database/provider checks that can fail transiently.
* **Impact:** outages can appear as expired sessions and produce repeated login
  attempts. Client recovery logic cannot recover information erased by the server.
* **Correction:** bounded typed distinction: invalid/revoked credentials remain
  401/403; dependency unavailability is retryable 503 without granting access.
* **Complexity:** M. **Risks:** never fail open or cache a revoked session; avoid
  revealing account existence/provider internals. **Cost:** no new service.
  **Verify:** provider/SQL timeout versus bad signature, expired/revoked token,
  sign-out, cross-user identity and frontend retained-session behavior.

### E08 — Partial observability, no demonstrated end-to-end SLO baseline

* **High / P1; source and release evidence.** Worker sends request ID/Server-Timing,
  but `requestLogger.js` records method/path/status/ms without correlating that ID.
  Identity/data/function routes mount before it. `monitoring/queryVolume.js`
  explicitly excludes direct clients, transactions and identity pools.
  `PageErrorBoundary.tsx` gives local recovery but no demonstrated redacted RUM
  pipeline. `operational-alerts.yml` observes named Actions workflows, not all
  provider deploy failures or stuck business jobs.
* **Impact:** latency, outages, payment ambiguity and egress cannot be attributed
  reliably. Missing telemetry is not evidence of missing safeguards.
* **Correction:** route-template correlation, bounded counters for all pool paths,
  redaction, error sampling, public/private separation and actionable SLO/age alerts.
* **Complexity:** M–L. **Risks:** credentials in callback URLs, user records in
  exception objects, high-cardinality labels and a monitoring-induced DB load.
  **Cost:** existing logs/receipts first; paid APM optional only after approval.
  **Verify:** injected synthetic failures across edge/API/SQL/jobs, no secret/PII
  output, bounded overhead and alert recovery without repeated unchanged notices.

### E09 — Recovery proof and release compatibility are incomplete

* **High / P1; source/test history, production drill unverified.**
  `infra/security/restore-fixture.mjs` does a real disposable dump/restore and
  compares rows/queue/security metadata. This is good evidence, but does not
  establish production recovery point/time or current Neon restore coverage.
  `infra/neon/*.sql`, Supabase migration history and source ACL snapshots require
  ordered operator steps rather than a single demonstrated current migration ledger.
* **Impact:** code rollback can be mistaken for data recovery; restoring an old
  branch could erase new payments, accounts or financial evidence.
* **Correction:** define RPO/RTO, verify provider retention/access, approve an
  isolated rehearsal, map forward/rollback compatibility and write reconciliation.
* **Complexity:** M–L. **Risks:** copying private production data, deleting writes
  after deployment, reusing payment/provider credentials in a clone. **Cost:** use
  existing retention/fixtures first; storage/branch upgrades require approval.
  **Verify:** synthetic representative roles/FKs/receipts/R2 references plus an
  explicitly approved production-recovery exercise; no production restore now.

### E10 — Remaining expensive reads and non-durable request jobs

* **Medium / P2; source, actual dominant costs unverified.**
  `engineWorkspace.js` still performs per-holding dividends/history work (some
  bounded/cached); `publisherCandleQuery.js` expands JSON histories server-side;
  `browserData.js` defaults to 1,000 rows and enforces its 4 MiB response ceiling
  only after retrieval. `calculationQueue.js` is a bounded in-memory queue,
  concurrency two/waiting eight, while `pythonCalculations.js` kills at five seconds.
* **Impact:** legitimate complex requests can occupy scarce connections/memory or
  repeat work after restart; post-fetch size limits do not prevent SQL transfer.
* **Correction:** measure query/endpoint payloads first; batch confirmed duplicates,
  narrower columns/cursors and only justified durable job types. Preserve complete
  history and correction handling; do not queue every simple request.
* **Complexity:** M–L. **Risks:** stale financial evidence, changed ordering, missing
  histories or treating durable queues as auth caches. **Cost:** existing SQL/
  GitHub first; queue/RAM/Redis allowances must be evaluated. **Verify:** numerical
  parity, cancellation, restart/resume, bounded result sizes and 512 MB load tests.

### E11 — Mutation idempotency and stale-edit contracts differ

* **Medium / P2; source/catalog.** Managed provisioning locks issuer/subject;
  portfolio `(user_id,symbol)`, watchlist `(user_id,folder_id,symbol)` and reaction
  uniqueness prevent several duplicate classes. However `usePortfolio.tsx`
  replaces values by ID/owner without expected version, posts use normal insert,
  and hosted `initializeLiveCheckout` creates a fresh reference per request.
  Native checkout already has intent hashes/account locks and must be preserved.
* **Impact:** stale manual holdings edits can overwrite another tab; ambiguous post
  retries can duplicate content; duplicate hosted initialization creates orders,
  not by itself duplicate charges. This app path is not a brokerage trade engine.
* **Correction:** specify replacement versus additive semantics; optimistic
  concurrency for edits and scoped idempotency for appropriate creates/checkout.
* **Complexity:** M. **Risks:** deduplicating genuinely distinct user actions or
  merging valid independent orders. **Cost:** modest indexed receipt storage.
  **Verify:** concurrent edits, same/different intent payloads, lost response,
  replay TTL, owner isolation; no replay of ambiguous payment initiation.

### E12 — Prompt-injection residuals and paid-AI activation boundary

* **Medium / P2, before any AI activation; source, live activation unverified.**
  `engineAssistant.js` treats evidence as untrusted data, uses a strict output
  schema, validates citation IDs, applies context/output/time/cost budgets and
  `store:false`; no tool calls are provided. `engineWorkbench.routes.js` can
  assemble private portfolio facts. With a key configured the compatibility
  assistant takes its paid-provider path; its default monthly budget is $5 in
  `config/env.js`. A key is not an independent approval/enable flag.
* **Impact:** answer contamination, inappropriate disclosure of selected context,
  or accidental spend if a key is introduced. Citation membership alone does not
  prove that a statement is supported. No autonomous SQL/payment/tool execution
  is implemented in this assistant; do not invent an agent threat surface.
* **Correction:** explicit approval-gated enablement, context minimisation/disclosure,
  adversarial direct/retrieved prompt fixtures, semantic support checks and safe
  rendering; keep tools absent unless separately designed/approved.
* **Complexity:** M. **Risks:** tests must not call a paid provider; do not send
  secrets to an evaluator. **Cost:** offline fixtures first, funded evaluation only
  after approval. **Verify:** malicious articles/questions, forged source IDs,
  secret requests, cross-user cache isolation and malformed/incomplete outputs.

### E13 — Frontend performance is partly implemented, not measured in the field

* **Medium / P2; source/build plus one public request.** See all 31 categories in
  [PERFORMANCE_BASELINE.md](PERFORMANCE_BASELINE.md). Lazy routes, bounded image
  conversion, search debounce and public query persistence exist. Main JS is
  469.91 kB / 149.52 kB gzip in the clean local build; some deferred chart/export
  chunks are larger. There is no measured slow-device/p75 Core Web Vitals baseline.
* **Impact:** work may target the wrong bottleneck; heavy views/polls/cache
  serialization may still hurt devices even when the API is healthy.
* **Correction:** reproducible cold/warm mobile scenario measurements before
  dependency splitting, virtualisation, cache-write or polling changes.
* **Complexity:** M. **Risks:** accessibility/scroll regressions, wrong fresh/stale
  financial labels and removing useful loading states. **Cost:** local lab first;
  redacted RUM vendor adoption requires separate cost/privacy review.
  **Verify:** same data/device scenarios, p75 lab/field distinction, keyboard and
  touch, image memory, long tasks and query counts; no fabricated measurements.

### E14 — Historical layers and dependency ownership need an explicit ledger

* **Medium / P2; source/recent CI.** `render.yaml` comments still describe Supabase/
  Vercel while current runtime is Neon/Cloudflare. `supabase/`, `scraper/`, native
  candidates and Node compatibility files have live/fixture/operator references.
  Recent TypeScript-API and indicator-fixture failures show coupling across layers;
  root/app and backend dependency trees differ. Audit results from the release:
  root seven moderate, backend seven low, scraper zero; no high/critical gate failure.
* **Impact:** accidental deployment/rewrite/deletion and recurrent dependency drift.
* **Correction:** document each module/flag as live, candidate, operator-only,
  fixture or proven unused; establish workspace install/build ownership and patch
  review. Do not delete based on text search or hide advisories by loosening gates.
* **Complexity:** M–L. **Risks:** dynamic imports, migration history and rollback
  references are easy to miss. **Cost:** engineering, no new service.
  **Verify:** clean Linux/Windows installs, route/import inventory, whole CI and
  staged deletion candidates with restore plan after separate approval.

### E15 — Managed Auth capability limits must remain explicit

* **Medium / P2; source/live provider configuration.** `auth/managedRoutes.js`
  returns MFA/email-change capability false and explicit unavailable responses.
  `managedVerifier.js` requires verified email, pinned issuer/audience/signature,
  active mapping and a live provider session; recent password checks are separate.
* **Impact:** users/operators may assume old self-hosted MFA features still apply.
* **Correction:** product/admin assurance matrix, truthful UI/support and a reviewed
  provider-supported path if MFA becomes mandatory. No provider replacement or
  account reset is proposed without separate approval.
* **Complexity:** S to document, implementation depends on verified provider support.
  **Risks:** false assurance or lockouts; do not fabricate AAL2. **Cost:** unknown
  until official support/plan review. **Verify:** current capability contract,
  unsupported endpoints, recent-auth enforcement and account recovery fixtures.

### E16 — Numeric/domain contracts require evidence before schema changes

* **Medium / P2; source/catalog.** Current portfolio checks require shares > 0 and
  average cost > 0; UI permits a zero average cost. Shared market `db.js` parses
  NUMERIC/INT8 into JS numbers, while identity pool preserves them as strings.
  No out-of-range production values or rounding defect was demonstrated.
* **Impact:** inconsistent validation/user errors; future wider domains could
  violate assumed safe numeric bounds. This is not permission to change Engine math.
* **Correction:** explicit units, zero/missing semantics, integer/fractional share
  contract and exact-versus-approximate field bounds; resolve client/server mismatch
  with product approval and preserve accepted historical values.
* **Complexity:** M. **Risks:** financial behavior changes and invalid assumptions
  about legacy data. **Cost:** engineering/fixtures. **Verify:** boundary/property
  cases, decimal round trips, large values, zero/null, losses and numerical parity.

## Category conclusions and existing strengths

### Database and transfer

The schema separates market data, scraping receipts and identity concerns; owner
FKs now reference `app_identity.users` for the sampled holdings/watchlist tables.
Profile owner uniqueness, holdings uniqueness, folder-scoped watchlist uniqueness,
positive-value checks, receipt keys and managed issuer/subject uniqueness exist.
Read `infra/neon` alongside source migrations: `auth.users` in historical SQL does
not establish a broken live FK. Catalog verification confirmed the remapped FKs.

The recent bandwidth patch already removes repeated context refreshes, suppresses
discarded SQL payloads when current R2 objects exist, coalesces cache lookups and
shares indicator history within a bundle. Preserve those fixes; E02 explains why
repository improvement cannot be called a verified live Render improvement yet.
No unrestricted production data scan or speculative index change is recommended.
Inspect plans/metadata for actual expensive queries before adding indexes.

### Protected endpoint family review

| Surface / source | Existing independent server boundary | Audit qualification |
|---|---|---|
| Worker `infra/cloudflare/worker.mjs`, `identity.mjs`, `media.mjs` | Same-origin checks, server-held key, signed edge identity, IP rate bindings, body caps; no public admin/webhook forwarding | Verify actual bindings during a separately approved rollout; public assets/media and private financial evidence are different policies |
| `/identity/*` — `auth/managedRoutes.js` | Exact origin + session header, bot verification for sensitive operations, cookie broker, provider checks, one-use OAuth intent | Per-operation/account limits and transient error semantics need review; do not replace live revocation with a settled cache |
| `/data/*` — `data/browserDataRoutes.js`, `browserData.js` | Static table/column/RPC contract, bound values, verified claims, SET LOCAL role, SQL live guard/RLS, explicit mutation filters, private no-store | Role authority is still excessive (E01); operation-specific limits/idempotency and query sizes need work |
| `/functions/*` — `data/functionRoutes.js` | Verified identity, bounded body/rate, owned alert/deletion handlers; paid thesis explicitly disabled | Account deletion is consequential and separately gated; no destructive test was run |
| General market/research API — `api/routes/index.js` | API key + preauth/general/workload admission, validation and source gates in relevant services | An API key identifies an application, not an end user. Public issuer data must not be confused with subscriber workspaces |
| `/engine/*` — `engine.routes.js`, `engineWorkbench.routes.js`, `engineNotebook.routes.js`, institutional routes | Verified session, effective SQL plan, Premium/Plus middleware, owner from server locals, strict schemas/bounded calculators | Basic/current/free exceptions are intentional; retain the existing entitlement matrix and test every route family against forged owner/plan input |
| `/billing/*` — `billing.routes.js` | Verified user, server-side prices, reference ownership, signature/mode/amount/customer verification | E05/E06/E11 are lifecycle/availability issues, not a justification to trust client prices |
| `/admin/*`, `/internal/*` | Dedicated admin/maintenance secrets and admission; Worker blocks forwarding | Keep separate from frontend API key; audit least privilege and redacted diagnostics |
| `/health/live`, `/health` | Intentionally unauthenticated liveness/dependency checks | Liveness has no SQL; deeper checks touch DB/cache and must stay low-frequency; no raw dependency detail should reach public reports |
| Private events | `infra/cloudflare/private-events.mjs`, backend websocket guards | Existing authenticated subscriptions, not tokens in URLs | Verify reconnection/expiry under load; no browser token URL telemetry |

This is a source-based boundary review with known test evidence, not a claim that
each production route was actively probed. Current owner/plan denial tests are a
strong foundation; add a maintained route-level security ledger as Phase 2 proof.

### Rate limiting: controls exist, uneven coverage remains

* Pre-auth 120/min IP admission before remote verification, with a separate sign-out
  bucket; health and provider webhook are skipped there intentionally.
* Worker bindings include edge, auth, payment and media limits. Backend general
  API, workload, admin and webhook limiters exist. Workloads distinguish verified
  users from a shared public API-key bucket. Shared counters use Lua atomic TTLs
  and fail closed on configured Redis/Upstash failure.
* Managed identity/functions/workbench also have process-local bounded limiters;
  the data router mounts before the general API workload middleware. This is
  **not** an unthrottled public surface: edge/pre-auth limits still apply, but
  posts/reactions/search/identity recovery lack a demonstrated consistent shared
  per-user/per-operation policy. NAT households and distributed clients need tests.
* AI has owner quotas and global reservation locks in addition to route limits.
  Do not add blanket retries, silently fail open or punish sign-out for read traffic.

### Idempotency/race inventory

| Flow | Correctly implemented | Remaining proof/work |
|---|---|---|
| Managed registration/profile | Issuer+subject lock, unique mapping, transaction creates identity/profile/preferences | External signup and local intent span systems; test provider-success/DB-failure recovery without duplicate accounts |
| Handles | Normalisation/check/unique lower-case index | Availability check is advisory; keep unique constraint as arbiter |
| Holdings | Owner RLS, positive checks, unique owner/symbol | E11 stale edit/intent contract; not a brokerage execution ledger |
| Watchlists/folders | Owner rows, folder FK, owner/folder/symbol uniqueness | E04 default/quota concurrency and ownership coupling |
| Reactions/polls | Unique/upsert semantics and existing SQL RPCs; minimal 201 acknowledgement fixed | Preserve first-write behavior; race/change/retry tests per reaction type |
| Posts/comments | Normal inserts, owner scope and source/schema rules | User-action idempotency for ambiguous responses, not identical-text global dedup |
| Scraping/ingestion | SKIP LOCKED, leases, bounded attempts, content/version receipts, idempotent publication | Retry age/dead-letter alerting and multi-run coverage/age SLOs |
| Reconciliation | Durable archive IDs/checksums/version comparison; one assembly per run in current source | Corrected historical data must still enter processing; deployment/transfer proof pending |
| Payment fulfillment | Unique reference/provider transaction, row locks, atomic tier/receipt commit | E05 lifecycle inbox and E06 operational ambiguity; retain existing guarantees |

### Background work and deployment/recovery

`scraper-python/continua_scraper/documents.py` uses durable lease/attempt recovery;
GitHub collectors share non-cancelling concurrency and finite time/transfer
reservations. Do not replace these with an in-memory queue. Backend calculator
queue is appropriately bounded for short work but not restart-durable; use a
durable model only for tasks with a justified asynchronous product contract.
Render's free web service can sleep; cron in a sleeping process is not a delivery
guarantee. Cloudflare maintenance is an additional scheduler, not proof that
every renewal/publication task is delivered once. Separate read-only canaries,
job-age monitoring and leased/idempotent work before adding paid workers.

### Prompt injection and AI/tool boundaries

The implemented compatibility assistant has user questions, preferences and
source-derived company/news/portfolio evidence. Structured instructions distinguish
untrusted data, output schema/known citation checks reject malformed/foreign IDs,
provider timeout/input/output budgets exist, and no SQL/shell/payment tool is
passed to the provider. Therefore focus on answer integrity, scope leakage,
budgeting and display safety, not a fictitious autonomous tool executor. The
disabled legacy stock-thesis endpoint must remain disabled unless approved.
Native assistant code remains a candidate; review its own enable/tool contracts
before any future cutover rather than projecting compatibility guarantees onto it.

### Cleanup and dependency review

No file was deleted. Frontend `supabase` variable names currently refer to the
owned compatibility transport and are not sufficient evidence of a live Supabase
dependency. Historical SQL, fixtures and Node/native oracles are rollback and
reference evidence. Dynamic imports, CLI package scripts, Docker contexts,
workflows and candidate parity dependencies must be mapped before removal.
Consolidating toaster/query/image helpers or changing TypeScript versions needs
bundle and behavioral evidence; a static search alone is not approval.

## Primary guidance consulted

* [PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
  and [row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html):
  integrity/ownership constraints complement row policies; inspect administrative
  privileges separately rather than assuming RLS covers them.
* [Paystack webhooks](https://paystack.com/docs/payments/webhooks/): validate provider
  signatures and account for delivery/retry behavior; durable intake and business
  idempotency serve different purposes.
* [OWASP prompt injection prevention](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html):
  layer data/instruction separation, least authority, validation and adversarial tests.
* [Web Vitals](https://web.dev/articles/vitals): distinguish field percentiles and
  lab observations; asset sizes and one HTTP request are not measured CWV.

These sources guide recommendations, not claims about uninspected production
settings. Approval is requested for the roadmap scope before Phase 1 starts.

## Source evidence index

Paths below are repository-relative; historical SQL must be read with current
Neon adaptations and the bounded catalog evidence, not treated as the live schema.

| Finding | Canonical implementation references |
|---|---|
| E01 | [ACL snapshot](../../infra/neon/application-grants.sql), [SQL contract](../../backend/src/data/browserData.js), [role adaptation](../../infra/neon/request-roles.sql) |
| E02 | [Blueprint](../../render.yaml), [liveness controller](../../backend/src/api/controllers/health.controller.js), [bandwidth incident](../neon-bandwidth-incident.md) |
| E03 | [cache selection](../../backend/src/storage/cache.js), [Upstash](../../backend/src/storage/upstashCache.js), [bundle caching](../../backend/src/services/research/engineBundle.js), [shared counters](../../backend/src/api/middleware/sharedRateStore.js) |
| E04 | [watchlist flow](../../app/src/hooks/useWatchlist.tsx), `supabase/migrations/20260817210000 watchlist folders.sql`, [data boundary](../../backend/src/data/browserDataRoutes.js) |
| E05 | [webhook](../../backend/src/api/routes/billing.routes.js), [live verification](../../backend/src/services/paystackLive.js), [fulfillment SQL](../../supabase/migrations/20261010210000_paystack_live_checkout.sql) |
| E06 | [renewal worker](../../backend/src/workers/cardRenewalWorker.js), [native intent/verification](../../backend/src/services/paystackNative.js) |
| E07 | [identity/plan middleware](../../backend/src/api/middleware/requireSubscriber.js), [managed verifier](../../backend/src/auth/managedVerifier.js), [data routes](../../backend/src/data/browserDataRoutes.js), [function routes](../../backend/src/data/functionRoutes.js) |
| E08 | [middleware ordering](../../backend/src/api/server.js), [logger](../../backend/src/api/middleware/requestLogger.js), [query coverage](../../backend/src/monitoring/queryVolume.js), [failure receipts](../../.github/workflows/operational-alerts.yml) |
| E09 | [restore fixture](../../infra/security/restore-fixture.mjs), [operational rollback](../neon-bandwidth-operations.md), [native gates](../../AGENTS.md) |
| E10 | [portfolio workspace](../../backend/src/services/research/engineWorkspace.js), [history SQL](../../backend/src/storage/repositories/publisherCandleQuery.js), [queue](../../backend/src/services/research/calculationQueue.js), [Python boundary](../../backend/src/services/research/pythonCalculations.js) |
| E11 | [holdings](../../app/src/hooks/usePortfolio.tsx), [provisioning](../../backend/src/auth/managedProvisioning.js), [hosted checkout](../../backend/src/services/paystackLive.js), [native checkout](../../backend/src/services/paystackNative.js) |
| E12 | [assistant](../../backend/src/services/research/engineAssistant.js), [evidence assembly](../../backend/src/api/routes/engineWorkbench.routes.js), [defaults](../../backend/src/config/env.js) |
| E13 | [routes](../../app/src/App.tsx), [query persistence](../../app/src/lib/queryClient.ts), [image conversion](../../app/src/lib/imagePreparation.js), [error recovery](../../app/src/components/layout/PageErrorBoundary.tsx) |
| E14 | [workspaces](../../package.json), [backend package](../../backend/package.json), [native ledger](../architecture/NATIVE_REWRITE_LEDGER.json), [continuation](../architecture/NATIVE_IMPLEMENTATION_CONTINUATION.md) |
| E15 | [managed capabilities](../../backend/src/auth/managedRoutes.js), [runtime pins](../../backend/src/auth/managedRuntime.js), [live verification](../../backend/src/auth/managedVerifier.js) |
| E16 | [market numeric parsers](../../backend/src/storage/db.js), [identity pool](../../backend/src/auth/runtime.js), [holdings validation](../../app/src/hooks/usePortfolio.tsx), `supabase/migrations/20250930031246_96eed1f7-ea9b-4616-89f1-380eacc896fe.sql` |
