import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { usePriceAlerts, PriceAlert } from "@/hooks/usePriceAlerts";
import { useToast } from "@/hooks/use-toast";
import { useExchange } from "@/hooks/useExchange";
import { describeAlertRow } from "@/lib/alertFormat";
import { Bell, Plus, Trash2, Activity, TrendingUp, TrendingDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface PriceAlertsManagerProps {
  initialSymbol?: string;
}

type Mode = "price" | "indicator";

export function PriceAlertsManager({ initialSymbol }: PriceAlertsManagerProps = {}) {
  const { alerts, loading, createAlert, deleteAlert, toggleAlert } = usePriceAlerts();
  const { toast } = useToast();
  const { exchange, exchangeMeta } = useExchange();
  const [open, setOpen] = useState(false);
  const [symbol, setSymbol] = useState(initialSymbol || '');
  const [mode, setMode] = useState<Mode>('price');
  const [alertType, setAlertType] = useState<'price_above' | 'price_below'>('price_above');
  const [targetValue, setTargetValue] = useState('');
  const [indicator, setIndicator] = useState<'RSI' | 'SMA_CROSS' | 'EMA_CROSS'>('RSI');
  const [rsiCondition, setRsiCondition] = useState<'rsi_above' | 'rsi_below'>('rsi_below');
  const [rsiPeriod, setRsiPeriod] = useState('14');
  const [rsiThreshold, setRsiThreshold] = useState('30');
  const [fastPeriod, setFastPeriod] = useState('10');
  const [slowPeriod, setSlowPeriod] = useState('30');
  const [direction, setDirection] = useState<'bullish' | 'bearish'>('bullish');

  const resetForm = () => {
    setSymbol(initialSymbol || ''); setMode('price'); setAlertType('price_above'); setTargetValue('');
    setIndicator('RSI'); setRsiCondition('rsi_below'); setRsiPeriod('14'); setRsiThreshold('30');
    setFastPeriod('10'); setSlowPeriod('30'); setDirection('bullish');
  };

  const handleCreateAlert = async () => {
    if (!symbol) {
      toast({ title: "Missing fields", description: "Enter a stock symbol", variant: "destructive" });
      return;
    }

    let payload: Omit<PriceAlert, "id" | "user_id" | "created_at" | "updated_at" | "triggered_at">;
    let description: string;

    if (mode === 'price') {
      const target = parseFloat(targetValue);
      if (!targetValue || !target || target <= 0) {
        toast({ title: "Missing fields", description: "Enter a valid target price", variant: "destructive" });
        return;
      }
      payload = {
        symbol: symbol.toUpperCase(), exchange, currency: exchangeMeta.currency,
        alert_type: alertType, target_value: target, indicator: null, indicator_params: null, is_active: true,
      };
      description = `You'll be notified when ${symbol} ${alertType === 'price_above' ? 'rises above' : 'falls below'} ${exchangeMeta.currency} ${targetValue}`;
    } else if (indicator === 'RSI') {
      const period = parseInt(rsiPeriod, 10);
      const threshold = parseFloat(rsiThreshold);
      if (!period || !threshold) {
        toast({ title: "Missing fields", description: "Enter a valid RSI period and threshold", variant: "destructive" });
        return;
      }
      payload = {
        symbol: symbol.toUpperCase(), exchange, currency: exchangeMeta.currency,
        alert_type: rsiCondition, target_value: threshold, indicator: 'RSI',
        indicator_params: { period, threshold }, is_active: true,
      };
      description = `You'll be notified when ${symbol}'s RSI(${period}) crosses ${rsiCondition === 'rsi_below' ? 'below' : 'above'} ${threshold}`;
    } else {
      const fast = parseInt(fastPeriod, 10);
      const slow = parseInt(slowPeriod, 10);
      if (!fast || !slow || fast >= slow) {
        toast({ title: "Missing fields", description: "Fast period must be smaller than slow period", variant: "destructive" });
        return;
      }
      payload = {
        symbol: symbol.toUpperCase(), exchange, currency: exchangeMeta.currency,
        alert_type: 'price_above', target_value: null, indicator,
        indicator_params: { fastPeriod: fast, slowPeriod: slow, direction: direction === 'bullish' ? 1 : -1 }, is_active: true,
      };
      description = `You'll be notified on the next ${direction} crossover for ${symbol}`;
    }

    const result = await createAlert(payload);

    if (result.error) {
      toast({ title: "Error", description: "Failed to create alert", variant: "destructive" });
    } else {
      toast({ title: "Alert created", description });
      setOpen(false);
      resetForm();
    }
  };

  const handleDeleteAlert = async (id: string) => {
    const result = await deleteAlert(id);
    if (result.error) {
      toast({
        title: "Error",
        description: "Failed to delete alert",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Alert deleted",
        description: "Price alert has been removed",
      });
    }
  };

  const handleToggleAlert = async (id: string, isActive: boolean) => {
    await toggleAlert(id, !isActive);
  };

  if (loading) {
    return <div className="text-center py-8">Loading alerts...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Alerts
        </h3>
        
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Alert
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Alert</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="symbol">Stock Symbol ({exchangeMeta.name})</Label>
                <Input
                  id="symbol"
                  placeholder="e.g., SCOM"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                />
              </div>

              <div>
                <Label>Alert Kind</Label>
                <Select value={mode} onValueChange={(v: Mode) => setMode(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price">Price target</SelectItem>
                    <SelectItem value="indicator">Technical indicator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {mode === 'price' && (
                <>
                  <div>
                    <Label htmlFor="alertType">Alert Type</Label>
                    <Select value={alertType} onValueChange={(value: any) => setAlertType(value)}>
                      <SelectTrigger id="alertType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="price_above">Price Above</SelectItem>
                        <SelectItem value="price_below">Price Below</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="targetValue">Target Price ({exchangeMeta.currency})</Label>
                    <Input
                      id="targetValue"
                      type="number"
                      placeholder="0.00"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                    />
                  </div>
                </>
              )}

              {mode === 'indicator' && (
                <>
                  <div>
                    <Label>Indicator</Label>
                    <Select value={indicator} onValueChange={(v: any) => setIndicator(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RSI">RSI</SelectItem>
                        <SelectItem value="SMA_CROSS">SMA Crossover</SelectItem>
                        <SelectItem value="EMA_CROSS">EMA Crossover</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {indicator === 'RSI' ? (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <Label>Condition</Label>
                        <Select value={rsiCondition} onValueChange={(v: any) => setRsiCondition(v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rsi_above">Above</SelectItem>
                            <SelectItem value="rsi_below">Below</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Period</Label>
                        <Input type="number" value={rsiPeriod} onChange={(e) => setRsiPeriod(e.target.value)} />
                      </div>
                      <div>
                        <Label>Threshold</Label>
                        <Input type="number" value={rsiThreshold} onChange={(e) => setRsiThreshold(e.target.value)} />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label>Fast period</Label>
                        <Input type="number" value={fastPeriod} onChange={(e) => setFastPeriod(e.target.value)} />
                      </div>
                      <div>
                        <Label>Slow period</Label>
                        <Input type="number" value={slowPeriod} onChange={(e) => setSlowPeriod(e.target.value)} />
                      </div>
                      <div>
                        <Label>Direction</Label>
                        <Select value={direction} onValueChange={(v: any) => setDirection(v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bullish">Bullish</SelectItem>
                            <SelectItem value="bearish">Bearish</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </>
              )}

              <Button onClick={handleCreateAlert} className="w-full">
                Create Alert
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {alerts.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No alerts set</p>
          <p className="text-sm mt-2">Create alerts to get notified on a price target or a technical signal</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <Card key={alert.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {alert.indicator ? <Activity className="w-4 h-4 text-primary" /> :
                      alert.alert_type === 'price_above' ? <TrendingUp className="w-4 h-4 text-bull" /> : <TrendingDown className="w-4 h-4 text-bear" />}
                    <span className="font-semibold text-lg">{alert.symbol}</span>
                    <span className="text-xs text-muted-foreground">{alert.exchange}</span>
                    <span className="text-sm text-muted-foreground">
                      {describeAlertRow(alert)}
                    </span>
                    {alert.triggered_at && (
                      <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded">
                        Triggered
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created {new Date(alert.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={alert.is_active}
                    onCheckedChange={() => handleToggleAlert(alert.id, alert.is_active)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteAlert(alert.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}