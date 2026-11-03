# Phase 2 implementation

Status: local codex/phase2-security-integrity, based on deployed main eaf268c. No Phase 2 push, deployment, production DDL, grants, payment or paid AI activation has occurred. The compatibility Node API remains deployed; this is not the native-runtime cutover.

| Finding | Implemented application changes | Separate database work |
| --- | --- | --- |
| E01 | Explicit browser DML snapshot; reviewed administrative revoke and SECURITY DEFINER hardening; role inventory and access matrix | phase2-application-privileges.sql; requires fresh ACL capture/review and approval |
| E04 | Owner transaction lock, atomic default RPC, fresh-plan quota, cross-owner folder rejection and replay at quota | phase2-watchlist-integrity.sql: default uniqueness, composite ownership FK, trigger and legacy RPC; refuses conflicting existing rows |
| E07 | Typed invalid/revoked 401, forbidden/recent 403 and dependency 503; Retry-After; no session destruction on transient failure | None |
| E11 | Pending row UUID intents for holding/folder/post creates; replay compares supplied fields and owner; holding updated_at CAS; ambiguous post response retains media | Optional gated hosted-checkout ledger columns in phase2-hosted-checkout-intents.sql |
| E12 | Paid-AI flag masks key by default; owner-stamped evidence, bounded source IDs, safe citation URLs/plain text output; adversarial offline tests | None; paid AI remains off |
| E15 | Shared honest managed capability object and API; frontend factors carry capabilities; unsupported MFA/email-change operations stay explicit | None; no provider/account changes |
| E16 | Shared whole-share/positive KES cent input contract; exact BigInt input/weighted-cost arithmetic and SQL rounding parity | No numeric type, existing record or Engine calculation changes |

Core source: backend/src/auth/authErrors.js, managedVerifier.js, verifyAccess.js, api/middleware/requireSubscriber.js; data/watchlistIntegrity.js, mutationIntegrity.js, holdingContract.js, browserData.js and bridges; services/paystackLive.js and hostedCheckoutIntent.js; services/research/engineAssistant.js and config/paidAi.js. React hooks usePortfolio/useWatchlist/usePosts and lib/mutationIntent/postSubmission carry the matching client behavior. AddInvestmentDialog uses the shared holding contract.

Mutation intents are acknowledged-action based, not content deduplication: a confirmed second identical action gets a new UUID. Pending intent lifetime is the mounted hook/composer; a browser reload does not retain it. Replay uses current row fields rather than a permanent receipt/tombstone. This narrows, but does not eliminate, all possible multi-device/reload duplication. Reactions already use owner/post uniqueness and upsert; provisioning remains transactional ON CONFLICT. Existing payment verification and atomic fulfillment are preserved.

Hosted checkout is staged behind PAYSTACK_CHECKOUT_INTENTS_ENABLED=false. When enabled after its DDL, owner+intent determines the reference; a persisted claim precedes the single provider initialization POST. Uncertain responses return a recoverable reference and never repeat that POST automatically. The currently used native checkout flow is unchanged. A modern hosted API client must retain/reuse intentId; no current hosted UI caller was found.

Paid Engine responses are validated as structured plain text and citation IDs must exist in the supplied bounded evidence. This does not prove semantic grounding or defeat all prompt injection. No autonomous tool was added and no model was called. Existing computed research and financial formulas are unchanged.

JavaScript, PostgreSQL and the existing React stack were selected to fit the compatibility API and 512MB budget without another service/runtime. Rationale is recorded in docs/architecture/FEATURE_LANGUAGE_DECISIONS.json. Primary references: [Node errors](https://nodejs.org/api/errors.html), [PostgreSQL locking](https://www.postgresql.org/docs/current/explicit-locking.html), [constraints](https://www.postgresql.org/docs/current/ddl-constraints.html), [OpenAI safety](https://developers.openai.com/api/docs/guides/safety-best-practices) and [structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs). Skills used for the offline AI review did not authorize paid activation.

Route boundaries and remaining policy decisions are maintained in PHASE2_ROUTE_SECURITY_MATRIX.md; CI checks inventory drift. The matrix is a review aid, not a replacement for behavior tests.
