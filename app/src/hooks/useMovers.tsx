import { useQuery } from "@tanstack/react-query";
import { moversApi } from "@/api/moversApi";
import { useExchange } from "@/hooks/useExchange";

/** Top gainers/losers, computed server-side by the Data Layer
 *  (`market.live_quotes` ordered by `change_percent` — see
 *  backend/src/services/marketData/moversService.ts) rather than
 *  re-derived client-side from a static list.
 *
 *  `exchange` defaults to the app's globally-selected market (see
 *  hooks/useExchange.tsx). */
export function useMovers(limit = 10, exchange?: string) {
  const { exchange: selectedExchange } = useExchange();
  const activeExchange = exchange ?? selectedExchange;

  const query = useQuery({
    queryKey: ["continua", "movers", activeExchange, limit],
    queryFn: () => moversApi.getTopMovers({ limit, exchange: activeExchange }),
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: 1,
  });

  return {
    gainers: query.data?.gainers ?? [],
    losers: query.data?.losers ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}