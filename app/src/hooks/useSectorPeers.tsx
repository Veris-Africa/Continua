import { useQuery } from "@tanstack/react-query";
import { screenerApi } from "@/api/screenerApi";

/** Real sector peers from the NSE screener (up to 20, same sector),
 *  used for the PE-vs-Peers and PE-vs-Industry widgets. This is
 *  Continua's actual sector tagging, not a hand-picked peer set like
 *  Simply Wall St's editable list — there's no "Edit Peers" concept
 *  here since Continua doesn't support user-curated peer groups yet. */
export function useSectorPeers(sector: string | undefined) {
  return useQuery({
    queryKey: ["continua", "screener", "sector-peers", sector],
    queryFn: () => screenerApi.run({ sector, limit: 20, sortBy: "marketCap", sortDirection: "desc" }),
    enabled: !!sector,
    staleTime: 15 * 60_000,
  });
}