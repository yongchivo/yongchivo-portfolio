// Google Search Console preset.
//
// Reads the CSVs from Search Console's own "Export" button on the Performance
// report — the ZIP contains Queries.csv, Pages.csv, Countries.csv, Devices.csv
// and Dates.csv; this preset handles the two that carry a ranking dimension:
//
//   Queries.csv  Top queries,Clicks,Impressions,CTR,Position
//   Pages.csv    Top pages,Clicks,Impressions,CTR,Position
//
// Which of the two you dropped is worked out from the header row, so the user
// never picks a format. Spanish exports (Consultas principales / Páginas
// principales) are recognised too, since the account language decides the
// header text and half this site's audience runs Search Console in Spanish.

import Papa from "papaparse";

import { parseCount, parseCtr, parseDecimal } from "../numbers";
import { ParseError, type Dataset, type Preset, type Row } from "../types";

/** Lower-case, unaccented, whitespace-collapsed — the form aliases are held in. */
function normaliseHeader(h: string): string {
  return h
    .replace(/^\uFEFF/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036F]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

// The dimension column identifies the export. Longest-lived aliases first; the
// bare forms cover exports that came from the API or a spreadsheet round-trip.
const KEY_ALIASES: Record<string, string[]> = {
  queries: ["top queries", "queries", "query", "consultas principales", "consultas", "consulta"],
  pages: [
    "top pages",
    "pages",
    "page",
    "paginas principales",
    "paginas mas populares",
    "paginas",
    "pagina",
    "url",
  ],
};

const METRIC_ALIASES = {
  clicks: ["clicks", "clics", "clicks totales", "total clicks"],
  impressions: ["impressions", "impresiones", "total impressions", "impresiones totales"],
  ctr: ["ctr", "click through rate", "porcentaje de clics", "ctr medio", "average ctr"],
  position: ["position", "posicion", "average position", "posicion media", "posicion promedio"],
} as const;

type MetricName = keyof typeof METRIC_ALIASES;

function findColumn(headers: string[], aliases: readonly string[]): string | null {
  for (const alias of aliases) {
    const hit = headers.find((h) => normaliseHeader(h) === alias);
    if (hit) return hit;
  }
  return null;
}

/** Which export is this? `null` when the header row matches neither shape. */
function detectShape(headers: string[]): string | null {
  for (const [shapeId, aliases] of Object.entries(KEY_ALIASES)) {
    if (findColumn(headers, aliases)) return shapeId;
  }
  return null;
}

export const gsc: Preset = {
  id: "gsc",
  status: "live",
  accept: ".csv,text/csv",

  shapes: [
    {
      id: "queries",
      label: { en: "Queries", es: "Consultas" },
      entity: { en: "Query", es: "Consulta" },
      entityPlural: { en: "Queries", es: "Consultas" },
    },
    {
      id: "pages",
      label: { en: "Pages", es: "Páginas" },
      entity: { en: "Page", es: "Página" },
      entityPlural: { en: "Pages", es: "Páginas" },
    },
  ],

  columns: [
    { field: "key", label: { en: "Query / Page", es: "Consulta / Página" }, type: "text" },
    { field: "clicks", label: { en: "Clicks", es: "Clics" }, type: "int" },
    { field: "impressions", label: { en: "Impressions", es: "Impresiones" }, type: "int" },
    { field: "ctr", label: { en: "CTR", es: "CTR" }, type: "percent" },
    { field: "position", label: { en: "Position", es: "Posición" }, type: "position" },
  ],

  copy: {
    en: {
      title: "Google Search Console Analyzer — Free GSC Dashboard | Yongchivo",
      description:
        "Upload your Search Console CSV export and analyze search console data in seconds: CTR vs position outliers, ranking distribution and period-over-period deltas. 100% in your browser.",
      h1: "Google Search Console Analyzer",
      intro:
        "Drop the Queries.csv or Pages.csv from your Search Console export and get the views the native GSC dashboard doesn't give you — CTR against position, where your rankings actually sit, and a real side-by-side comparison of two date ranges.",
      cardTitle: "Google Search Console",
      cardDesc:
        "Analyze a Queries or Pages CSV export: summary totals, a sortable table, a CTR-vs-position scatter and a ranking distribution — plus two-file comparison.",
      dropLabel: "Drop your Search Console CSV here",
      howTo: [
        "Open Search Console → Performance → Search results.",
        "Set your date range, then click Export → Download CSV.",
        "Unzip it and drop Queries.csv or Pages.csv here.",
        "Drop a second export from a different date range to compare the two.",
      ],
    },
    es: {
      title: "Analizador de Google Search Console — Panel GSC Gratis | Yongchivo",
      description:
        "Sube tu CSV de Search Console y analiza datos de Search Console en segundos: CTR frente a posición, distribución de posiciones y comparación entre periodos. 100% en tu navegador.",
      h1: "Analizador de Google Search Console",
      intro:
        "Arrastra el Consultas.csv o Páginas.csv de tu exportación de Search Console y obtén las vistas que el panel nativo de GSC no te da — CTR frente a posición, dónde están de verdad tus posiciones y una comparación real entre dos rangos de fechas.",
      cardTitle: "Google Search Console",
      cardDesc:
        "Analiza una exportación CSV de Consultas o Páginas: totales, tabla ordenable, dispersión CTR-posición y distribución de posiciones — más comparación de dos archivos.",
      dropLabel: "Arrastra aquí tu CSV de Search Console",
      howTo: [
        "Abre Search Console → Rendimiento → Resultados de búsqueda.",
        "Elige el rango de fechas y pulsa Exportar → Descargar CSV.",
        "Descomprime el ZIP y suelta aquí Consultas.csv o Páginas.csv.",
        "Suelta una segunda exportación de otro rango de fechas para comparar.",
      ],
    },
  },

  parse(text: string, filename: string): Dataset {
    const clean = text.replace(/^\uFEFF/, "");
    const parsed = Papa.parse<Record<string, string>>(clean, {
      header: true,
      skipEmptyLines: "greedy",
    });

    const headers = parsed.meta.fields ?? [];
    if (headers.length === 0) throw new ParseError("badCsv");

    const shapeId = detectShape(headers);
    if (!shapeId) throw new ParseError("unrecognised");

    const keyColumn = findColumn(headers, KEY_ALIASES[shapeId])!;
    const metricColumns = {} as Record<MetricName, string | null>;
    for (const name of Object.keys(METRIC_ALIASES) as MetricName[]) {
      metricColumns[name] = findColumn(headers, METRIC_ALIASES[name]);
    }
    // Clicks and impressions are what everything downstream aggregates; without
    // them the file is some other Search Console export (Dates.csv, Filters.csv).
    if (!metricColumns.clicks || !metricColumns.impressions) throw new ParseError("unrecognised");

    const rows: Row[] = [];
    for (const record of parsed.data) {
      const key = (record[keyColumn] ?? "").trim();
      if (!key) continue;
      const clicks = parseCount(record[metricColumns.clicks!]);
      const impressions = parseCount(record[metricColumns.impressions!]);
      // A missing CTR column is recoverable — it is just clicks/impressions.
      const ctr = metricColumns.ctr
        ? parseCtr(record[metricColumns.ctr])
        : impressions > 0
          ? clicks / impressions
          : 0;
      const position = metricColumns.position ? parseDecimal(record[metricColumns.position]) : 0;
      rows.push({ key, clicks, impressions, ctr, position });
    }

    if (rows.length === 0) throw new ParseError("empty");

    return { presetId: "gsc", shapeId, filename, rows };
  },
};
