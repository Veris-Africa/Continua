import type { PriceAlert } from "@/hooks/usePriceAlerts";

/** One-line human description of any alert row — price or indicator —
 *  for list views. Centralized so StockAlertDialog.tsx and
 *  PriceAlertsManager.tsx (two separate alert UIs) render the same alert
 *  the same way, rather than each guessing at indicator_params' shape. */
export function describeAlertRow(alert: PriceAlert): string {
  if (alert.indicator === "RSI") {
    const p = alert.indicator_params;
    return `RSI(${p?.period ?? 14}) ${alert.alert_type === "rsi_below" ? "below" : "above"} ${p?.threshold ?? alert.target_value ?? "—"}`;
  }
  if (alert.indicator === "SMA_CROSS" || alert.indicator === "EMA_CROSS") {
    const p = alert.indicator_params;
    const type = alert.indicator === "SMA_CROSS" ? "SMA" : "EMA";
    return `${type}(${p?.fastPeriod ?? 10}/${p?.slowPeriod ?? 30}) ${p?.direction === -1 ? "bearish" : "bullish"} cross`;
  }
  return `${alert.alert_type === "price_above" ? "Above" : "Below"} ${alert.currency ?? "KES"} ${alert.target_value ?? "—"}`;
}
