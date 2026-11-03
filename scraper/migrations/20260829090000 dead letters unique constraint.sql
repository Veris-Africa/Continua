-- ═══════════════════════════════════════════════════════════════════════
-- Phase 6: dead_letters needed a unique constraint to support "same
-- URL failing repeatedly at the same stage increments attempts" rather
-- than creating a new row per failure (§21 of the original spec — retry
-- with backoff, then dead-letter with the exact reason, not a growing
-- pile of duplicate rows for one stubborn URL).
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE scraping.dead_letters
  ADD CONSTRAINT dead_letters_source_url_stage_unique UNIQUE (source_id, url, stage);