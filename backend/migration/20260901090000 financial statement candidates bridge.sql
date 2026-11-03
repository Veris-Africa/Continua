-- ═══════════════════════════════════════════════════════════════════════
-- Financial statement candidates — the bridge from continua-scraper's
-- detected financial tables (scraping.extractions.tables) into `market`,
-- as a REVIEW QUEUE rather than a direct write into income_statements /
-- balance_sheets / cash_flow_statements.
--
-- Why not write straight into the structured tables like the price/
-- fundamentals ingestion pipelines do: scraper/src/extraction/tableExtract.ts
-- deliberately only produces "label + numeric column values" per row — it
-- does NOT (and, from plain extracted text alone, safely cannot) determine
-- which column is the current vs. prior period, what currency/units apply,
-- or which canonical line item a label like "Profit for the year" maps to.
-- market.income_statements requires confirmed, non-null figures for a
-- specific fiscal period — guessing any of the above and writing it
-- straight in would put silently-wrong numbers in front of people making
-- investment decisions. So instead: stage it here, exactly as detected,
-- with full provenance, and let a human confirm the mapping (see
-- scripts/confirmFinancialStatementCandidate.ts) before anything lands in
-- the real statement tables. Same philosophy as the company_announcements
-- bridge migration — never fabricate, always flag.
--
-- Run this manually in the Supabase SQL Editor, same as every other
-- Continua migration.
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS market.financial_statement_candidates (
  id                     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Resolved entity — NULL when entity resolution couldn't confidently
  -- match the source's raw company name. Never guessed; same
  -- resolveCompanyEntity() used by the announcements bridge.
  company_id             text REFERENCES market.companies(id),
  security_id            text REFERENCES market.securities(id),
  raw_company_name       text,

  source                 text NOT NULL,          -- 'nse', matches scraping.sources.id
  exchange               text NOT NULL,
  document_url           text NOT NULL,
  document_title         text,

  -- Exactly what tableExtract.ts detected, untouched — table_index lets a
  -- single extraction with multiple detected tables (e.g. income statement
  -- AND balance sheet on the same PDF) produce more than one candidate row.
  table_index            int NOT NULL DEFAULT 0,
  detected_table         jsonb NOT NULL,          -- { title, headerLine, rows, method, confidence }
  detection_confidence   numeric,

  -- Traceability back to the scraper's own records (§16 pattern — "where
  -- did this come from"). Cross-schema FK within the same Postgres instance.
  scraped_artifact_id    bigint REFERENCES scraping.raw_artifacts(id),
  scraped_extraction_id  bigint REFERENCES scraping.extractions(id),

  -- Review workflow. Always starts 'pending' — this table holds guesses
  -- about structure, not facts, until a human says otherwise.
  status                 text NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'confirmed', 'rejected')),
  reviewed_at            timestamptz,
  reviewed_note          text,
  -- Set once a human confirms this candidate and it's written into the
  -- real statement tables — the audit trail from raw scrape to live figure.
  resulting_period_id    text REFERENCES market.financial_periods(id),

  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),

  UNIQUE (scraped_extraction_id, table_index)
);

CREATE INDEX IF NOT EXISTS idx_fin_candidates_pending ON market.financial_statement_candidates(status, created_at DESC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_fin_candidates_security ON market.financial_statement_candidates(security_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fin_candidates_unresolved ON market.financial_statement_candidates(company_id) WHERE company_id IS NULL;

-- Extend the ingestion_logs / dead_letters dataset CHECKs (same pattern as
-- "fix dataset check constraints.sql") to cover this bridge's own logging,
-- kept distinct from 'financials' so bridge runs are never confused with
-- the real fundamentals ingestion pipeline's runs in ops dashboards.
ALTER TABLE market.ingestion_logs DROP CONSTRAINT IF EXISTS ingestion_logs_dataset_check;
ALTER TABLE market.ingestion_logs ADD CONSTRAINT ingestion_logs_dataset_check
  CHECK (dataset IN ('price','candle','company','financials','corporate_action','earnings','ownership','index','announcement','financial_statement_candidate'));

ALTER TABLE market.dead_letters DROP CONSTRAINT IF EXISTS dead_letters_dataset_check;
ALTER TABLE market.dead_letters ADD CONSTRAINT dead_letters_dataset_check
  CHECK (dataset IN ('price','candle','financials','corporate_action','earnings','ownership','index','announcement','financial_statement_candidate'));