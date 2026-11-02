# Continua engineering risk register

2 November 2026, source `ff99c35`. Status: **open recommendations pending approval**;
no remediation was performed by this audit. Impact/likelihood are qualitative
engineering judgments, not measured incident probabilities. No Critical/P0 exploit
has been demonstrated. Evidence limitations are part of each risk.

The finding IDs link to the authoritative detailed record in
[CONTINUA_AUDIT.md](CONTINUA_AUDIT.md). Each detailed record supplies relevant
paths, evidence, current implementation, impact, correction, complexity,
security/compatibility risks, cost and verification. This register adds proposed
accountable disciplines, dependencies and closure conditions; it does not assign
work to an actual individual or authorize a production change.

| ID | Severity / priority | Existing status / evidence | Impact and likelihood judgment | Proposed accountable discipline | Treatment, dependency and closure |
|---|---|---|---|---|---|
| [E01](CONTINUA_AUDIT.md#e01--excess-database-authority) | High / P1 | Live catalog confirms profile TRUNCATE/TRIGGER/REFERENCES for browser roles; current HTTP SQL allowlist limits reachability | High blast radius; exploit precondition not demonstrated | Database + application security | Reviewed least-privilege ACL; staging CRUD/trigger/billing pass and administrative denial; before expanded SQL/roles |
| [E02](CONTINUA_AUDIT.md#e02--release-and-configuration-drift) | High / P1 | Render `8a5b350`, repository/Cloudflare `ff99c35` | Confirmed drift; improvement claims unreliable | Release/SRE | Approved compatible deploy with recorded SHA/config and canaries; do not close from Git push alone |
| [E03](CONTINUA_AUDIT.md#e03--shared-caching-and-transfer-sustainability-are-not-established) | High / P1 | Live memory cache; prior transfer exhaustion; Upstash adapter exists | Recurrence plausible; steady-state growth unmeasured | API + database/SRE | Verify existing cache allowance, safe configuration and 24–72-hour byte slope; E02/E08 first, paid changes separately approved |
| [E04](CONTINUA_AUDIT.md#e04--watchlist-concurrency-and-relational-ownership) | High / P1 | Default insert/count race in source; live no default unique index, separate folder/user FKs | Concurrent inconsistent states plausible; actual duplicate prevalence unknown | Database + account-data API | Per-owner transaction/invariant, safe existing-data assessment and cross-owner tests; no deletion-based repair |
| [E05](CONTINUA_AUDIT.md#e05--payment-webhook-lifecycle-and-durable-intake) | High / P1 | Signed success verification and atomic fulfillment present; general durable intake/lifecycle handling absent in inspected path | Delayed/unobserved billing state plausible; no double-credit incident established | Payments + SRE | Durable signed event classification/reconciliation; callback/replay/timeout fixtures; event effects require approved policy |
| [E06](CONTINUA_AUDIT.md#e06--safe-renewal-ambiguity-lacks-a-bounded-resolution-workflow) | High / P1 | Durable reference/no ambiguous charge retry; resolution age/state workflow not evident; live enablement unverified | Stuck renewals possible if enabled; blind retry would increase risk | Payments operations | Approved state machine, safe verification deadline/operator queue, crash/cancel tests; never repeat unknown POST |
| [E07](CONTINUA_AUDIT.md#e07--auth-unavailability-can-masquerade-as-session-invalidity) | High / P1 | Broad verifier catches return 401 | Misleading logout/login loops during dependency outages plausible | Identity/API | Typed unavailable versus revoked errors; access denied in both cases; provider/SQL fault and frontend recovery tests |
| [E08](CONTINUA_AUDIT.md#e08--partial-observability-no-demonstrated-end-to-end-slo-baseline) | High / P1 | Partial query metrics, uncorrelated logs, routes before logger, Actions alerts only | Slow detection/attribution confirmed as a capability gap | SRE + frontend/API | Safe correlated route/pool/job coverage, actionable age/quota/deploy alerts and redaction/overhead tests; no DB telemetry loop |
| [E09](CONTINUA_AUDIT.md#e09--recovery-proof-and-release-compatibility-are-incomplete) | High / P1 | Real disposable restore fixture exists; current production rehearsal/RPO/RTO unverified | High impact if recovery needed; probability unknown | Database + release/SRE | Approved isolated restore and compatibility/write-reconciliation proof; mandatory before destructive migration/cutover |
| [E10](CONTINUA_AUDIT.md#e10--remaining-expensive-reads-and-non-durable-request-jobs) | Medium / P2 | Bounds/caches exist, but per-holding queries, post-fetch response cap and in-memory jobs remain | Load-dependent latency/egress likely; ranking by real traffic missing | API + Engine/data pipeline | Measure then batch/select/paginate and make only justified jobs durable; full history/math/rights and resource tests |
| [E11](CONTINUA_AUDIT.md#e11--mutation-idempotency-and-stale-edit-contracts-differ) | Medium / P2 | Several SQL uniques/locks present; no expected-version holdings edit or hosted-checkout intent reuse | Stale edits/duplicate creates plausible; no duplicate financial charge proven | Product-data + payments API | Domain-specific intent/version contracts and parallel/lost-response tests; do not dedup valid distinct actions |
| [E12](CONTINUA_AUDIT.md#e12--prompt-injection-residuals-and-paid-ai-activation-boundary) | Medium / P2 | Structured instructions/schema/citation/budget controls; no provider tools; live paid activation unverified | Answer contamination/accidental key-driven activation conditional on use | AI/security + privacy | Keep paid off; explicit enable approval, minimized context, adversarial/semantic/cross-user tests; no paid evaluator without approval |
| [E13](CONTINUA_AUDIT.md#e13--frontend-performance-is-partly-implemented-not-measured-in-the-field) | Medium / P2 | Many optimisations present; no current field/slow-device baseline | Impact likely device/scenario dependent; severity cannot be inferred from chunk bytes alone | Frontend/performance | Execute privacy-safe scenario matrix, then profile-driven improvements; compare same data/device and preserve accessibility |
| [E14](CONTINUA_AUDIT.md#e14--historical-layers-and-dependency-ownership-need-an-explicit-ledger) | Medium / P2 | Legacy comments, multiple workspaces/candidates, recent fixture API drift; non-high advisories | Operational mistakes/regressions plausible | Architecture/release + maintainers | Reachability/role ledger, clean installs/advisory triage, proof before deletion; no blanket rewrite or lowered gates |
| [E15](CONTINUA_AUDIT.md#e15--managed-auth-capability-limits-must-remain-explicit) | Medium / P2 | Managed MFA/email-change explicitly unavailable; email/live-session verification present | False assurance/support mismatch possible, not a bypass finding | Identity/product/security | Capability matrix and supported-provider plan; recent-auth tests; no reset/provider switch or fabricated AAL2 |
| [E16](CONTINUA_AUDIT.md#e16--numericdomain-contracts-require-evidence-before-schema-changes) | Medium / P2 | Positive DB values; zero-cost UI mismatch; market JS numeric parsers versus identity strings | Boundary/domain inconsistency; no measured rounding incident | Financial domain + database/API | Approved units/bounds/zero/share contracts and numeric boundary/parity fixtures before conversions |

## Complexity, cost and compatibility decision summary

| Work | Effort band | Cost posture | Compatibility gate |
|---|---|---|---|
| E01/E02/E07 | S–M to M | Existing infrastructure | Real role/API/identity/payment behaviors remain intact |
| E03/E04/E10/E11 | M–L | Existing SQL/Redis/CI first; any allowance upgrade separate | Existing data assessment, owner/rights correctness, same financial coverage |
| E05/E06 | M–L/L | Existing durable storage first; no live charges in tests | Atomic fulfillment and no ambiguous-charge retry; approved lifecycle policy |
| E08/E09 | M–L | Existing logs/fixtures/retention first; paid tools not assumed | Redaction/overhead limits; recovery preserves post-release writes |
| E12/E15 | S documentation, M tests/design; provider work unknown | No paid activation from audit | Honest capability/assurance, context minimisation and account-safe recovery |
| E13/E14/E16 | M–L | Local profiling/engineering first | Same behavior, numerical outputs and recoverable cleanup decisions |

## Explicit unknowns and required future evidence

* Actual duplicate defaults, cross-owner links and latest quota trigger body:
  metadata/source establishes risk, not prevalence. Assess with bounded,
  approved diagnostics before constraints or data repair.
* Comprehensive production RLS/SECURITY DEFINER/ACL and index inventory beyond
  sampled metadata; do not generalize the six confirmed profile grants to every table.
* Backend liveness timeout cause; a single request is not an outage probability.
  Check provider events/cold starts and authenticated paths under an approved plan.
* Deployed paid-AI, native payment/renewal flags, actual Paystack lifecycle
  subscriptions and provider delivery history; no secrets or charges inspected.
* Representative post-release monthly egress, API p95/p99, memory/pool waits,
  slow-device vitals and actual geographic network paths.
* Recovery retention, backup usability, RPO/RTO and a safe post-write rollback plan.

No risk is closed merely by adding a document, installing an adapter, passing a
unit test or resetting a monthly allowance. Closure needs the listed evidence and
appropriate approval. Stop here for approval before beginning Phase 1.
