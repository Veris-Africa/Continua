import { continuaFetch } from "./client";
import type { Candle, CandleInterval, RangePerformance } from "./types";
import type {PriceObservation} from '@/lib/priceHistory';

export const historicalApi = {
  getCloses(symbol: string, range: {from: string; to: string}, signal?:AbortSignal) {
    return continuaFetch<PriceObservation[]>(`/price-history/${encodeURIComponent(symbol)}`, {signal,params: {exchange: 'NSE', ...range}});
  },
  getCandles(
    symbol: string,
    opts: { interval?: CandleInterval; from?: string; to?: string; exchange?: string; signal?:AbortSignal } = {}
  ) {
    const { interval = "1d", from, to, exchange = "NSE",signal } = opts;
    return continuaFetch<Candle[]>(`/historical/${encodeURIComponent(symbol)}`, {
      signal, params: { exchange, interval, from, to },
    });
  },

  getPerformance(symbol: string, from: string, opts: { to?: string; exchange?: string } = {}) {
    const { to, exchange = "NSE" } = opts;
    return continuaFetch<RangePerformance>(`/historical/${encodeURIComponent(symbol)}/performance`, {
      params: { exchange, from, to },
    });
  },

  /** Batch recent closes for list-view sparklines — one request for every
   *  symbol on a page. Symbols with no candle history yet are simply
   *  absent from the response; callers must render that as an honest
   *  empty state, never a fabricated line. */
  getSparklines(symbols: string[], opts: { points?: number; exchange?: string } = {}) {
    const { points, exchange = "NSE" } = opts;
    return continuaFetch<Record<string, number[]>>("/historical/sparklines", {
      params: { exchange, symbols: symbols.join(","), points },
    });
  },
};
