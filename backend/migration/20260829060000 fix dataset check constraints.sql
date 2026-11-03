-- ═══════════════════════════════════════════════════════════════════════
-- Fix: neither market.ingestion_logs.dataset nor market.dead_letters.dataset
-- CHECK constraints included 'announcement' — the TypeScript unions
-- (IngestionRecord.dataset, DeadLetterRecord.dataset) were updated for the
-- announcements bridge, but the actual database constraints weren't.
--
-- IMPORTANT: this migration was written against the constraints' state
-- AFTER "032 mansa integration followthrough.sql" already added 'index'
-- to both — an earlier version of this migration was written against the
-- original 030_market_schema.sql definitions and would have silently
-- DROPPED 'index' as a side effect of the DROP+ADD CONSTRAINT pattern.
-- Always grep the full migration history for a table before altering a
-- constraint on it, not just the table's original CREATE.
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE market.ingestion_logs DROP CONSTRAINT IF EXISTS ingestion_logs_dataset_check;
ALTER TABLE market.ingestion_logs ADD CONSTRAINT ingestion_logs_dataset_check
  CHECK (dataset IN ('price','candle','company','financials','corporate_action','earnings','ownership','index','announcement'));

ALTER TABLE market.dead_letters DROP CONSTRAINT IF EXISTS dead_letters_dataset_check;
ALTER TABLE market.dead_letters ADD CONSTRAINT dead_letters_dataset_check
  CHECK (dataset IN ('price','candle','financials','corporate_action','earnings','ownership','index','announcement'));