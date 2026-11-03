# Phase 7 authentication reliability

Symptom: reconnect screen and repeated retries. Verified code-path cause: expiry plus transient provider failure could be treated like loss of identity and cause repeated refresh attempts. Files: identityClient.js, useAuth.tsx, browserClient.ts, sessionWarmup.js, bootstrap.js; tests phase7Reliability.test.ts and existing identity suites.

## Fix

Keep a valid unexpired server-issued session through transient refresh failure. Expired sessions do not authorize private UI: SESSION_UNAVAILABLE hides user/session availability while preserving recoverable broker ownership. Real 401/revocation, sign-out and owner switch retain private cache cancellation/clearing. Automatic retries share in-flight work and a 10-second increasing cooldown capped at 60 seconds. Explicit restore can retry. Online/visible recovery is bounded to 15 seconds. Initial bootstrap and AuthProvider consume one verification promise. One-use OAuth/recovery callbacks never warm speculatively. No credentials or authorization decision are persisted by the warmup.

## Verification

205 frontend tests pass, including 20 concurrent expired reads producing one failed refresh, cooldown suppression, subsequent recovery, unavailable without SIGNED_OUT, and existing revoked/cross-tab/security contracts. Bootstrap test proves one consumed result and callback exclusion. Backend tests retain session guard and fail-closed 503; Worker security tests pass. Sandbox synthetic login works through the actual production bundle. No production sign-out, account reset or provider setting change was tested.

## Limitations / release

Real network loss and managed-provider failure on an existing production identity have not been induced. Actual revocation still requires fresh server checks. These changes reduce duplicate verification attempts, not eliminate backend authentication or safely bypass provider outages. Release only after backend/frontend compatibility and session smoke tests; no auth-provider switch is involved.

## Validation and release boundary

Candidate branch: codex/phase7-performance-reliability, based on production main 7fd6f34ab543012eec18fd2cd7eb5d244570534d. Phase 7 is local only. No production SQL, schedule, environment, payment or customer mutation was performed. Interactive acceptance uses only the sandbox/in-app browser, as requested. Synthetic account actions never reach production.

See PHASE7_SECURITY_RESULTS.md for executed checks and PHASE7_DEPLOYMENT_PLAN.md for remaining release gates. Performance figures distinguish baseline, intermediate candidate and final bootstrap; no unmeasured final speedup or production bandwidth reduction is claimed.
