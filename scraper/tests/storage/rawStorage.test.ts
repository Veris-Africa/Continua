import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

process.env.DATABASE_URL ??= "postgres://user:pass@localhost:5432/continua_test";
process.env.LOG_LEVEL ??= "fatal";

let tmpDir: string;

beforeAll(async () => {
  tmpDir = await mkdtemp(path.join(tmpdir(), "scraper-storage-test-"));
  process.env.RAW_STORAGE_LOCAL_PATH = tmpDir;
});

afterAll(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

describe("storeRawArtifact + readRawArtifact round-trip", () => {
  it("writes and reads back the exact same bytes", async () => {
    const { storeRawArtifact, readRawArtifact } = await import("../../src/storage/rawStorage.js");
    const original = Buffer.from("test content for round-trip verification", "utf-8");

    const storagePath = await storeRawArtifact({
      sourceId: "test-source",
      sha256: "abc123",
      contentType: "text/plain",
      body: original,
    });

    const readBack = await readRawArtifact(storagePath);
    expect(readBack.equals(original)).toBe(true);
  });
});