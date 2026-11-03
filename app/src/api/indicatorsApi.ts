import { continuaFetch } from "./client";

export type IndicatorType = "SMA" | "EMA" | "RSI" | "MACD";

export interface IndicatorResult {
  symbol: string;
  exchange: string;
  type: IndicatorType;
  timestamps: string[];
  values: (number | null)[] | { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] };
  latest: number | { macd: number | null; signal: number | null; histogram: number | null } | null;
}

export interface IndicatorParams {
  exchange?: string;
  period?: number;
  fast?: number;
  slow?: number;
  signal?: number;
  from?: string;
  to?: string;
}

export const indicatorsApi = {
  get(symbol: string, type: IndicatorType, params: IndicatorParams = {}) {
    return continuaFetch<IndicatorResult>(`/indicators/${encodeURIComponent(symbol)}`, {
      params: { type, exchange: params.exchange ?? "NSE", period: params.period, fast: params.fast, slow: params.slow, signal: params.signal, from: params.from, to: params.to },
    });
  },
};