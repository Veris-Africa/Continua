/**
 * Period helpers for research charts.
 *
 * Moomoo's fundamentals charts show a short, readable window:
 *   • Annual    → last 3 fiscal years
 *   • Quarterly → last 5 quarters
 * These constants are the single source of truth for every bar chart.
 */
export const ANNUAL_PERIODS = 3;
export const QUARTERLY_PERIODS = 5;

export type ChartPeriod = "annual" | "quarterly";

/** Last N annual rows (default 3). */
export function lastAnnual<T>(rows: T[], n = ANNUAL_PERIODS): T[] {
  return rows.slice(-n);
}

/** Last N quarterly rows (default 5). There is no synthetic fallback here
 *  on purpose: quarterly figures must come from real quarterly financial
 *  periods (financialsApi with periodType="quarterly"), never derived by
 *  splitting an annual figure with a guessed seasonal curve. A caller with
 *  no real quarterly rows should not offer the Quarterly toggle at all —
 *  see BarChartBlock's `allowQuarterly` handling. */
export function lastQuarterly<T>(rows: T[], n = QUARTERLY_PERIODS): T[] {
  return rows.slice(-n);
}