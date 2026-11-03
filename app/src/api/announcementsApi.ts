import { continuaFetch } from "./client";
import type { CompanyAnnouncement } from "./types";

export const announcementsApi = {
  /** Company announcements for a symbol, sourced by continua-scraper from
   *  NSE filings — GET /announcements/:symbol (see docs/api/API.md). */
  getForSymbol(symbol: string, opts: { exchange?: string; limit?: number } = {}) {
    const { exchange = "NSE", limit = 50 } = opts;
    return continuaFetch<CompanyAnnouncement[]>(`/announcements/${encodeURIComponent(symbol)}`, {
      params: { exchange, limit },
    });
  },
};