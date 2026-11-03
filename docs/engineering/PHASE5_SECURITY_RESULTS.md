# Security verification

Phase 5 is local only. No production schema, policies, accounts, portfolios, watchlists, subscriptions, payment events, provider settings or environment variables were changed. No real charge, password reset, account creation or production mutation test ran.

- Existing cookie-based managed identity transport and backend session/SQL authorization are retained. JWTs stay in memory. No auth bypass or new issuer.
- MFA and device lock still gate private children. Skeletons contain no cached financial/account information.
- Account, following, follow-list and follow-count query keys include the current viewer. Existing sign-out cancellation/removal and private snapshot cleanup remain. Published research is still the only generally persisted QueryClient data.
- Follow mutations wait for known state, do not publish failed writes and serialize duplicate owner/target actions. Cross-tab messages contain only invalidation scope, not private rows or credentials.
- OAuth/recovery one-use exchanges, sign-out, charges and other mutations are not replayed by session recovery. HTTP 401/403 do not receive transient retry treatment. Session-service failures do not assert a free plan or logout.
- Local performance server has synthetic identities only, binds loopback, denies mutations by default and has no provider forwarding or credentials. Optional populated mode allows only in-memory synthetic follow writes and rewrites served market API origins to loopback; this tooling is never deployed. Its synthetic JWT is not accepted by production. It is tooling outside the shipped app assets.
- Public-cache allowlist, backend rights, financial outputs and chart missing-data behavior were not expanded or weakened.

Automated frontend tests and production artifact audits are recorded in `PHASE5_PERFORMANCE_RESULTS.md`. No alerts were dismissed, security checks disabled, permission changes applied or paid features enabled. Full populated-browser cross-account and two-tab mutation evidence is not yet available; keep production deployment gated on it.
