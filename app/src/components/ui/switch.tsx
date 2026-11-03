import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

// Single source of truth for the switch's size, used everywhere in the app (Settings,
// Chart Indicators, alerts, etc). Change TRACK_HEIGHT / TRACK_WIDTH / THUMB_SIZE below —
// they're wired up as real inline styles / CSS custom properties, not Tailwind
// arbitrary-value classes, so an edit here is guaranteed to show up the moment you save.
// (Tailwind classes like `h-[16px]` only work when that exact literal string appears in
// the file — if a value is ever computed instead of typed as a plain number in a class
// string, Tailwind's build step silently fails to generate the CSS for it, and the
// switch stays stuck at whatever height was last generated. Inline styles have no such
// build step, so this can't happen here.)
const TRACK_HEIGHT = 16; // px — height of the pill-shaped track (the grey/purple part)
const TRACK_WIDTH = 58;  // px — width of the pill-shaped track
const THUMB_SIZE = 25;   // px — diameter of the round white thumb
// How far the thumb slides when switched on. Derived automatically from the two values
// above so the thumb always lands flush against the right edge — never hardcode this.
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE;

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, style, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-none overflow-visible transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    style={{ height: TRACK_HEIGHT, width: TRACK_WIDTH, ...style }}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className="pointer-events-none absolute left-0 top-1/2 block -translate-y-1/2 rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15),0_3px_1px_rgba(0,0,0,0.06)] ring-0 transition-transform duration-300 ease-in-out data-[state=checked]:translate-x-[var(--switch-thumb-travel)] data-[state=unchecked]:translate-x-0"
      style={{ height: THUMB_SIZE, width: THUMB_SIZE, ["--switch-thumb-travel" as string]: `${THUMB_TRAVEL}px` } as React.CSSProperties}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }