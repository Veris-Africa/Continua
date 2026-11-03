-- ═══════════════════════════════════════════════════════════════════════
-- Company announcements — the bridge from continua-scraper's `scraping`
-- schema into `market`, so scraped documents actually become visible to
-- the app. This is intentionally a LIGHTWEIGHT table, not an attempt to
-- auto-populate the deeply structured tables (income_statements,
-- corporate_actions, earnings_events) directly from scraped PDFs —
-- reliably classifying a scraped document into "this is a dividend
-- announcement with these exact dates" requires per-document-type
-- parsing this pipeline doesn't do yet. That's future, separate work.
-- What this table gives the app right now: a real, provenance-tracked
-- feed of company announcements/documents, honestly labeled with
-- whatever confidence and entity-resolution state the scraper actually
-- achieved — including "we don't know which company this is" when that's
-- the truth (§12 of the original scraper spec: never fabricate a match).
--
-- Run this manually in the Supabase SQL Editor, same as every other
-- Continua migration.
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS market.company_announcements (
  id                     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Resolved entity — NULL when entity resolution couldn't confidently
  -- match the source's raw company name to a known company/security.
  -- Never guessed; see companyAnnouncementsRepository's resolveEntity().
  company_id             text REFERENCES market.companies(id),
  security_id            text REFERENCES market.securities(id),

  -- What the source actually said, preserved regardless of whether
  -- resolution succeeded — this is what a human reviews to fix an
  -- unresolved match later.
  raw_company_name       text,

  title                  text NOT NULL,
  document_url           text NOT NULL,
  source                 text NOT NULL,          -- 'nse', matches scraping.sources.id
  exchange               text NOT NULL,

  -- Traceability back to the scraper's own records (§16 — "where did
  -- this come from"). Cross-schema FK within the same Postgres instance.
  scraped_artifact_id    bigint REFERENCES scraping.raw_artifacts(id),
  scraped_extraction_id  bigint UNIQUE REFERENCES scraping.extractions(id),

  extraction_confidence  numeric,
  needs_review           boolean NOT NULL DEFAULT false,

  -- Short preview only — full text/tables stay in scraping.extractions;
  -- duplicating megabytes of PDF text across two schemas isn't worth it
  -- when a join gets the full record when actually needed.
  excerpt                text,

  published_at           timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_announcements_company ON market.company_announcements(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_announcements_security ON market.company_announcements(security_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_announcements_unresolved ON market.company_announcements(company_id) WHERE company_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_company_announcements_review ON market.company_announcements(needs_review) WHERE needs_review;