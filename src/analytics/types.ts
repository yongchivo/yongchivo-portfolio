// Shared shapes for the analytics dashboard.
//
// The dashboard is preset-driven: every platform ships ONE module under
// ./presets that knows how to sniff and parse that platform's export, and
// declares which views it wants. Nothing downstream learns a platform's name.
//
// Two things are deliberately generic, because platforms disagree about both:
//
//  - METRICS. A row carries a bag of numbers keyed by preset-defined metric
//    ids, not fixed fields, so Search Console's clicks/impressions/ctr/position
//    and App Store Connect's units/proceeds/pageViews live in the same shape.
//    A `Metric` descriptor says how each one formats and how it AGGREGATES,
//    which is the part that is easy to get wrong: totals sum, average position
//    is impression-weighted, and CTR is derived from the totals rather than
//    averaged across rows.
//
//  - DIMENSIONS. Search Console data is dimensional (one row per query), App
//    Store Connect's is temporal (one row per day, sometimes several per day
//    split by device or source). Rows therefore carry an optional parsed
//    `date` and an optional bag of `facets`, and views declare which of those
//    they need via `supports()`.

export type Lang = "en" | "es";

/** Numbers for one row, keyed by preset-defined metric id. */
export type Metrics = Record<string, number>;

/** A single parsed record: one query, one page, one day, one day×device… */
export interface Row {
  /** The dimension value — the query text, the page URL, an ISO date. */
  key: string;
  /** Set when the dimension is temporal; drives the time-based views. */
  date?: Date;
  metrics: Metrics;
  /** Extra dimensions, e.g. { device: "iPhone", source: "App Store Search" }. */
  facets?: Record<string, string>;
}

/** One uploaded file, parsed. */
export interface Dataset {
  /** Preset that produced it, e.g. "gsc". */
  presetId: string;
  /** Which export shape it is within that preset, e.g. "queries" | "sales". */
  shapeId: string;
  /** Original filename — the only label the user recognises. */
  filename: string;
  rows: Row[];
  /** Metric ids this file actually carried, so views can hide what's missing. */
  available: string[];
  /** Facet ids this file carried, same reason. */
  facets: string[];
  /** ISO currency code for money metrics, when the export declares one. */
  currency?: string;
  /** Localised notes worth showing above the views (e.g. mixed currencies). */
  warnings?: string[];
}

// --- metrics --------------------------------------------------------------

/** How a metric formats. */
export type MetricKind = "count" | "money" | "ratio" | "position";

/**
 * How a metric aggregates across rows.
 *  - "sum": add them up. Counts and money.
 *  - "weightedMean": Σ(value × weight) / Σ(weight). Average position.
 *  - "derived": computed from the other totals, never averaged. CTR and
 *    conversion rate, which are ratios and so cannot be meaned across rows.
 */
export type Aggregation = "sum" | "weightedMean" | "derived";

export interface Metric {
  id: string;
  label: Record<Lang, string>;
  kind: MetricKind;
  agg: Aggregation;
  /** Metric id to weight by, for `agg: "weightedMean"`. */
  weightBy?: string;
  /** Computes the total from the other totals, for `agg: "derived"`. */
  derive?: (totals: Metrics) => number;
  /** Metric ids this derived metric needs before it can be shown. */
  needs?: string[];
  /** True when a DECREASE is an improvement — average position, and only that. */
  lowerIsBetter?: boolean;
}

export function metricOf(preset: Preset, id: string): Metric | undefined {
  return preset.metrics.find((m) => m.id === id);
}

/** Whether a dataset carries everything a metric needs to be shown. */
export function hasMetric(dataset: Dataset, metric: Metric): boolean {
  if (metric.agg === "derived") {
    return (metric.needs ?? []).every((id) => dataset.available.includes(id));
  }
  return dataset.available.includes(metric.id);
}

// --- table columns --------------------------------------------------------

export interface Column {
  /** "key" for the dimension column, otherwise a metric id. */
  field: string;
  /** Only needed for the dimension column; metrics use their own label. */
  label?: Record<Lang, string>;
}

// --- export shapes --------------------------------------------------------

export interface Shape {
  id: string;
  /** Human name of the export, e.g. "Queries" / "Consultas". */
  label: Record<Lang, string>;
  /** Singular name of one row's subject, e.g. "Query" / "Consulta". */
  entity: Record<Lang, string>;
  /** Plural of the same — spelled out, because "query" doesn't take an s. */
  entityPlural: Record<Lang, string>;
}

// --- views ----------------------------------------------------------------

export interface ViewContext {
  lang: Lang;
  /** Dashboard UI strings. Typed loosely here to keep ./i18n out of the cycle. */
  t: import("./i18n").AnalyticsStrings;
  preset: Preset;
  /** The period whose absolute numbers are shown. */
  current: Dataset;
  /** The baseline period when two files are loaded, else null. */
  baseline: Dataset | null;
  comparing: boolean;
  /** Hand a chart over so the controller can destroy it on the next render. */
  registerChart(chart: { destroy(): void }): void;
}

/**
 * One section of the dashboard. Views are declared by the preset and are
 * reusable across presets — the App Store time series would serve Play Console
 * unchanged — so anything platform-specific arrives through the factory's
 * config, never through a check on `preset.id`.
 */
export interface View {
  id: string;
  /** False when this dataset lacks the metrics or dimensions the view needs. */
  supports(ctx: ViewContext): boolean;
  /** Heading. Gets the context too, so it can name the shape it is showing. */
  title(t: import("./i18n").AnalyticsStrings, ctx: ViewContext): string;
  intro?(t: import("./i18n").AnalyticsStrings, ctx: ViewContext): string;
  /** Render into `host`. Async so a view can lazily import Chart.js. */
  mount(host: HTMLElement, ctx: ViewContext): void | Promise<void>;
}

// --- presets --------------------------------------------------------------

export interface PresetCopy {
  /** <title> — targets the exact search query. */
  title: string;
  /** meta description. */
  description: string;
  /** H1. */
  h1: string;
  /** One-sentence intro shown under the H1. */
  intro: string;
  /** Card title on the /analytics/ landing. */
  cardTitle: string;
  /** Card blurb on the /analytics/ landing. */
  cardDesc: string;
  /** Label inside the dropzone. */
  dropLabel: string;
  /** Steps telling the user where to get the file. Rendered as a list. */
  howTo: string[];
}

export interface Preset {
  /** URL slug and stable id, e.g. "gsc". */
  id: string;
  /** "soon" presets get a card on the landing but no page of their own. */
  status: "live" | "soon";
  /** `accept` attribute for the file input. */
  accept: string;
  copy: Record<Lang, PresetCopy>;
  shapes: Shape[];
  metrics: Metric[];
  /** Metric ids for the summary cards, in order. Missing ones are skipped. */
  summaryMetrics: string[];
  /** Table columns, in display order. Presets without a table view omit this. */
  columns?: Column[];
  /** Views to render, in order. Each is asked whether it supports the data. */
  views: View[];
  /**
   * Parse one exported file. Throws a `ParseError` when the file isn't a shape
   * this preset recognises, so the widget can show a useful message. `lang` is
   * passed in so a parser can localise any warning about what it had to assume.
   */
  parse(text: string, filename: string, lang: Lang): Dataset;
}

/** A parse failure the UI is expected to show verbatim to the user. */
export class ParseError extends Error {
  constructor(
    /** Key into the i18n strings so the message can be localised. */
    readonly code: "unrecognised" | "empty" | "badCsv",
    message = code
  ) {
    super(message);
    this.name = "ParseError";
  }
}

export function shapeOf(preset: Preset, shapeId: string): Shape | undefined {
  return preset.shapes.find((s) => s.id === shapeId);
}
