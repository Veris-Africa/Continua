import { useQuery } from "@tanstack/react-query";
import { corporateActionsApi } from "@/api/corporateActionsApi";
import { isNotFound } from "@/api/client";
import type { CorporateAction } from "@/api/types";

/** All corporate actions (dividends, splits, bonus/rights issues, buybacks,
 *  mergers, acquisitions, suspensions, halts) for a symbol, from the Data
 *  Layer's `GET /corporate-actions/:symbol` (see docs/api/API.md). Returns
 *  `actions: []` — not an error — when the symbol has none on record yet,
 *  same convention as useDividendHistory. */
export function useCorporateActions(symbol: string | undefined) {
  const query = useQuery({
    queryKey: ["continua", "corporate-actions", symbol],
    queryFn: () => corporateActionsApi.getForSymbol(symbol as string),
    enabled: !!symbol,
    staleTime: 5 * 60_000,
    retry: (count, err) => !isNotFound(err) && count < 1,
  });

  return {
    actions: (query.data ?? []) as CorporateAction[],
    isLoading: query.isLoading,
    isNotCovered: isNotFound(query.error),
  };
}