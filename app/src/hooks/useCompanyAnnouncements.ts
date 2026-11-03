import { useQuery } from "@tanstack/react-query";
import { announcementsApi } from "@/api/announcementsApi";
import { isNotFound } from "@/api/client";
import type { CompanyAnnouncement } from "@/api/types";

/** Real company announcements for a symbol, scraped from NSE filings by
 *  continua-scraper and bridged into market.company_announcements — from
 *  the Data Layer's `GET /announcements/:symbol` (see docs/api/API.md).
 *  Returns `announcements: []` — not an error — when the symbol has none
 *  scraped yet, same convention as useDividendHistory/useCorporateActions,
 *  so callers can fall back to their own placeholder rather than treating
 *  "nothing yet" as a failure. */
export function useCompanyAnnouncements(symbol: string | undefined) {
  const query = useQuery({
    queryKey: ["continua", "announcements", symbol],
    queryFn: () => announcementsApi.getForSymbol(symbol as string),
    enabled: !!symbol,
    staleTime: 5 * 60_000,
    retry: (count, err) => !isNotFound(err) && count < 1,
  });

  return {
    announcements: (query.data ?? []) as CompanyAnnouncement[],
    isLoading: query.isLoading,
    isNotCovered: isNotFound(query.error),
  };
}