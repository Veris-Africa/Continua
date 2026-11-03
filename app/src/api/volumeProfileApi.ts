import { continuaFetch } from "./client";

export interface VolumeProfileBucket {
  priceLow: number;
  priceHigh: number;
  priceMid: number;
  volume: number;
}

export interface VolumeProfileResult {
  symbol: string;
  exchange: string;
  from: string;
  to: string;
  buckets: VolumeProfileBucket[];
  pointOfControl: number;
  valueAreaLow: number;
  valueAreaHigh: number;
  totalVolume: number;
  caveat: string;
}

export const volumeProfileApi = {
  get(symbol: string, exchange = "NSE", from?: string, to?: string) {
    return continuaFetch<VolumeProfileResult>(`/volume-profile/${encodeURIComponent(symbol)}`, {
      params: { exchange, from, to },
    });
  },
};