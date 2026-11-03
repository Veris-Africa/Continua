# Security alert remediation — 3 November 2026

GitHub's read-only API confirmed CodeQL alerts 24 and 31–36, all js/missing-rate-limiting, and Dependabot 144/145. No alerts were dismissed, query suites excluded or security checks weakened.

The owned function router previously authenticated before its owner limiter. A new bounded IP admission limiter now precedes verification, using the existing trusted-edge IP contract and shared/fail-closed store selection. The authenticated owner limiter is retained. The full server already has pre-authentication admission, but the router is now safe when independently mounted. A synthetic loopback test sends 121 invalid-token requests: 120 verification calls, then 429 without a provider/database call.

Six scanner findings concerned local-only test harnesses that intentionally mounted individual handlers without full-server admission. Those harnesses now install express-rate-limit before their handlers; existing HMAC, persistence, parser, ownership and failure assertions remain intact. No test was removed or skipped to resolve a finding.

Every locked minimatch instance is now official 11.0.4, including the nested typescript-estree instance. npm retained stale nested entries during normal resolution despite root overrides; those entries were repaired to the same official resolved URL/integrity/dependencies already pinned at root. A clean npm ci passed. Explicit parent overrides and the dependency-floor check prevent silent regression. This is not an advisory dismissal or manifest-only change.

The official deepmerge advisory reports no patched release. html-to-text was upgraded via a narrow override to official 10.0.1, which uses deepmerge-ts and removes deepmerge. The affected chain is Neon Auth SDK -> Auth UI -> React Email -> html-to-text, not Continua's password/session storage. Real React Email HTML/plaintext rendering and a hostile option-key regression passed, together with managed Auth and all backend tests. No provider or credentials were changed.

Validation: backend 637 passed / 18 existing skips; frontend 191 passed; production build, Worker 41, backend build/typecheck and issuer/artifact checks passed. Both complete npm audits report zero vulnerabilities after clean installs. Existing peer/deprecation warnings remain compatibility maintenance items, not suppressed vulnerabilities. CodeQL closure must be confirmed after the new main analysis; local passing tests alone do not close GitHub alerts.

No production SQL, payment activation, account modification, new service or Phase 4 instrumentation is included. Roll back code independently of customer records; preserve the dependency repairs where possible rather than restoring vulnerable packages.

Sources: [minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249), [deepmerge advisory](https://github.com/advisories/GHSA-gcqx-w48m-w2h4). Existing JavaScript/Express middleware and npm constraints fit this narrow correction; no new runtime or language migration is justified.
