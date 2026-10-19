// Google Play Console preset.
//
// Reads the monthly reports from Play Console → Download reports (the same
// files that land in the account's Cloud Storage bucket):
//
//   INSTALLS   Statistics → Installs. installs_<package>_<YYYYMM>_<dimension>.csv
//              Date, Package Name, [dimension], Daily Device Installs, Daily
//              User Installs, Daily User Uninstalls… The overview file has no
//              dimension column; country, device, OS etc. add one.
//   STORE      Statistics → Store performance. store_performance_<package>_…
//              Date, Package name, [Country / region | Traffic source…], Store
//              listing acquisitions, Store listing visitors, conversion rate.
//   EARNINGS   Financial → Earnings. One row per transaction (charge, Google
//              fee, tax, refunds), amounts signed, so the sum is net earnings.
//
// Two things to know about these files:
//
//  1. ENCODING. The statistics CSVs are UTF-16. Decoding happens before the
//     preset sees the text (see readText in ../controller).
//  2. EARNINGS ROWS ARE NOT SALES. A sale is a "Charge" row plus a negative
//     "Google fee" row and sometimes a "Tax" row. Summing the merchant amount
//     gives what you are paid; counting rows would triple-count purchases, so
//     only "Charge" rows count as one.

import Papa from "papaparse";

import { detectDateOrder, isoDay, parseDate } from "../dates";
import { parseCount, parseMoney } from "../numbers";
import { strings } from "../i18n";
import { ParseError, type Dataset, type Lang, type Preset, type Row } from "../types";
import { findColumn } from "./headers";
import { summaryView } from "../views/summary";
import { timeSeriesView } from "../views/timeseries";
import { funnelView } from "../views/funnel";
import { weekdayView } from "../views/weekday";
import { breakdownView } from "../views/breakdown";

const DATE_ALIASES = ["date", "transaction date"];

// First alias wins, so user-level installs (people) beat device-level ones.
const METRIC_ALIASES = {
  units: ["daily user installs", "daily device installs", "install events", "store listing acquisitions"],
  uninstalls: ["daily user uninstalls", "daily device uninstalls", "uninstall events"],
  pageViews: ["store listing visitors"],
  proceeds: ["amount (merchant currency)"],
} as const;

const CURRENCY_ALIASES = ["merchant currency"];
const TRANSACTION_TYPE_ALIASES = ["transaction type"];

const FACET_ALIASES = {
  source: ["traffic source"],
  device: ["device"],
  territory: ["country", "country / region", "buyer country"],
} as const;

type MetricName = keyof typeof METRIC_ALIASES;
type FacetName = keyof typeof FACET_ALIASES;

export const playConsole: Preset = {
  id: "play-console",
  status: "live",
  accept: ".csv,text/csv",

  shapes: [
    {
      id: "installs",
      label: { en: "Installs", es: "Instalaciones" },
      entity: { en: "Day", es: "Día" },
      entityPlural: { en: "Days", es: "Días" },
    },
    {
      id: "store",
      label: { en: "Store performance", es: "Rendimiento de la ficha" },
      entity: { en: "Day", es: "Día" },
      entityPlural: { en: "Days", es: "Días" },
    },
    {
      id: "earnings",
      label: { en: "Earnings", es: "Ingresos" },
      entity: { en: "Day", es: "Día" },
      entityPlural: { en: "Days", es: "Días" },
    },
  ],

  metrics: [
    {
      id: "units",
      label: { en: "Installs", es: "Instalaciones" },
      kind: "count",
      agg: "sum",
    },
    {
      id: "uninstalls",
      label: { en: "Uninstalls", es: "Desinstalaciones" },
      kind: "count",
      agg: "sum",
      lowerIsBetter: true,
    },
    {
      id: "pageViews",
      label: { en: "Store listing visitors", es: "Visitantes de la ficha" },
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
      id: "proceeds",
      label: { en: "Earnings", es: "Ingresos" },
      kind: "money",
      agg: "sum",
    },
    {
      id: "conversionRate",
      label: { en: "Conversion rate", es: "Tasa de conversión" },
      kind: "ratio",
      // From the totals, never a mean of the daily rates in the file.
      agg: "derived",
      needs: ["units", "pageViews"],
      derive: (t) => (t.pageViews > 0 ? t.units / t.pageViews : 0),
    },
  ],

  summaryMetrics: ["units", "uninstalls", "pageViews", "conversionRate", "purchases", "proceeds"],

  // Installs and earnings never share a file, so the second time series only
  // renders for an Earnings report — the first one's `supports()` needs installs.
  views: [
    summaryView(),
    timeSeriesView({ leftMetric: "units", rightMetric: "proceeds" }),
    timeSeriesView({ leftMetric: "proceeds" }),
    funnelView({ stages: ["pageViews", "units"] }),
    weekdayView({ metrics: ["units", "proceeds"] }),
    breakdownView({ facet: "source", metric: "units" }),
  ],

  copy: {
    en: {
      title: "Google Play Console Analytics — Free Installs & Earnings Analyzer | Yongchivo",
      description:
        "Upload your Google Play Console reports and read them in seconds: installs and uninstalls over time, the store listing conversion funnel, earnings, best days of the week and period comparison. 100% in your browser.",
      h1: "Google Play Console Analytics",
      intro:
        "Drop an Installs, Store performance or Earnings report and get the views Play Console spreads across screens — installs against uninstalls on one chart, store listing visitors to installs with the drop-off, net earnings per day and which days of the week actually perform.",
      cardTitle: "Google Play Console",
      cardDesc:
        "Analyze an Installs, Store performance or Earnings report: installs and uninstalls over time, the store listing funnel, net earnings and day-of-week performance.",
      dropLabel: "Drop your Google Play Console report here",
      howTo: [
        "Play Console → Download reports → Statistics → pick the app, the month and Installs or Store performance → Download.",
        "For revenue: Play Console → Download reports → Financial → Earnings → Download, then unzip it.",
        "Drop the CSV here — the UTF-16 files Play Console exports are read as they are.",
        "Drop a second report from another month to compare the two.",
      ],
    },
    es: {
      title: "Analítica de Google Play Console — Analizador de Instalaciones | Yongchivo",
      description:
        "Sube tus informes de Google Play Console y léelos en segundos: instalaciones y desinstalaciones en el tiempo, embudo de conversión de la ficha, ingresos, mejores días de la semana y comparación entre periodos. 100% en tu navegador.",
      h1: "Analítica de Google Play Console",
      intro:
        "Arrastra un informe de Instalaciones, Rendimiento de la ficha o Ingresos y obtén las vistas que Play Console reparte entre pantallas — instalaciones frente a desinstalaciones en un mismo gráfico, de visitantes de la ficha a instalaciones con su abandono, ingresos netos por día y qué días de la semana funcionan de verdad.",
      cardTitle: "Google Play Console",
      cardDesc:
        "Analiza un informe de Instalaciones, Rendimiento de la ficha o Ingresos: instalaciones y desinstalaciones en el tiempo, embudo de la ficha, ingresos netos y rendimiento por día de la semana.",
      dropLabel: "Arrastra aquí tu informe de Google Play Console",
      howTo: [
        "Play Console → Descargar informes → Estadísticas → elige la app, el mes e Instalaciones o Rendimiento de la ficha → Descargar.",
        "Para ingresos: Play Console → Descargar informes → Financieros → Ingresos → Descargar, y descomprímelo.",
        "Suelta aquí el CSV — los archivos UTF-16 que exporta Play Console se leen tal cual.",
        "Suelta un segundo informe de otro mes para comparar los dos.",
      ],
    },
  },

  parse(text: string, filename: string, lang: Lang): Dataset {
    const parsed = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ""), {
      header: true,
      skipEmptyLines: "greedy",
    });
    const headers = parsed.meta.fields ?? [];
    if (headers.length === 0) throw new ParseError("badCsv");

    const dateColumn = findColumn(headers, DATE_ALIASES);
    if (!dateColumn) throw new ParseError("unrecognised");

    const metricColumns = {} as Record<MetricName, string | null>;
    for (const name of Object.keys(METRIC_ALIASES) as MetricName[]) {
      metricColumns[name] = findColumn(headers, METRIC_ALIASES[name]);
    }
    const facetColumns = {} as Record<FacetName, string | null>;
    for (const name of Object.keys(FACET_ALIASES) as FacetName[]) {
      facetColumns[name] = findColumn(headers, FACET_ALIASES[name]);
    }
    const currencyColumn = findColumn(headers, CURRENCY_ALIASES);
    const typeColumn = findColumn(headers, TRANSACTION_TYPE_ALIASES);

    const shapeId = metricColumns.proceeds
      ? "earnings"
      : metricColumns.pageViews
        ? "store"
        : metricColumns.units || metricColumns.uninstalls
          ? "installs"
          : null;
    if (!shapeId) throw new ParseError("unrecognised");

    const order = detectDateOrder(parsed.data.slice(0, 200).map((r) => r[dateColumn] ?? ""));

    const rows: Row[] = [];
    const currencies = new Set<string>();
    const seenFacets = new Set<string>();

    for (const record of parsed.data) {
      const date = parseDate(record[dateColumn], order);
      if (!date) continue;

      const metrics: Record<string, number> = {};
      for (const name of Object.keys(METRIC_ALIASES) as MetricName[]) {
        const column = metricColumns[name];
        if (!column) continue;
        metrics[name] =
          name === "proceeds" ? parseMoney(record[column]) : parseCount(record[column]);
      }
      if (typeColumn) {
        metrics.purchases = (record[typeColumn] ?? "").trim().toLowerCase() === "charge" ? 1 : 0;
      }

      const facets: Record<string, string> = {};
      for (const name of Object.keys(FACET_ALIASES) as FacetName[]) {
        const column = facetColumns[name];
        const value = column ? (record[column] ?? "").trim() : "";
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

    const available: string[] = (Object.keys(METRIC_ALIASES) as MetricName[]).filter(
      (name) => metricColumns[name]
    );
    if (typeColumn) available.push("purchases");

    const warnings =
      currencies.size > 1 ? [strings[lang].mixedCurrency([...currencies].sort().join(", "))] : undefined;

    return {
      presetId: "play-console",
      shapeId,
      filename,
      rows,
      available,
      facets: [...seenFacets],
      currency: currencies.size === 1 ? [...currencies][0] : undefined,
      warnings,
    };
  },
};
