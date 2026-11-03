-- ═══════════════════════════════════════════════════════════════════════
-- Continua Scraper — foundation schema
-- ═══════════════════════════════════════════════════════════════════════
-- Lives in the SAME Postgres instance as the app and Continua Data, in its
-- own `scraping` schema — same pattern as `market`: one project, one
-- connection string, clean boundaries. This backend's migrations never
-- touch `market.*` or `public.*`, and vice versa.
--
-- This schema holds RAW material only: what was crawled, what was
-- downloaded, what was extracted, and where it came from. It does not
-- hold normalized financial data — that's `market.*`, populated by
-- Continua Data's ingestion layer reading FROM these tables, not the
-- reverse. Nothing in here should ever be read directly by the app.
--
-- Run this manually in the Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════

CREATE SCHEMA IF NOT EXISTS scraping;

-- ── Sources ──────────────────────────────────────────────────────────────
-- One row per configured source (NSE, a news site, a central bank, ...).
-- The `config` blob is intentionally loose (jsonb) — different source
-- types need different fields (seeds, allowed_domains, crawl depth,
-- rate limits) and this table shouldn't need a migration every time a new
-- adapter needs one more knob. Compliance/licensing metadata is NOT
-- loose — every source must declare it explicitly (§46 of the spec this
-- was built against).

CREATE TABLE IF NOT EXISTS scraping.sources (
  id                      text PRIMARY KEY,        -- 'nse', 'company-safcom-ir', 'reuters-africa'
  name                    text NOT NULL,
  adapter                 text NOT NULL,            -- which adapter implementation handles this source, e.g. 'nse', 'generic'
  enabled                 boolean NOT NULL DEFAULT true,
  config                  jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Compliance/licensing — required fields, not an afterthought.
  terms_url               text,
  robots_url              text,
  license                 text,
  allowed_usage           text,
  redistribution_allowed  boolean,
  attribution_required    boolean,

  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- ── Crawl state ──────────────────────────────────────────────────────────
-- Persistent per-URL state so crawls are incremental, not "start from
-- zero every run." One row per URL ever seen, per source.

CREATE TABLE IF NOT EXISTS scraping.crawl_state (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_id      text NOT NULL REFERENCES scraping.sources(id),
  url            text NOT NULL,
  canonical_url  text,                     -- after normalization, for dedup across URL variants
  parent_url     text,
  depth          int NOT NULL DEFAULT 0,
  status         text NOT NULL DEFAULT 'discovered'
                   CHECK (status IN ('discovered','queued','crawling','crawled','failed','skipped')),
  mime_type      text,
  http_status    int,
  content_hash   text,                     -- sha256 of the fetched body, for change detection
  first_seen     timestamptz NOT NULL DEFAULT now(),
  last_seen      timestamptz NOT NULL DEFAULT now(),
  last_crawled   timestamptz,
  last_changed   timestamptz,
  error_reason   text,
  UNIQUE (source_id, url)
);
CREATE INDEX IF NOT EXISTS idx_crawl_state_source ON scraping.crawl_state(source_id);
CREATE INDEX IF NOT EXISTS idx_crawl_state_status ON scraping.crawl_state(source_id, status);
CREATE INDEX IF NOT EXISTS idx_crawl_state_canonical ON scraping.crawl_state(canonical_url);

-- ── Raw artifacts ────────────────────────────────────────────────────────
-- One row per distinct downloaded artifact (HTML page, PDF, CSV, image,
-- ...), deduplicated by content hash — the same PDF discovered at three
-- different URLs is one artifact row with one storage_path, not three.
-- This table (plus the migrations below) is what makes "where did this
-- number come from" answerable (§16 of the spec): every artifact keeps
-- the discovery URL, the document URL, and when it was retrieved.

CREATE TABLE IF NOT EXISTS scraping.raw_artifacts (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_id         text NOT NULL REFERENCES scraping.sources(id),
  adapter           text NOT NULL,
  sha256            text NOT NULL,          -- content hash — the true dedup key
  document_url      text NOT NULL,          -- where the bytes were fetched from
  source_url        text,                   -- the page that linked to document_url
  parent_url        text,
  content_type      text,
  size_bytes         bigint,
  storage_path      text NOT NULL,          -- e.g. 'raw/nse/announcements/2026/<sha256>.pdf'
  title             text,
  published_at      timestamptz,
  discovered_at     timestamptz NOT NULL DEFAULT now(),
  retrieved_at      timestamptz NOT NULL DEFAULT now(),
  crawler_version   text NOT NULL,
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb,  -- adapter-specific extras (company name, ticker guess, etc.)
  UNIQUE (source_id, sha256)
);
CREATE INDEX IF NOT EXISTS idx_raw_artifacts_source ON scraping.raw_artifacts(source_id);
CREATE INDEX IF NOT EXISTS idx_raw_artifacts_sha256 ON scraping.raw_artifacts(sha256);
CREATE INDEX IF NOT EXISTS idx_raw_artifacts_published ON scraping.raw_artifacts(published_at);

-- Every URL an artifact has ever been found at — supports "same PDF, three
-- URLs" (§17) without losing any of the discovery history.
CREATE TABLE IF NOT EXISTS scraping.artifact_urls (
  artifact_id  bigint NOT NULL REFERENCES scraping.raw_artifacts(id) ON DELETE CASCADE,
  url          text NOT NULL,
  first_seen   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (artifact_id, url)
);

-- ── Extractions ──────────────────────────────────────────────────────────
-- Output of processing a raw artifact (text/table extraction, OCR, ...).
-- An artifact can be reprocessed by a newer parser version without
-- re-downloading (§45) — that's just a new row here pointing at the same
-- artifact_id.

CREATE TABLE IF NOT EXISTS scraping.extractions (
  id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  artifact_id      bigint NOT NULL REFERENCES scraping.raw_artifacts(id) ON DELETE CASCADE,
  method           text NOT NULL,            -- 'native_pdf_text' | 'ocr' | 'html' | 'table_ocr' | ...
  confidence       numeric,
  parser_version   text NOT NULL,
  text             text,
  tables           jsonb NOT NULL DEFAULT '[]'::jsonb,
  entity           jsonb NOT NULL DEFAULT '{}'::jsonb,   -- company_name/ticker/exchange guesses, unresolved until entity-resolution
  needs_review     boolean NOT NULL DEFAULT false,
  extracted_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_extractions_artifact ON scraping.extractions(artifact_id);
CREATE INDEX IF NOT EXISTS idx_extractions_review ON scraping.extractions(needs_review) WHERE needs_review;

-- ── Dead letters ─────────────────────────────────────────────────────────
-- Anything that failed and exhausted retries. Kept indefinitely with the
-- exact reason — nothing should silently vanish (§21).

CREATE TABLE IF NOT EXISTS scraping.dead_letters (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_id    text REFERENCES scraping.sources(id),
  url          text NOT NULL,
  stage        text NOT NULL,      -- 'fetch' | 'parse' | 'ocr' | 'table_extract' | ...
  reason       text NOT NULL,
  attempts     int NOT NULL DEFAULT 1,
  first_failed timestamptz NOT NULL DEFAULT now(),
  last_failed  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dead_letters_source ON scraping.dead_letters(source_id);