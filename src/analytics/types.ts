// Shared shapes for the analytics dashboard.
//
// The dashboard is preset-driven: every platform (Google Search Console today,
// App Store Connect / Play Console later) ships ONE module under ./presets that
// knows how to sniff and parse that platform's export. Everything downstream —
// the summary cards, the table, both charts and the comparison mode — works off
// the neutral `Dataset` produced here and never learns a platform's name.

export type Lang = "en" | "es";

/** A single parsed record: one query, one page, one app screen… */
export interface Row {
  /** The dimension value — the query text, the page URL, etc. */
  key: string;
  clicks: number;
  impressions: number;
  /** Click-through rate as a FRACTION (0.0345), never a percentage. */
  ctr: number;
  /** Average position in the results. */
  position: number;
}

/** One uploaded file, parsed. */
export interface Dataset {
  /** Preset that produced it, e.g. "gsc". */
  presetId: string;
  /** Which export shape it is within that preset, e.g. "queries" | "pages". */
  shapeId: string;
  /** Original filename — the only label the user recognises. */
  filename: string;
  rows: Row[];
}

/** Aggregates for the summary cards. */
export interface Totals {
  rows: number;
  clicks: number;
  impressions: number;
  /** Weighted: total clicks / total impressions — not a mean of per-row CTRs. */
  ctr: number;
  /** Impression-weighted, the same way Search Console averages it. */
  position: number;
}

/** How a column renders and sorts in the table. */
export type ColumnType = "text" | "int" | "percent" | "position";

export interface Column {
  field: keyof Row;
  label: Record<Lang, string>;
  type: ColumnType;
}

/** The export shapes a preset can recognise. */
export interface Shape {
  id: string;
  /** Human name of the export, e.g. "Queries" / "Consultas". */
  label: Record<Lang, string>;
  /** Singular name of one row's subject, e.g. "Query" / "Consulta". */
  entity: Record<Lang, string>;
  /** Plural of the same — spelled out, because "query" doesn't pluralise with an s. */
  entityPlural: Record<Lang, string>;
}

export interface PresetCopy {
  /** <title> — targets the exact search query. */
  title: string;
  /** meta description. */
  description: string;
  /** H1. */
  h1: string;
  /** One-sentence intro under the H1. */
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
  /** Table columns, in display order. */
  columns: Column[];
  /**
   * Parse one exported file. Throws a `ParseError` when the file isn't a shape
   * this preset recognises, so the widget can show a useful message.
   */
  parse(text: string, filename: string): Dataset;
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
