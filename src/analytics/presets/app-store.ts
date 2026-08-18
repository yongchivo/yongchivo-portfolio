// App Store Connect preset.
//
// Reads the two exports that carry numbers worth looking at:
//
//   SALES        Sales and Trends → Export. Date, Units, Proceeds (+ currency,
//                device, territory, source). Also the classic tab-separated
//                sales report, whose header is the long Provider…Order Type row.
//   APP ANALYTICS  Analytics → Metrics → Export. Date, Impressions, Product
//                Page Views, App Units (+ sessions, purchases, source type).
//
// Three things make these files harder to read than Search Console's:
//
//  1. DELIMITER. The Sales and Trends report is tab-separated; the Analytics
//     export is comma-separated. Neither says which. Sniffed per file.
//  2. PREAMBLE. Analytics exports carry title, app name and date-range lines
//     above the real header row, and sometimes a "Total" row below the data.
//     Both are detected and skipped rather than parsed as data.
//  3. PROCEEDS. In the tab-separated sales report "Developer Proceeds" is the
//     amount per UNIT, not the row total — multiplying is the difference
//     between a right number and a plausible wrong one. See PER_UNIT_ALIASES.

import Papa from "papaparse";

import { detectDateOrder, isoDay, parseDate } from "../dates";
import { parseCount, parseMoney } from "../numbers";
import { strings } from "../i18n";
import { ParseError, type Dataset, type Lang, type Preset, type Row } from "../types";
import { findColumnLoose } from "./headers";
import { summaryView } from "../views/summary";
import { timeSeriesView } from "../views/timeseries";
import { funnelView } from "../views/funnel";
import { weekdayView } from "../views/weekday";
import { breakdownView } from "../views/breakdown";

const DATE_ALIASES = [
  "date",
  "day",
  "begin date",
  "start date",
  "fecha",
  "dia",
  "fecha de inicio",
];

// Metric columns. App Store Connect decorates several of these ("Impressions
// (Unique Devices)", "Total Downloads"), so matching is prefix-tolerant.
const METRIC_ALIASES = {
  units: [
    "units",
    "app units",
    "total downloads",
    "downloads",
    "first time downloads",
    "unidades",
    "unidades de la app",
    "descargas",
    "descargas totales",
    "descargas por primera vez",
  ],
  proceeds: [
    "proceeds",
    "total proceeds",
    "sales",
    "ingresos",
    "ingresos totales",
    "ventas",
  ],
  impressions: ["impressions", "total impressions", "impresiones", "impresiones totales"],
  pageViews: [
    "product page views",
    "page views",
    "product page view",
    "visitas a la pagina de producto",
    "visitas a la pagina del producto",
    "visitas de pagina",
  ],
  sessions: ["sessions", "sessions per active device", "sesiones"],
  purchases: ["purchases", "paid downloads", "conversions", "compras", "descargas de pago"],
} as const;

/**
 * "Developer Proceeds" in Apple's sales report is proceeds PER UNIT, so a row
 * total is units × this value. Kept apart from the plain "Proceeds" aliases,
 * which are already totals, because treating one as the other silently changes
 * the revenue figure by a factor of the units column.
 */
const PER_UNIT_ALIASES = ["developer proceeds", "ingresos del desarrollador"];

const CURRENCY_ALIASES = [
  "proceeds currency",
  "currency of proceeds",
  "currency",
  "moneda",
  "moneda de los ingresos",
  "divisa",
];

const FACET_ALIASES = {
  source: [
    "source",
    "source type",
    "download source",
    "traffic source",
    "origen",
    "tipo de origen",
    "fuente",
  ],
  device: ["device", "device type", "dispositivo", "tipo de dispositivo"],
  territory: ["country", "country code", "territory", "region", "pais", "territorio"],
} as const;

type MetricName = keyof typeof METRIC_ALIASES;
type FacetName = keyof typeof FACET_ALIASES;

/** Tabs or commas — whichever the candidate line has more of. */
function sniffDelimiter(line: string): string {
  const tabs = (line.match(/\t/g) ?? []).length;
  const commas = (line.match(/,/g) ?? []).length;
  const semicolons = (line.match(/;/g) ?? []).length;
  if (tabs >= commas && tabs >= semicolons && tabs > 0) return "\t";
  if (semicolons > commas) return ";";
  return ",";
}

interface HeaderScan {
  /** Text starting at the real header row, with any preamble removed. */
  body: string;
  delimiter: string;
  headers: string[];
}

/**
 * Find the real header row. Analytics exports put the report name, the app name
 * and the date range above it, so the first line is often not the header —
 * instead, the first line that carries a date column AND a known metric is.
 */
function locateHeader(text: string): HeaderScan | null {
  const lines = text.split(/\r\n|\n|\r/);
  const limit = Math.min(lines.length, 30);

  for (let i = 0; i < limit; i += 1) {
    const line = lines[i];
    if (!line.trim()) continue;
    const delimiter = sniffDelimiter(line);
    const headers = line.split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ""));
    if (headers.length < 2) continue;

    const hasDate = Boolean(findColumnLoose(headers, DATE_ALIASES));
    const hasMetric = (Object.keys(METRIC_ALIASES) as MetricName[]).some((name) =>
      findColumnLoose(headers, METRIC_ALIASES[name])
    );
    const hasPerUnit = Boolean(findColumnLoose(headers, PER_UNIT_ALIASES));

    if (hasDate && (hasMetric || hasPerUnit)) {
      return { body: lines.slice(i).join("\n"), delimiter, headers };
    }
  }
  return null;
}

/** Summary rows Apple appends below the data, which are not observations. */
const TOTAL_ROW = /^(total|totals|grand total|resumen|total general|suma)/i;

export const appStore: Preset = {
  id: "app-store",
  status: "live",
  accept: ".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain",

  shapes: [
    {
      id: "sales",
      label: { en: "Sales and Trends", es: "Ventas y tendencias" },
      entity: { en: "Day", es: "Día" },
      entityPlural: { en: "Days", es: "Días" },
    },
    {
      id: "metrics",
      label: { en: "App Analytics", es: "Analíticas de la app" },
      entity: { en: "Day", es: "Día" },
      entityPlural: { en: "Days", es: "Días" },
    },
  ],

  metrics: [
    {
      id: "units",
      label: { en: "Downloads", es: "Descargas" },
      kind: "count",
      agg: "sum",
    },
    {
      id: "proceeds",
      label: { en: "Proceeds", es: "Ingresos" },
      kind: "money",
      agg: "sum",
    },
    {
      id: "impressions",
      label: { en: "Impressions", es: "Impresiones" },
      kind: "count",
      agg: "sum",
    },
    {
      id: "pageViews",
      label: { en: "Product page views", es: "Visitas a la ficha" },
      kind: "count",
      agg: "sum",
    },
    {
      id: "sessions",
      label: { en: "Sessions", es: "Sesiones" },
      kind: "count",
      agg: "sum",
    },
    {
      id: "purchases",
      label: { en: "Purchases", es: "Compras" },
      kind: "count",
      agg: "sum",
    },
    {
      id: "conversionRate",
      label: { en: "Conversion rate", es: "Tasa de conversión" },
      kind: "ratio",
      // Derived from the totals, never averaged across days: a mean of daily
      // rates weights a quiet Sunday the same as a launch day.
      agg: "derived",
      needs: ["units", "impressions"],
      derive: (t) => (t.impressions > 0 ? t.units / t.impressions : 0),
    },
  ],

  summaryMetrics: ["units", "proceeds", "impressions", "conversionRate"],

  // No table view: these exports are one row per day, and a sortable list of
  // dates tells you nothing the time series doesn't show better.
  views: [
    summaryView(),
    timeSeriesView({ leftMetric: "units", rightMetric: "proceeds" }),
    funnelView({ stages: ["impressions", "pageViews", "units", "purchases"] }),
    weekdayView({ metrics: ["units", "proceeds"] }),
    breakdownView({ facet: "source", metric: "units" }),
  ],

  copy: {
    en: {
      title: "App Store Connect Analytics — Free Sales Analyzer | Yongchivo",
      description:
        "Upload your App Store Connect export and read your app store sales in seconds: downloads and revenue over time, the impressions-to-install conversion funnel, best days of the week and period comparison. 100% in your browser.",
      h1: "App Store Connect Analytics",
      intro:
        "Drop a Sales and Trends or App Analytics export and get the views App Store Connect buries — revenue against downloads on one chart, the full impressions-to-install funnel with its drop-offs, and which days of the week actually earn.",
      cardTitle: "App Store Connect",
      cardDesc:
        "Analyze a Sales and Trends or App Analytics export: downloads and proceeds over time, the conversion funnel, day-of-week performance and source breakdown.",
      dropLabel: "Drop your App Store Connect export here",
      howTo: [
        "For sales: App Store Connect → Sales and Trends → set your range → Export.",
        "For the funnel: App Store Connect → Analytics → Metrics → Export as CSV.",
        "Drop the file here — comma or tab separated, both work.",
        "Drop a second export from a different date range to compare the two.",
      ],
    },
    es: {
      title: "Analítica de App Store Connect — Analizador de Ventas | Yongchivo",
      description:
        "Sube tu exportación de App Store Connect y analiza ventas App Store en segundos: descargas e ingresos en el tiempo, embudo de conversión de impresiones a instalaciones, mejores días de la semana y comparación entre periodos. 100% en tu navegador.",
      h1: "Analítica de App Store Connect",
      intro:
        "Arrastra una exportación de Ventas y tendencias o de Analíticas de la app y obtén las vistas que App Store Connect esconde — ingresos frente a descargas en un mismo gráfico, el embudo completo de impresiones a instalaciones con sus abandonos, y qué días de la semana ingresan de verdad.",
      cardTitle: "App Store Connect",
      cardDesc:
        "Analiza una exportación de Ventas y tendencias o de Analíticas: descargas e ingresos en el tiempo, embudo de conversión, rendimiento por día de la semana y reparto por origen.",
      dropLabel: "Arrastra aquí tu exportación de App Store Connect",
      howTo: [
        "Para ventas: App Store Connect → Ventas y tendencias → elige el rango → Exportar.",
        "Para el embudo: App Store Connect → Analíticas → Métricas → Exportar como CSV.",
        "Suelta el archivo aquí — separado por comas o por tabulaciones, ambos valen.",
        "Suelta una segunda exportación de otro rango de fechas para comparar.",
      ],
    },
  },

  parse(text: string, filename: string, lang: Lang): Dataset {
    const clean = text.replace(/^\uFEFF/, "");
    const scan = locateHeader(clean);
    if (!scan) throw new ParseError("unrecognised");

    const parsed = Papa.parse<Record<string, string>>(scan.body, {
      header: true,
      delimiter: scan.delimiter,
      skipEmptyLines: "greedy",
    });
    const headers = parsed.meta.fields ?? scan.headers;
    if (headers.length === 0) throw new ParseError("badCsv");

    const dateColumn = findColumnLoose(headers, DATE_ALIASES);
    if (!dateColumn) throw new ParseError("unrecognised");

    const metricColumns = {} as Record<MetricName, string | null>;
    for (const name of Object.keys(METRIC_ALIASES) as MetricName[]) {
      metricColumns[name] = findColumnLoose(headers, METRIC_ALIASES[name]);
    }
    const perUnitColumn = findColumnLoose(headers, PER_UNIT_ALIASES);
    const currencyColumn = findColumnLoose(headers, CURRENCY_ALIASES);

    const facetColumns = {} as Record<FacetName, string | null>;
    for (const name of Object.keys(FACET_ALIASES) as FacetName[]) {
      facetColumns[name] = findColumnLoose(headers, FACET_ALIASES[name]);
    }

    // An Analytics export is the one carrying funnel metrics; anything else
    // with units or proceeds is a sales export.
    const isAnalytics = Boolean(metricColumns.impressions || metricColumns.pageViews);
    const hasSales = Boolean(metricColumns.units || metricColumns.proceeds || perUnitColumn);
    if (!isAnalytics && !hasSales) throw new ParseError("unrecognised");
    const shapeId = isAnalytics ? "metrics" : "sales";

    // Date order is settled once for the whole column, not row by row.
    const order = detectDateOrder(parsed.data.slice(0, 200).map((r) => r[dateColumn] ?? ""));

    const rows: Row[] = [];
    const currencies = new Set<string>();
    const seenFacets = new Set<string>();
    let usedPerUnit = false;

    for (const record of parsed.data) {
      const raw = (record[dateColumn] ?? "").trim();
      if (!raw || TOTAL_ROW.test(raw)) continue;
      const date = parseDate(raw, order);
      if (!date) continue;

      const metrics: Record<string, number> = {};
      for (const name of Object.keys(METRIC_ALIASES) as MetricName[]) {
        const column = metricColumns[name];
        if (!column) continue;
        metrics[name] =
          name === "proceeds" ? parseMoney(record[column]) : parseCount(record[column]);
      }

      // Per-unit proceeds only become a row total once multiplied by units.
      if (perUnitColumn && metrics.proceeds === undefined) {
        const perUnit = parseMoney(record[perUnitColumn]);
        const units = metrics.units ?? 0;
        metrics.proceeds = perUnit * units;
        if (perUnit !== 0) usedPerUnit = true;
      }

      const facets: Record<string, string> = {};
      for (const name of Object.keys(FACET_ALIASES) as FacetName[]) {
        const column = facetColumns[name];
        if (!column) continue;
        const value = (record[column] ?? "").trim();
        if (!value) continue;
        facets[name] = value;
        seenFacets.add(name);
      }

      if (currencyColumn) {
        const code = (record[currencyColumn] ?? "").trim();
        if (code) currencies.add(code.toUpperCase());
      }

      rows.push({
        key: isoDay(date),
        date,
        metrics,
        facets: Object.keys(facets).length > 0 ? facets : undefined,
      });
    }

    if (rows.length === 0) throw new ParseError("empty");

    const available = (Object.keys(METRIC_ALIASES) as MetricName[]).filter(
      (name) => metricColumns[name]
    ) as string[];
    if (perUnitColumn && !available.includes("proceeds")) available.push("proceeds");

    // Warnings are localised here because the parser is the only place that
    // knows what it had to assume.
    const t = strings[lang];
    const warnings: string[] = [];
    if (currencies.size > 1) warnings.push(t.mixedCurrency([...currencies].sort().join(", ")));
    if (usedPerUnit) warnings.push(t.perUnitProceeds);

    return {
      presetId: "app-store",
      shapeId,
      filename,
      rows,
      available,
      facets: [...seenFacets],
      currency: currencies.size === 1 ? [...currencies][0] : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  },
};
