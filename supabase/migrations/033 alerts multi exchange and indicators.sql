-- Extends price_alerts (previously Kenya/price-only) to support:
--   1. Multi-exchange alerts — the table had no `exchange` column at all,
--      and check-price-alerts/index.ts hardcoded "KES" into every
--      notification message. Both are fixed here.
--   2. Indicator-based alerts (RSI, SMA/EMA crossover) — alongside the
--      existing price_above/price_below, using the technical indicators
--      engine added in backend/src/services/technical/indicators.ts via
--      GET /indicators/:symbol.
--
-- alert_type is intentionally left as free TEXT (not a CHECK-constrained
-- enum) — it already was, and check-indicator-alerts/index.ts is the
-- actual source of truth for which values it knows how to evaluate.
-- Constraining it here would just mean this migration and that function
-- could drift out of sync.

ALTER TABLE public.price_alerts
  ADD COLUMN IF NOT EXISTS exchange TEXT NOT NULL DEFAULT 'NSE',
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'KES',
  ADD COLUMN IF NOT EXISTS indicator TEXT,               -- 'RSI' | 'SMA_CROSS' | 'EMA_CROSS', null for price alerts
  ADD COLUMN IF NOT EXISTS indicator_params JSONB;        -- e.g. {"period":14,"threshold":30} or {"fastPeriod":10,"slowPeriod":30}

CREATE INDEX IF NOT EXISTS idx_price_alerts_active_indicator
  ON public.price_alerts (exchange, symbol) WHERE is_active = true AND indicator IS NOT NULL AND triggered_at IS NULL;

-- Replaces the KES-hardcoded trigger from migration
-- 20260808120000_e2b5f8a3-... with an exchange/currency-aware version.
CREATE OR REPLACE FUNCTION public.notify_on_price_alert_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE msg text;
BEGIN
  IF NEW.indicator IS NOT NULL THEN
    msg := 'We''ll notify you when ' || NEW.symbol || '''s ' || NEW.indicator || ' meets your condition.';
  ELSE
    msg := 'We''ll notify you when ' || NEW.symbol || ' ' ||
           (CASE WHEN NEW.alert_type = 'price_above' THEN 'rises above' ELSE 'falls below' END) ||
           ' ' || NEW.currency || ' ' || NEW.target_value;
  END IF;
  INSERT INTO notifications (user_id, type, feature, title, message, action_url, entity_id, entity_type)
  VALUES (NEW.user_id, 'alert', 'alerts', NEW.symbol || ' alert created', msg, '/stock/' || NEW.symbol, NEW.id, 'price_alert');
  RETURN NEW;
END $$;