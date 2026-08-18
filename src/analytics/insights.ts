// The analysis that sits between a parsed Dataset and the views: position
// buckets, the good/warn/bad tiering used to colour the table, and the join
// that turns two uploads into one comparable table.

import type { Dataset, Row } from "./types";

// --- position tiers -------------------------------------------------------

export type Tier = "good" | "warn" | "bad";

/** Page-one green, page-two amber, beyond that red. */
export function positionTier(position: number): Tier {
  if (position < 10) return "good";
  if (position <= 20) return "warn";
  return "bad";
}

// --- distribution ---------------------------------------------------------

export interface Bucket {
  id: string;
  label: string;
  /** Inclusive lower bound. */
  min: number;
  /** Inclusive upper bound; `Infinity` for the open-ended last bucket. */
  max: number;
  tier: Tier;
}

export const POSITION_BUCKETS: Bucket[] = [
  { id: "1-3", label: "1–3", min: 0, max: 3, tier: "good" },
  { id: "4-10", label: "4–10", min: 3, max: 10, tier: "good" },
  { id: "11-20", label: "11–20", min: 10, max: 20, tier: "warn" },
  { id: "21-50", label: "21–50", min: 20, max: 50, tier: "bad" },
  { id: "50+", label: "50+", min: 50, max: Infinity, tier: "bad" },
];

/** How many rows land in each bucket, in `POSITION_BUCKETS` order. */
export function bucketCounts(rows: Row[]): number[] {
  const counts = POSITION_BUCKETS.map(() => 0);
  for (const row of rows) {
    // Bounds are (min, max] so a position of exactly 3 counts as "1–3" and 3.1
    // moves to "4–10" — the way a human reads "top three".
    const index = POSITION_BUCKETS.findIndex((b) => row.position > b.min && row.position <= b.max);
    if (index >= 0) counts[index] += 1;
  }
  return counts;
}

// --- comparison -----------------------------------------------------------

export type RowStatus = "both" | "new" | "lost";

export interface Delta {
  clicks: number;
  impressions: number;
  ctr: number;
  /** Positive = slipped down the results. Negative = improved. */
  position: number | null;
}

/**
 * One line of the table. Without a comparison it is just the row; with one, the
 * metrics are period B (current) and `delta` is B − A, so the table renderer
 * only ever deals with a single shape.
 */
export interface TableRow extends Row {
  delta?: Delta;
  status?: RowStatus;
  /** Period A's metrics, for the tooltip and the "lost" case. */
  before?: Row;
}

export function toTableRows(dataset: Dataset): TableRow[] {
  return dataset.rows.map((row) => ({ ...row }));
}

const ZERO: Omit<Row, "key"> = { clicks: 0, impressions: 0, ctr: 0, position: 0 };

/**
 * Join two datasets on their key. `before` is the baseline period, `after` the
 * current one. Keys present in only one period still get a line, flagged "new"
 * or "lost", because a query that vanished is exactly what you opened this for.
 */
export function compare(before: Dataset, after: Dataset): TableRow[] {
  const beforeByKey = new Map(before.rows.map((r) => [r.key, r]));
  const afterByKey = new Map(after.rows.map((r) => [r.key, r]));
  const keys = new Set([...afterByKey.keys(), ...beforeByKey.keys()]);

  const out: TableRow[] = [];
  for (const key of keys) {
    const a = beforeByKey.get(key);
    const b = afterByKey.get(key);
    const current = b ?? { key, ...ZERO };
    const status: RowStatus = a && b ? "both" : b ? "new" : "lost";
    out.push({
      ...current,
      status,
      before: a,
      delta: {
        clicks: current.clicks - (a?.clicks ?? 0),
        impressions: current.impressions - (a?.impressions ?? 0),
        ctr: current.ctr - (a?.ctr ?? 0),
        // A position delta needs a position on both sides to mean anything.
        position: a && b ? b.position - a.position : null,
      },
    });
  }
  return out;
}

/**
 * Whether a delta is an improvement. Clicks, impressions and CTR are better up;
 * position is better DOWN, which is the one everybody gets backwards.
 */
export function isImprovement(field: keyof Delta, value: number): boolean {
  return field === "position" ? value < 0 : value > 0;
}
