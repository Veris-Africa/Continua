-- ═══════════════════════════════════════════════════════════════════════
-- Fix: market.ingestion_logs.dataset CHECK constraint didn't include
-- 'announcement' — the TypeScript IngestionRecord.dataset union was
-- updated for the announcements bridge, but the actual database
-- constraint wasn't, so every bridge run's final log insert failed with
-- a 23514 check-violation even though the actual announcement upserts
-- (which happen earlier, in separate queries) succeeded fine.
--
-- Note: 'index' is also missing from this constraint despite being in
-- the TypeScript union — pre-existing gap, left alone here since it's
-- unrelated to the announcements bridge and this migration should do one
-- thing. Worth a separate fix if that pipeline ever actually logs with
-- dataset='index'.
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE market.ingestion_logs DROP CONSTRAINT IF EXISTS ingestion_logs_dataset_check;

ALTER TABLE market.ingestion_logs ADD CONSTRAINT ingestion_logs_dataset_check
  CHECK (dataset IN ('price','candle','company','financials','corporate_action','earnings','ownership','announcement'));