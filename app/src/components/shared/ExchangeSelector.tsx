import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { EXCHANGES } from "@/lib/exchanges";
import { useExchange } from "@/hooks/useExchange";

/** Compact "🇰🇪 NSE ▾" trigger for the TopBar. Switches the app-wide
 *  selected exchange (see hooks/useExchange.tsx) — every screen reading
 *  from useExchange() re-renders with the new market's data. */
export function ExchangeSelector({ className }: { className?: string }) {
  const { exchange, exchangeMeta, setExchange } = useExchange();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 gap-1 px-2 rounded-full ${className ?? ""}`}
          aria-label={`Switch market — currently ${exchangeMeta.name}`}
        >
          <span className="text-base leading-none">{exchangeMeta.flag}</span>
          <span className="text-xs font-semibold">{exchange}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Choose a market</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {EXCHANGES.map((ex) => (
          <DropdownMenuItem
            key={ex.code}
            onClick={() => setExchange(ex.code)}
            className="flex items-center gap-2"
          >
            <span className="text-base leading-none">{ex.flag}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{ex.name}</div>
              <div className="text-xs text-muted-foreground truncate">{ex.country} · {ex.currency}</div>
            </div>
            {ex.code === exchange && <Check className="h-4 w-4 text-primary shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}