import { describe, expect, it } from "vitest";
import { extractTablesFromText } from "../../src/extraction/tableExtract.js";

describe("extractTablesFromText", () => {
  it("extracts a simple financial table with correct labels and values", () => {
    const text = [
      "SUMMARY CONSOLIDATED STATEMENT OF PROFIT OR",
      "LOSS",
      "Item 2025 (KES 000) 2024 (KES 000)",
      "Revenue 359,433 340,120",
      "Cost of sales (101,216) (95,400)",
      "Gross profit 258,217 244,720",
    ].join("\n");

    const tables = extractTablesFromText(text);
    expect(tables).toHaveLength(1);
    expect(tables[0]!.rows).toEqual([
      { label: "Revenue", values: ["359,433", "340,120"] },
      { label: "Cost of sales", values: ["(101,216)", "(95,400)"] },
      { label: "Gross profit", values: ["258,217", "244,720"] },
    ]);
  });

  it("captures the header line as raw text, not split into per-column headers", () => {
    const text = ["Item 2025 (KES 000) 2024 (KES 000)", "Revenue 359,433 340,120", "Cost of sales (101,216) (95,400)"].join(
      "\n",
    );
    const tables = extractTablesFromText(text);
    expect(tables[0]!.headerLine).toBe("Item 2025 (KES 000) 2024 (KES 000)");
  });

  it("does not misclassify a header row (ending in a unit label) as a data row", () => {
    // "000)" alone would match the numeric-token pattern if the header
    // row weren't explicitly excluded — regression test for that bug.
    const text = ["Item 2025 (KES 000) 2024 (KES 000)", "Revenue 359,433 340,120", "Cost of sales (101,216) (95,400)"].join(
      "\n",
    );
    const tables = extractTablesFromText(text);
    expect(tables[0]!.rows.some((r) => r.label.includes("Item"))).toBe(false);
  });

  it("returns no tables for plain prose with an incidental number", () => {
    const text =
      "The company reported strong performance in 2025. Revenue grew by 12 percent compared to the prior year.";
    expect(extractTablesFromText(text)).toEqual([]);
  });

  it("does not count a single row as a table", () => {
    expect(extractTablesFromText("Total assets 1,234,567")).toEqual([]);
  });

  it("separates two tables divided by narrative text", () => {
    const text = [
      "BALANCE SHEET",
      "Cash 50,000 45,000",
      "Receivables 20,000 18,000",
      "",
      "Some narrative paragraph explaining performance in detail.",
      "",
      "INCOME STATEMENT",
      "Revenue 359,433 340,120",
      "Cost of sales (101,216) (95,400)",
    ].join("\n");

    const tables = extractTablesFromText(text);
    expect(tables).toHaveLength(2);
    expect(tables[0]!.title).toBe("BALANCE SHEET");
    expect(tables[1]!.title).toBe("INCOME STATEMENT");
  });
});