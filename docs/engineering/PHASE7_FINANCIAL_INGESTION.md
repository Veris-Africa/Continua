# Phase 7 financial ingestion

## Confirmed status

The pipeline is not globally stopped. Existing authorized news schedule is 17 */8 * * *; document schedule is 43 6,12,20 * * *. Both repository enable flags already true; unchanged. Daily logical transfer allowance 201326592 bytes (192 MiB), unchanged.

News run41672585822 (Nov3 16:17 UTC, pre-Phase6) succeeded: 44 company contexts, 0 pending, no new processed observations, approximately1267665 downloaded/2375760 uploaded bytes, 87.575sec. Document run41655801885 reported GitHub success but receipt budget-paused/daily-reservation-limit with requested50331648-byte allowance and no sources. A green workflow is not publication success. SCOM financial evidence processed Nov3 while history evidence latest Oct23; processed observations do not prove canonical published fundamentals are current. Latest public annual year alone is not evidence of a defect if it is the latest actually published year.

Production read-only probes establish missing market.observed_daily_closes and old canonical SCOM candles. They do not establish authorized redistribution rights for a particular source. Earlier local endpoint license flags were not independently proven production and must not be used as production authorization.

## Local implemented fix

run_health.py writes a runner step summary and redacted notice differentiating budget pause, skip, failed processing and completion without observations. scheduled_collect.py invokes it after the existing JSON receipt. Status is allowlisted; numeric counts strictly bounded; optional summary-write failure cannot change a durably completed job. No URLs, credentials or free-form provider messages enter annotations. Existing exit codes, lease/checkpoint, budgets, source licenses and idempotency remain unchanged. Four targeted tests and full209-pass/6-disposable-DB-skip collector suite passed.

## Exact safe recovery proposal (not executed)

1. Let next already-authorized scheduled run execute on Phase6; read receipt and checkpoint paths, not merely GitHub conclusion.
2. Inspect durable budget reservations and reconcile completed measured settlements using the existing idempotent settle_completed_reservations path. Failed/crashed reservations remain charged/fail-closed; do not reset the daily ledger or raise budget to force freshness.
3. Establish production source permission, publication mapping and per-company last successful publication using bounded reads. Reject unsupported/license-blocked/review-required records.
4. Stage the existing migration backend/migration/20261015110000 native observed daily closes.sql on a disposable branch, verify schema/RLS/index/read-contract tests and source mapping; request explicit approval before production SQL.
5. Propose a bounded documents recovery with source kenyanstocks, history_issuers exact approved IDs (existing maximum12), kind documents, no unrelated fresh/issuer flags. Review the reserved transfer estimate and available allowance first. Explicit approval required before manual recovery/backfill or schedule change. No command was dispatched.
6. Establish a snapshot recorder only from dated known ownership/ledger and source-backed prices. Stage idempotency, owner/RLS and numerical tests; request separate approval. Current holdings are insufficient for historical backfill.
7. Compare canonical per-company publication coverage before/after; rollback writer/activation before readers if needed. Keep previous publications when freshness fails.

No source scraping authorization, provider plan change or paid service was inferred.

## Validation and release boundary

Candidate branch: codex/phase7-performance-reliability, based on production main 7fd6f34ab543012eec18fd2cd7eb5d244570534d. Phase 7 is local only. No production SQL, schedule, environment, payment or customer mutation was performed. Interactive acceptance uses only the sandbox/in-app browser, as requested. Synthetic account actions never reach production.

See PHASE7_SECURITY_RESULTS.md for executed checks and PHASE7_DEPLOYMENT_PLAN.md for remaining release gates. Performance figures distinguish baseline, intermediate candidate and final bootstrap; no unmeasured final speedup or production bandwidth reduction is claimed.
