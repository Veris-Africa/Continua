-- Additive payment-initialization recovery metadata only. Separate production approval.
BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='10s';
ALTER TABLE public.paystack_live_orders
 ADD COLUMN IF NOT EXISTS initialization_request_hash text,
 ADD COLUMN IF NOT EXISTS initialization_state text CHECK(initialization_state IN ('initializing','initialized','unknown')),
 ADD COLUMN IF NOT EXISTS authorization_url text,
 ADD COLUMN IF NOT EXISTS checkout_access_code text;
-- Existing order/payment/receipt/subscription rows are not rewritten.
COMMIT;
