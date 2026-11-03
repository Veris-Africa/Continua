import { useQuery } from "@tanstack/react-query";
import { indicatorsApi, type IndicatorType, type IndicatorParams } from "@/api/indicatorsApi";
import { useExchange } from "@/hooks/useExchange";

/** One technical indicator (SMA/EMA/RSI/MACD) for a symbol, computed
 *  server-side (backend/src/services/technical/indicators.ts) from real
 *  ingested candles. `exchange` defaults to the globally-selected market. */
export function useIndicator(symbol: string, type: IndicatorType, params: IndicatorParams = {}, enabled = true) {
  const { exchange: selectedExchange } = useExchange();
  const exchange = params.exchange ?? selectedExchange;

  const query = useQuery({
    queryKey: ["continua", "indicator", exchange, symbol, type, params.period, params.fast, params.slow, params.signal, params.from, params.to],
    queryFn: () => indicatorsApi.get(symbol, type, { ...params, exchange }),
    enabled: enabled && !!symbol,
    staleTime: 60_000,
    retry: 1,
  });

  return { indicator: query.data, isLoading: query.isLoading, isError: query.isError };
}