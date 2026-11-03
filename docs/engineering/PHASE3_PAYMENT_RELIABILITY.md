# Phase 3 payment reliability

The integration supports gated live/test native M-PESA, Airtel and hosted card checkout plus optional authorization-based card renewal. It does not currently use Paystack's Subscriptions product as the authority for Continua memberships. Source capability is not proof a production mode/mandate is enabled; activation must inspect non-secret configuration without exposing keys.

## Durable event intake (E05)

The existing 64KB raw-body route and HMAC-SHA512 check remain before parsing and API-key middleware. Signature mode and reference/domain must agree. Invalid signatures/mode mixing fail before SQL. A valid event is normalized to event type, provider object ID when usable, strict Continua reference, mode and a SHA-256 semantic fingerprint. No customer email, phone, authorization code, card data, original body or arbitrary metadata is stored.

The private SQL inbox records UUID, kind, first/last receive, delivery count, status, attempt/next retry, lease token/deadline, safe category and completion time. Atomic INSERT/unique-conflict recognition must return a receipt before HTTP 200. SQL failure returns 503; a lost HTTP response causes safe duplicate delivery. Acknowledgement covers durable acceptance, not completed fulfillment. Delivery and execution can occur multiple times.

| Provider event | Classification / action |
| --- | --- |
| charge.success | Actionable when mode/reference are valid; independently verify the stored checkout and provider transaction before existing atomic fulfillment |
| invoice.create, invoice.update, subscription.create, subscription.expiring_cards | Informational; no membership change |
| invoice.payment_failed, subscription.disable, subscription.not_renew | Operator/policy review; no newly invented cancellation or revocation rule |
| refund.failed/pending/processed/processing; charge.dispute.create/remind/resolve | Operator/policy review; preserve existing paid term until an approved policy decision |
| transfer.failed/success/reversed; customeridentification and dedicatedaccount assignment outcomes; paymentrequest.pending/success | Explicitly ignored by this checkout integration; durable bounded receipt retained |
| Foreign/missing Continua reference, unknown event (including undocumented charge.failed/charge.reversed) | Review; never grant access from its name |

Event names and signature format were checked against [Paystack's official list](https://paystack.com/docs/payments/webhooks/). A reversed payout is not assumed to be a reversed customer payment. Incoming event order never overrides independently verified transaction state.

## Recovery state machine (E06)

Operational states are pending -> processing with a 180-second lease -> completed, retry or review. Expired leases are reclaimable with a new UUID; old completion updates cannot win. Verification uses at most 12 attempts within 48 hours, jittered exponential delays starting around one minute and capped at six hours. Exhausted or conflicting work enters review and remains visible. Review is not proof of payment failure and does not release an uncertain native payment's active lock.

The financial state remains in existing paystack_native_attempts and order/receipt tables. Renewal reservation writes the attempt, order, mandate active_reference and its recovery work in one transaction. Only the reservation winner may initiate the provider POST. Crash before commit rolls back all of it; crash after commit preserves the reference and later callers only verify it. A provider timeout is not treated as a failed charge. Known older non-renewal attempts/orders also acquire bounded GET-only recovery when webhook/callback delivery was lost.

Cancellation that wins the final locked pre-initiation check prevents that sole initiation owner from calling Paystack; its known-unsubmitted attempt is abandoned and operational work cancelled. Cancellation after initiation has been handed off cannot guarantee a charge is stopped. The original reference is still reconciled and existing fulfillment policy applies. No new refund, proration, dispute-access or cancellation entitlement policy was implemented.

Tests inject reservation rollback, lost commit acknowledgement, uncertain initiation, provider success before a failed local update, persisted work before processing, verified fulfillment before failed acknowledgement, lease expiry, concurrent callback/drainers and cancellation before initiation. They use mocks and equivalent durable crash states, not real customer charges or a production process kill.

Operator recovery: inspect private review counts, then read at most 20 receipt IDs/references in trusted SQL tooling. Verify the original reference against Paystack using existing server verification. Resolve unknown/conflicting outcomes before any new payment action. Never reset native active_reference or resend a charge merely because elapsed time/attempt count is large. Requeue reviewed work only after a separately approved operator decision; no public reset endpoint exists.
