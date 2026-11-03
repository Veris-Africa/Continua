-- ═══════════════════════════════════════════════════════════════════════
-- Continua Data — Mansa integration follow-through
-- ═══════════════════════════════════════════════════════════════════════
-- Three things, all consequences of wiring Mansa (see
-- docs/architecture/MARKET_DATA_ENGINE.md) that the original 030 schema
-- didn't anticipate:
--
--  1. cash_flow_statements.operating_cash_flow was NOT NULL, but Mansa's
--     fundamentals endpoint doesn't provide a cash flow statement at all.
--     financialsRepository.upsertPeriodBundle always inserts one row per
--     period (all four tables together) — dropping NOT NULL here, rather
--     than skipping the insert, keeps that row existing (with nulls) so
--     financialsRepository.getLatestPeriodBundle's INNER JOIN across all
--     four tables keeps returning Mansa-sourced securities instead of
--     silently excluding them.
--  2. market.exchanges only had NSE seeded. ACTIVE_EXCHANGES grew to 7;
--     the reference table needs to match.
--  3. A new market.indices table + 'index' as a valid ingestion_logs
--     dataset, for the new index worker (workers/indexWorker.ts).
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE market.cash_flow_statements ALTER COLUMN operating_cash_flow DROP NOT NULL;

INSERT INTO market.exchanges (code, name, country, currency, timezone, mic) VALUES
  ('NGX', 'Nigerian Exchange', 'Nigeria', 'NGN', 'Africa/Lagos', 'XNSA'),
  ('GSE', 'Ghana Stock Exchange', 'Ghana', 'GHS', 'Africa/Accra', 'XGHA'),
  ('JSE', 'Johannesburg Stock Exchange', 'South Africa', 'ZAR', 'Africa/Johannesburg', 'XJSE'),
  ('LuSE', 'Lusaka Securities Exchange', 'Zambia', 'ZMW', 'Africa/Lusaka', 'XLUS'),
  ('DSE', 'Dar es Salaam Stock Exchange', 'Tanzania', 'TZS', 'Africa/Dar_es_Salaam', 'XDAR'),
  ('BRVM', 'Bourse Régionale des Valeurs Mobilières', 'Côte d''Ivoire', 'XOF', 'Africa/Abidjan', 'XBRV')
ON CONFLICT (code) DO NOTHING;

-- One row per index per exchange, latest value only — same "hot cache
-- row, not a time series" shape as market.live_quotes. Historical index
-- values aren't tracked yet; Mansa's /history endpoint is per-security,
-- not per-index, so index-level history isn't available to backfill from
-- even if this table were extended to hold it (see mansaAdapter.ts).
CREATE TABLE IF NOT EXISTS market.indices (
  id                text PRIMARY KEY,        -- 'NSE:index:NASI'
  code              text NOT NULL,            -- 'NASI', 'NGX30', 'ALSI', ...
  name              text NOT NULL,
  exchange          text NOT NULL,
  value             numeric NOT NULL,
  previous_close    numeric NOT NULL,
  change            numeric NOT NULL,
  change_percent    numeric NOT NULL,
  currency          text NOT NULL,
  event_timestamp   timestamptz NOT NULL,
  source            text NOT NULL,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exchange, code)
);
CREATE INDEX IF NOT EXISTS idx_indices_exchange ON market.indices(exchange);

ALTER TABLE market.ingestion_logs DROP CONSTRAINT IF EXISTS ingestion_logs_dataset_check;
ALTER TABLE market.ingestion_logs ADD CONSTRAINT ingestion_logs_dataset_check
  CHECK (dataset IN ('price','candle','company','financials','corporate_action','earnings','ownership','index'));

ALTER TABLE market.dead_letters DROP CONSTRAINT IF EXISTS dead_letters_dataset_check;
ALTER TABLE market.dead_letters ADD CONSTRAINT dead_letters_dataset_check
  CHECK (dataset IN ('price','candle','financials','corporate_action','earnings','ownership','index'));