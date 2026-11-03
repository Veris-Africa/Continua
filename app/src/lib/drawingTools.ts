// Metadata for every drawing tool exposed via the pencil button's "Drawing
// Tools" sheet. Kept separate from StockPriceChart.tsx so the sheet (icons +
// labels) and the chart's drawing engine (geometry + rendering) both read
// from one source of truth instead of duplicating the tool list.
//
// Categories intentionally match the Moomoo/TradingView-style sheet's
// grouping and counts for Lines, Channels & Pitchforks, Shapes, Measures,
// and Items. Patterns and Fibonacci & Gann are not implemented.

export type DrawToolId =
  // Lines (9)
  | "trend-line" | "horizontal-line" | "horizontal-ray" | "horizontal-segment"
  | "vertical-line" | "cross-line" | "extended-line" | "trend-angle" | "info-line"
  // Channels & Pitchforks (8)
  | "parallel-lines" | "parallel-channel" | "flat-channel" | "disjoint-channel"
  | "pitchfork" | "schiff-pitchfork" | "modified-schiff-pitchfork" | "inside-pitchfork"
  // Shapes (5)
  | "rectangle" | "triangle" | "parallelogram" | "circle" | "ellipse"
  // Measures (6)
  | "price-range" | "date-range" | "date-price-range" | "long-position" | "short-position" | "bars-pattern"
  // Items (6)
  | "price-label" | "text" | "notes" | "arrow" | "callout" | "flag";

export interface DrawToolDef {
  id: DrawToolId;
  label: string;
  /** How many taps on the chart it takes to finish placing this tool. */
  points: 1 | 2 | 3;
  /** Prompts the person for a short line of text right after placement. */
  needsText?: boolean;
}

export interface DrawToolCategory {
  name: string;
  tools: DrawToolDef[];
}

export const DRAW_TOOL_CATEGORIES: DrawToolCategory[] = [
  {
    name: "Lines",
    tools: [
      { id: "trend-line", label: "Trend Line", points: 2 },
      { id: "horizontal-line", label: "Horizontal Line", points: 1 },
      { id: "horizontal-ray", label: "Horizontal Ray", points: 1 },
      { id: "horizontal-segment", label: "Horizontal Line Segment", points: 2 },
      { id: "vertical-line", label: "Vertical Line", points: 1 },
      { id: "cross-line", label: "Cross Line", points: 1 },
      { id: "extended-line", label: "Extended Line", points: 2 },
      { id: "trend-angle", label: "Trend Angle", points: 2 },
      { id: "info-line", label: "Info Line", points: 2 },
    ],
  },
  {
    name: "Channels & Pitchforks",
    tools: [
      { id: "parallel-lines", label: "Parallel Lines", points: 3 },
      { id: "parallel-channel", label: "Parallel Channel", points: 3 },
      { id: "flat-channel", label: "Flat Top/Bottom", points: 3 },
      { id: "disjoint-channel", label: "Disjoint Channel", points: 3 },
      { id: "pitchfork", label: "Pitchfork", points: 3 },
      { id: "schiff-pitchfork", label: "Schiff Pitchfork", points: 3 },
      { id: "modified-schiff-pitchfork", label: "Modified Schiff Pitchfork", points: 3 },
      { id: "inside-pitchfork", label: "Inside Pitchfork", points: 3 },
    ],
  },
  {
    name: "Shapes",
    tools: [
      { id: "rectangle", label: "Rectangle", points: 2 },
      { id: "triangle", label: "Triangle", points: 3 },
      { id: "parallelogram", label: "Parallelogram", points: 3 },
      { id: "circle", label: "Circle", points: 2 },
      { id: "ellipse", label: "Ellipse", points: 2 },
    ],
  },
  {
    name: "Measures",
    tools: [
      { id: "price-range", label: "Price Range", points: 2 },
      { id: "date-range", label: "Date Range", points: 2 },
      { id: "date-price-range", label: "Date and Price Range", points: 2 },
      { id: "long-position", label: "Long Position", points: 2 },
      { id: "short-position", label: "Short Position", points: 2 },
      { id: "bars-pattern", label: "Bars Pattern", points: 2 },
    ],
  },
  {
    name: "Items",
    tools: [
      { id: "price-label", label: "Price Label", points: 1 },
      { id: "text", label: "Text", points: 1, needsText: true },
      { id: "notes", label: "Notes", points: 1, needsText: true },
      { id: "arrow", label: "Arrow", points: 2 },
      { id: "callout", label: "Callout", points: 2, needsText: true },
      { id: "flag", label: "Flag", points: 1 },
    ],
  },
];

export const DRAW_TOOL_LOOKUP: Record<DrawToolId, DrawToolDef> = Object.fromEntries(
  DRAW_TOOL_CATEGORIES.flatMap((c) => c.tools.map((t) => [t.id, t]))
) as Record<DrawToolId, DrawToolDef>;

/** A single point anchored to a real price and a relative x-position (0-1
 *  fraction across the visible plot), not raw pixels — this is what lets a
 *  drawing stay put correctly through price-axis zoom and pane resizing. */
export interface DrawPoint {
  xFrac: number;
  price: number;
}

export interface Drawing {
  id: number;
  tool: DrawToolId;
  points: DrawPoint[];
  text?: string;
}