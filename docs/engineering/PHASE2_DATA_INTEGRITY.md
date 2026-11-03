# Phase 2 data integrity

No production records were changed. Read-only catalog inspection at 19:03:51 UTC on 2 November 2026 found zero duplicate-default owners and zero cross-owner watchlist rows. These are point-in-time aggregates, not permission to skip the preflight before deployment.

Watchlist writes serialize on a transaction-scoped, verified-owner advisory lock before fresh quota reads. Free=1 folder, Premium/Plus=20. Default creation returns an existing default or first existing custom folder; it does not rename, merge, delete or manufacture a second folder for an existing Free account. The separate SQL adds a unique partial default index, unique parent(id,user_id) and composite folder ownership FK. It aborts on conflicts and validates existing relationships; no automatic cleanup exists. Application checks work before this DDL, but direct SQL writers require the database constraints/trigger.

Creates use owner/resource/UUID locks and row reuse. The supplied fields must match the existing row or return 409; matching retries retain selected columns. A new acknowledged action gets a fresh ID. Arrays, arbitrary legacy callers without IDs, browser reloads and deleted-row tombstones are not a durable universal mutation ledger. No content-based deduplication was introduced.

Holding PATCH requires exact row ID and updated_at; one of two concurrent edits wins and the stale edit returns 409. Ownership and creation fields are immutable through the core PATCH API. Existing delete behavior is retained; expected-version filters also trigger conflicts when supplied. Reactions rely on the existing owner/post unique/upsert contract. Provisioning remains transactional and preserves the application owner key.

Post submissions retain both their UUID and uploaded URLs on ambiguous writes. They clean up uploads only before any POST was submitted. This avoids deleting images from a possibly committed post. Definitively rejected submissions can leave unused media: automated receipt-aware garbage collection is a separate reviewed task, not an unsafe rollback cleanup.

Hosted payment initialization is optional and disabled. With the approved DDL and flag, a unique deterministic reference plus request hash is persisted before provider POST. Only its INSERT winner initializes. Changed body/owner/price/policy cannot reuse the key. Unknown state returns 409 and reference for verification/reconciliation, not another charge/init POST. Paid-state replay returns a conflict directing verification. Initialization never grants an entitlement. Existing provider signature verification and atomic fulfillment remain the source of truth. No real payment was made.

## Numeric contract (E16)

| Value | Contract |
| --- | --- |
| Holding average cost | KES; positive NUMERIC(10,2), at most 8 integer digits and 2 fractional digits. API/UI reject zero, negative, null and extra precision to match installed storage. |
| Zero-cost holding | Unsupported by current schema; no existing record rewritten. A gift/zero-cost acquisition model needs explicit future schema/product approval. |
| Shares | Whole integer, 1..2147483647; fractional shares unsupported by current INTEGER schema. |
| Exact input totals | BigInt cents; shares*cost cents must not exceed JS MAX_SAFE_INTEGER. Combining lots also checks summed shares and total before conversion. |
| Weighted average | Integer minor-unit weighted sum, rounded once half-up to stored KES cents; real PostgreSQL NUMERIC round parity tested. This is input aggregation, not an Engine formula change. |
| Missing versus zero | Missing fields stay absent/null where the existing API permits; zero is not substituted for unavailable data. Partial PATCH omissions do not become zero. |
| Returns / percentages | Existing signed loss/return and percent conversion formulas unchanged; canonical financial and native bundle parity retained. No blanket positive-value validator added to research results. |
| NUMERIC / INT8 reads | Existing JS parsers remain. The holding input bound is not a full arbitrary-precision rewrite; very large market data/counts still require a separate precision audit. |

Fixture: infra/security/phase2-postgres-fixture.mjs starts only its labelled loopback PostgreSQL container, uses synthetic owners and the actual prepared SQL/compiler/verifier guards. It tests 16 concurrent default requests, 24 quota requests, 12 post replays, one stale edit winner, cross-owner rejection, narrowed replay projection, quota replay, numeric rounding and mocked hosted-init/real SQL fulfillment replay. Surrounding table definitions are simplified; this is not a full production database restore.
