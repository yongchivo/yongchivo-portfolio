// The analysis that sits between a parsed Dataset and the views.
//
// Two families live here. The DIMENSIONAL half (position tiers, buckets, the
// key join) serves ranking presets like Search Console; the TEMPORAL half
// (time series, weekday rollup, facet rollup) serves date-keyed presets like
// App Store Connect. Both are preset-agnostic — they take rows and metric
// descriptors and give back plain numbers.

import { sumOf, totalsOf } from "./numbers";
import type { Dataset, Metric, Metrics, Row } from "./types";

// --- position tiers (dimensional) -----------------------------------------

export type Tier = "good" | "warn" | "bad";

/** Page-one green, page-two amber, beyond that red. */
export function positionTier(position: number): Tier {
  if (position < 10) return "good";
  if (position <= 20) return "warn";
  return "bad";
}

export interface Bucket {
  id: string;
  label: string;
  /** Exclusive lower bound. */
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
export function bucketCounts(rows: Row[], metricId: string): number[] {
  const counts = POSITION_BUCKETS.map(() => 0);
  for (const row of rows) {
    const value = row.metrics[metricId];
    if (value === undefined) continue;
    // Bounds are (min, max] so a position of exactly 3 counts as "1–3" and 3.1
    // moves to "4–10" — the way a human reads "top three".
    const index = POSITION_BUCKETS.findIndex((b) => value > b.min && value <= b.max);
    if (index >= 0) counts[index] += 1;
  }
  return counts;
}

// --- comparison (dimensional) ---------------------------------------------

export type RowStatus = "both" | "new" | "lost";

/**
 * One line of the table. Without a comparison it is just the row; with one, the
 * metrics are period B (current) and `delta` is B − A per metric, so the table
 * renderer only ever deals with a single shape.
 */
export interface TableRow extends Row {
  delta?: Metrics;
  status?: RowStatus;
  /** Period A's row, for the tooltip and the "lost" case. */
  before?: Row;
}

export function toTableRows(dataset: Dataset): TableRow[] {
  return dataset.rows.map((row) => ({ ...row }));
}

/**
 * Join two datasets on their key. `before` is the baseline period, `after` the
 * current one. Keys present in only one period still get a line, flagged "new"
 * or "lost", because a query that vanished is exactly what you opened this for.
 *
 * Only meaningful for dimensional presets: joining two date-keyed exports from
 * different ranges would match nothing, so temporal presets compare on totals.
 */
export function compare(before: Dataset, after: Dataset, metrics: Metric[]): TableRow[] {
  const beforeByKey = new Map(before.rows.map((r) => [r.key, r]));
  const afterByKey = new Map(after.rows.map((r) => [r.key, r]));
  const keys = new Set([...afterByKey.keys(), ...beforeByKey.keys()]);

  const out: TableRow[] = [];
  for (const key of keys) {
    const a = beforeByKey.get(key);
    const b = afterByKey.get(key);
    const status: RowStatus = a && b ? "both" : b ? "new" : "lost";
    const current: Row = b ?? { key, metrics: {} };

    const delta: Metrics = {};
    for (const metric of metrics) {
      // A position delta needs a position on BOTH sides to mean anything, so
      // new and lost rows simply don't get one.
      if (metric.lowerIsBetter && status !== "both") continue;
      delta[metric.id] = (current.metrics[metric.id] ?? 0) - (a?.metrics[metric.id] ?? 0);
    }

    out.push({ ...current, metrics: current.metrics ?? {}, status, before: a, delta });
  }
  return out;
}

// --- time series (temporal) -----------------------------------------------

export type Granularity = "day" | "week";

export interface TimePoint {
  /** Start of the bucket. */
  date: Date;
  /** Axis label, already localised. */
  label: string;
  metrics: Metrics;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Monday-start week, matching the en-GB / es-ES calendars this site uses. */
function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  // getDay() is 0=Sunday; shift so Monday is 0.
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return d;
}

/** Days between the first and last dated row, inclusive. */
export function spanInDays(rows: Row[]): number {
  const times = rows.filter((r) => r.date).map((r) => r.date!.getTime());
  if (times.length === 0) return 0;
  const ms = Math.max(...times) - Math.min(...times);
  return Math.round(ms / 86_400_000) + 1;
}

/**
 * Roll dated rows up into one point per day or per week. Rows sharing a date
 * (App Store Connect splits a day across devices, sources and territories) are
 * summed, and ratio metrics are re-derived from those sums rather than averaged.
 */
export function timeSeries(
  rows: Row[],
  metrics: Metric[],
  granularity: Granularity,
  lang: string
): TimePoint[] {
  const buckets = new Map<number, Row[]>();
  for (const row of rows) {
    if (!row.date) continue;
    const start = granularity === "week" ? startOfWeek(row.date) : startOfDay(row.date);
    const stamp = start.getTime();
    const bucket = buckets.get(stamp);
    if (bucket) bucket.push(row);
    else buckets.set(stamp, [row]);
  }

  const dayFormat = new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-GB", {
    day: "numeric",
    month: "short",
  });

  const points = [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([stamp, bucketRows]) => {
      const date = new Date(stamp);
      return { date, label: dayFormat.format(date), metrics: totalsOf(bucketRows, metrics) };
    });

  return granularity === "week" ? dropPartialWeeks(points, rows) : points;
}

/**
 * Drop a leading or trailing week the data only partly covers.
 *
 * A range starting on a Sunday puts one day into a Monday-start week, and that
 * bucket then plots at a seventh of its neighbours — a cliff at each end that
 * reads as a trend and isn't one. Only trimmed when enough full weeks remain
 * for the chart to still say something.
 */
function dropPartialWeeks(points: TimePoint[], rows: Row[]): TimePoint[] {
  if (points.length < 4) return points;

  const times = rows.filter((r) => r.date).map((r) => r.date!.getTime());
  if (times.length === 0) return points;
  const first = startOfDay(new Date(Math.min(...times))).getTime();
  const last = startOfDay(new Date(Math.max(...times))).getTime();

  const trimmed = [...points];
  // The opening week is partial when the data starts after the week did.
  if (trimmed.length > 3 && trimmed[0].date.getTime() < first) trimmed.shift();
  // The closing week is partial when it would run past the last day of data.
  const tail = trimmed[trimmed.length - 1];
  if (trimmed.length > 3 && tail.date.getTime() + 6 * 86_400_000 > last) trimmed.pop();
  return trimmed;
}

/**
 * Pick the granularity the chart can actually render legibly. Sixty daily
 * points is about where a line chart stops being readable at this width.
 */
export function pickGranularity(rows: Row[], dayLimit = 60): Granularity {
  return spanInDays(rows) > dayLimit ? "week" : "day";
}

// --- weekday rollup (temporal) --------------------------------------------

export interface WeekdayBucket {
  /** 0 = Monday … 6 = Sunday. */
  index: number;
  label: string;
  metrics: Metrics;
  /** How many distinct calendar days fell on this weekday. */
  days: number;
}

/**
 * Totals per day of the week, Monday first. `days` comes back too so a view can
 * show a daily average — six Mondays and five Tuesdays in a range would
 * otherwise make Monday look better than it is.
 */
export function byWeekday(rows: Row[], metrics: Metric[], lang: string): WeekdayBucket[] {
  const format = new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-GB", { weekday: "short" });
  const grouped: Row[][] = Array.from({ length: 7 }, () => []);
  const distinctDays: Set<number>[] = Array.from({ length: 7 }, () => new Set());

  for (const row of rows) {
    if (!row.date) continue;
    const index = (row.date.getDay() + 6) % 7;
    grouped[index].push(row);
    distinctDays[index].add(startOfDay(row.date).getTime());
  }

  // 2024-01-01 was a Monday, so this walks Monday → Sunday.
  return grouped.map((bucketRows, index) => ({
    index,
    label: format.format(new Date(2024, 0, 1 + index)),
    metrics: totalsOf(bucketRows, metrics),
    days: distinctDays[index].size,
  }));
}

// --- facet rollup (temporal or dimensional) -------------------------------

export interface FacetSlice {
  value: string;
  metrics: Metrics;
  /** Share of the ranking metric's total, as a fraction. */
  share: number;
}

/**
 * Totals per value of one facet (source, device, country…), biggest first.
 * `rankBy` decides both the order and the share.
 */
export function byFacet(
  rows: Row[],
  facetId: string,
  metrics: Metric[],
  rankBy: string
): FacetSlice[] {
  const grouped = new Map<string, Row[]>();
  for (const row of rows) {
    const value = row.facets?.[facetId];
    if (!value) continue;
    const bucket = grouped.get(value);
    if (bucket) bucket.push(row);
    else grouped.set(value, [row]);
  }

  const total = sumOf(rows, rankBy);
  return [...grouped.entries()]
    .map(([value, bucketRows]) => {
      const bucketMetrics = totalsOf(bucketRows, metrics);
      return {
        value,
        metrics: bucketMetrics,
        share: total > 0 ? (bucketMetrics[rankBy] ?? 0) / total : 0,
      };
    })
    .sort((a, b) => (b.metrics[rankBy] ?? 0) - (a.metrics[rankBy] ?? 0));
}
