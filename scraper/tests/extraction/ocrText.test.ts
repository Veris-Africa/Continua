import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";

process.env.DATABASE_URL ??= "postgres://user:pass@localhost:5432/continua_test";
process.env.LOG_LEVEL ??= "fatal";

const { extractPdfText } = await import("../../src/extraction/pdfText.js");

const FIXTURE_PATH = path.join(import.meta.dirname, "fixtures/scanned-nse-filing.pdf");

describe("OCR fallback (Phase 5)", () => {
  it("falls back to OCR on a real scanned NSE filing that native extraction can't read", async () => {
    const buffer = await readFile(FIXTURE_PATH);
    const result = await extractPdfText(buffer);

    expect(result.method).toBe("ocr");
    expect(result.text).not.toBeNull();
    expect(result.text!.length).toBeGreaterThan(1000);
    // OCR on financial data should always be flagged for review regardless
    // of confidence — see ocrText.ts for why.
    expect(result.needsReview).toBe(true);
    // Sanity check the OCR actually read real content, not garbage —
    // this document's title is clean, unobstructed text that OCR should
    // reliably get right even though the dense table portions won't be.
    expect(result.text).toContain("TotalEnergies");
  }, 30_000); // OCR takes several seconds — default vitest timeout is too short
});