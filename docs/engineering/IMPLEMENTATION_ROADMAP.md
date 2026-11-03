# Continua implementation roadmap — approval draft

2 November 2026; audit baseline `ff99c35`. This document proposes work; it does
not authorize it. No Phase 1 fixes have started. See
[CONTINUA_AUDIT.md](CONTINUA_AUDIT.md) for each finding's evidence, severity,
files, impact, complexity, risks, costs and tests, and
[RISK_REGISTER.md](RISK_REGISTER.md) for closure gates.

## Ordering and constraints

1. Establish what is actually live (E02), preserve rollback and capture cheap
   baseline evidence (E08/E09) before claiming bandwidth/performance wins.
2. Fast-track E01's confirmed excess privileges as a separately approved narrow
   security change. Phase 1 read-only diagnosis need not wait; new SQL exposure,
   grants or schema expansion must wait. The six phases are workstreams with
   explicit dependencies, not permission to postpone a verified High risk.
3. Confirm current constraints/duplicate conditions before uniqueness/FK changes
   (E04). Never repair by deleting accounts, histories or arbitrary duplicates.
4. Preserve current fulfillment, ownership, entitlement and numerical contracts
   while designing new lifecycle/queue behavior (E05/E06/E10/E11).
5. Measure before buying capacity, moving regions, adding workers or rewriting
   the UI/runtime. Paid/always-on services remain disabled unless separately approved.

Common gate: every production deployment, environment change, schema/role DDL,
schedule reactivation, data repair, paid feature and provider change requires the
appropriate explicit approval. Approval of this audit does not imply all six
phases or destructive repairs are authorized.

## Phase 1 — Database and bandwidth efficiency

**Findings:** E02, E03, E10; measurement prerequisites E08/E09. E01 is an urgent
parallel security gate. **Indicative effort:** M–L (roughly 1–2 weeks), split into
small reviewed releases rather than one migration.

### 1A. Read-only/release evidence

* Inventory frontend, Worker, backend and collector SHAs plus non-secret effective
  config. Explain the observed Render `8a5b350` versus repository `ff99c35` drift.
  Inspect actual deployment-trigger/filter evidence; do not assume a root-only
  follow-up commit deploys the backend.
* Review schema/ACL/index metadata in bounded queries and map remaining direct
  pool/transaction/identity reads. Verify existing roles and query contracts first.
* Snapshot provider month-to-date transfer and finite job receipts. Separate
  backlog/migration days from ordinary demand. Neither R2 logical counters nor
  sampled decoded-value sizes equal Neon billed egress.

### 1B. Approved targeted release and cache experiment

* Only after deployment approval, deliver the already-prepared bandwidth fixes
  to the backend that actually serves users; preserve previous artifact/version.
  Check source rights, canonical history, dates, account/plan access and receipts.
* Inspect existing Upstash plan, payload/command/concurrency allowance and credential
  placement before proposing `CACHE_DRIVER=upstash`. Use a separate cache namespace
  and preserve configured limiter fail-closed behavior. Review Blueprint sync so
  it cannot silently restore `memory`. Do not create a paid database as a shortcut.
* Measure portfolio/Engine/window reuse; batch only proven duplicate reads.
  Prefer required columns/date ranges/cursors. Keep complete histories and late
  corrections available. Add indexes only after plan/cardinality evidence.

**Dependencies:** baseline and rollback checklist; E01 gate before authority
expansion; no unresolved owner/rights regression. **Compatibility risks:** stale
rights/paid state in shared cache, query ordering, missing periods, pool waiters,
cache payload limits. **Cost:** existing services first; capacity choice deferred.

**Acceptance:** correct live revision; pre/post representative 24–72-hour provider
growth with job/request counts; cold/miss/hit/restart/outage scenarios; no unsafe
auth caching; numeric and historical-coverage parity; bounded load within current
memory/connection budgets. Report whether Free genuinely fits with headroom;
do not promise savings from a synthetic context-only comparison.

## Phase 2 — Security and integrity

**Findings:** E01, E04, E07, E11, E12, E15, E16. **Effort:** L, divided by domain.

* Review/reduce browser-role administrative privileges, SECURITY DEFINER/search
  paths and EXECUTE grants using an explicit allowlist. Test every necessary
  role-scoped operation on staging before approved production revokes.
* Produce a route-level access matrix: authentication, plan, owner, schema,
  limiter, request/response caps and error behavior for every registered route.
  Include Worker/media, private events, admin/internal and unsupported auth controls.
* Make default-folder creation/quota enforcement transactional. Design owner-safe
  folder references and a partial unique default invariant after a bounded,
  approved existing-data assessment. Preserve the existing Free/Premium limits.
* Distinguish unavailable dependencies from invalid/revoked credentials while
  denying access in both cases. Preserve confirmed sign-out and one-use OAuth flow.
* Specify stale-edit/idempotency semantics for manual holdings, posts and hosted
  checkout. Do not treat portfolio snapshots as broker executions.
* Document managed Auth capability limits honestly. Any MFA/email-change expansion
  needs verified official support and a separate account-safe plan.
* Keep paid AI off; add approval-gated activation design, minimized context and
  adversarial prompt/citation/rendering fixtures without calling a paid provider.
* Document financial units, bounds, zero/missing/share contracts. No numerical
  algorithm or historical-data conversion merely to make validation consistent.

**Dependencies:** E01 before new access; data assessment before constraints;
E16 contract decisions before type changes. **Risks:** lockouts, broken trigger
operations, false 401 recovery, data loss during dedup, changed entitlements.
**Cost:** engineering/staging; no new vendor required.

**Acceptance:** same-/cross-owner and all-plan denial tests; forged JWT/plan/price
rejection; concurrent default/quota tests; invalid/transient auth distinction;
idempotency payload conflict/replay cases; no production identity resets or
customer data deletion; full financial parity and a reviewed ACL diff.

## Phase 3 — Background processing and payments

**Findings:** E05, E06, E10, E11. **Effort:** L, payment policy decisions separate.

* Retain collectors' existing durable leases/checkpoints and non-cancelling
  concurrency. Add age/coverage/retry-budget operational contracts, not a queue rewrite.
* Classify work: short bounded synchronous calculations; finite background tasks;
  user-visible durable jobs with progress/cancellation. Introduce job IDs and
  owner scope only where restart persistence is required.
* Design a signed webhook inbox with deduplication, bounded payload retention,
  supported/ignored event classification, durable acknowledgement and leased processing.
  Preserve server verification and atomic unique-reference/transaction fulfillment.
* Define handling/reconciliation for failed, disputed, refunded, reversed and
  subscription lifecycle events relevant to enabled Paystack features. A new
  entitlement/refund policy is not authorized by this engineering roadmap.
* Add a safe stale/unknown renewal resolution workflow and redacted operator
  alert. Never repeat an ambiguous charge POST. Verify persisted reference first.
* Evaluate existing SQL/GitHub/Cloudflare coordination before considering Upstash
  queues or Render paid workers; address sleep/concurrency/cost explicitly.

**Dependencies:** Phase 2 access/idempotency, E09 compatibility, business approval
for event consequences. **Risks:** acknowledging undurable work, duplicate charge,
lost payment, inaccessible job state, secret retention, new recurrent DB traffic.
**Cost:** existing infrastructure first; broker/worker purchase separately approved.

**Acceptance:** crash/restart at every intake/reservation/provider/commit boundary;
repeat/concurrent webhook and callback; same intent/different payload; no duplicate
credit/charge; eventual recovery or visible operator state; bounded job resource
usage and complete issuer/history coverage. Use signed synthetic/test-mode fixtures,
not real customer charges or manual production replay during development.

## Phase 4 — Observability and rollback

**Findings:** E08, E09; consumers are every earlier phase. **Effort:** M–L.

* Start the minimal release/correlation/error baseline during Phase 1; complete
  full route/pool/job coverage here. Propagate a validated edge request ID and
  log route templates, durations, safe error classes and sampled byte estimates.
* Add low-volume actionable alerts for provider quota slope, failed deploy,
  overdue collection, stuck payment/renewal and repeated auth dependency errors.
  Retain existing workflow failure/recovery receipts. Do not notify on unchanged state.
* Sample/redact frontend errors and vitals after privacy approval; never send
  private holdings, user prompts, raw URLs/tokens or payment data as labels.
* Verify actual Neon backup/PITR retention and access, define RPO/RTO and rehearse
  an isolated representative recovery. Preserve FK/RLS/roles/R2 receipts.
* Adopt expand/contract migrations, recorded schema versions and compatibility
  windows. Prefer code rollback plus reconciliation to overwriting new live writes.

**Dependencies:** safe labels/ownership first; production-derived recovery exercise
requires explicit approval. **Risks:** monitoring becomes a traffic source or
discloses credentials; stale restore discards new accounts/payments/evidence.
**Cost:** existing logs/CI first; retention/APM upgrades only after approval.

**Acceptance:** trace a synthetic failure edge→API→SQL/job, useful alert and recovery;
bounded overhead/cardinality; approved recovery rehearsal meets recorded RPO/RTO;
previous release remains compatible with writes made since deployment.

## Phase 5 — Frontend performance

**Findings:** E03, E07, E10, E13. **Effort:** M–L, prioritised by measurements.

* Run the scenario/device matrix in [PERFORMANCE_BASELINE.md](PERFORMANCE_BASELINE.md).
  Establish field/lab distinction and warm/cold/limited-network baselines.
* Reduce measured duplicate polling, hidden-workspace requests, cache serialization
  or large eager imports before cosmetic rewrites. Preserve recent covering-window
  deduplication and honest data dates; do not poll protected sessions less securely.
* Add responsive image delivery, list windowing, memoisation or public-marketing
  pre-rendering only when the relevant profile demonstrates a benefit.
* Test existing loading/retry/optimistic behavior rather than blanket optimistic
  financial/payment updates. Keep accessibility, image viewer and chart gestures.

**Dependencies:** reliable server data/error semantics and observability;
stable evidence/entitlement contracts. **Risks:** altered charts, lost scroll/focus,
misleading stale data, user-specific browser-cache leakage. **Cost:** local tools
first; CDN transforms/RUM services separately reviewed.

**Acceptance:** before/after same scenarios and data, network/query counts, long
tasks/memory and interaction latency on a real slow phone; correct loading/error/
empty states; all 31 toolkit statuses revisited with explicit evidence.

## Phase 6 — Technical debt and code cleanup

**Findings:** E14, E15, E16 and any closed earlier items. **Effort:** L, incremental.

* Establish live/candidate/operator/fixture/obsolete ownership for source, flags,
  migrations, Docker contexts, entrypoints and dependencies. Correct misleading
  Supabase/Vercel comments without assuming the named code is unused.
* Consolidate duplicated utilities only with preserved contracts and import/runtime
  reachability evidence. Patch dependency compatibility with clean CI installs,
  explicit owners and advisory triage; never lower security thresholds to go green.
* Retain migration history, restore evidence, native parity oracles and rollback
  implementation until separate removal/cutover gates are met.
* A Go rewrite/cutover is **not** a phase of this roadmap. It needs its own complete
  feature ledger, security/numerical parity and resource/recovery approval.

**Dependencies:** closed behavioral risks, reliable tests and release/recovery
manifest. **Risks:** deletion of dynamic imports, CLI paths, cron entrypoints,
legacy recovery or reference calculations. **Cost:** engineering only initially.

**Acceptance:** reviewed removal list with evidence per candidate, clean Linux
and Windows builds, full relevant CI, fixture parity and recoverable rollback;
no removed feature, historical filing or user record.

## Approval decision requested

Approve the Phase 1 **scope and gates**, then separately approve any concrete
production deployment/cache/role change once staging evidence and rollback are
reviewable. Decide whether E01's narrow privilege remediation should be the first
approved security change. Until then, implementation remains stopped.
