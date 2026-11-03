import { useQueries } from "@tanstack/react-query";
import { financialsApi } from "@/api/financialsApi";

export interface GrowthFigures {
  earningsGrowthPct: number | null;
  revenueGrowthPct: number | null;
  epsGrowthPct: number | null;
}

function pctChange(latest: number, prior: number): number | null {
  if (prior === 0) return null;
  return ((latest - prior) / Math.abs(prior)) * 100;
}

/** Trailing (not forecast) YoY growth from the two most recent annual
 *  periods on file. Continua doesn't ingest analyst forward estimates, so
 *  unlike Simply Wall St's "Forecast Earnings Growth", this is real,
 *  already-reported growth — labelled as Trailing wherever it's shown. */
export function usePortfolioGrowth(symbols: string[]) {
  const uniqueSymbols = [...new Set(symbols.filter(Boolean).map((s) => s.toUpperCase()))];

  const results = useQueries({
    queries: uniqueSymbols.map((symbol) => ({
      queryKey: ["continua", "financials-history", symbol, "growth"],
      queryFn: () => financialsApi.getHistory(symbol, { periodType: "annual", limit: 2 }),
      staleTime: 60 * 60_000,
      retry: 1,
    })),
  });

  const bySymbol: Record<string, GrowthFigures> = {};
  uniqueSymbols.forEach((symbol, i) => {
    const [latest, prior] = results[i]?.data ?? [];
    bySymbol[symbol] = {
      earningsGrowthPct: latest && prior ? pctChange(latest.netIncome, prior.netIncome) : null,
      revenueGrowthPct: latest && prior ? pctChange(latest.revenue, prior.revenue) : null,
      epsGrowthPct: latest && prior ? pctChange(latest.eps, prior.eps) : null,
    };
  });

  return { growth: bySymbol, isLoading: results.some((r) => r.isLoading) };
}