import { continuaFetch } from "./client";
import type { MarketIndex } from "./types";

export const indicesApi = {
  list(exchange = "NSE") {
    return continuaFetch<MarketIndex[]>("/indices", { params: { exchange } });
  },
};