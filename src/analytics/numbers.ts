// Number parsing, aggregation and formatting shared by every preset.
//
// Platform exports are locale-formatted: Search Console hands you "1,234" or
// "1.234" for counts, "3.45%" or "3,45 %" for CTR; App Store Connect hands you
// "1.234,56" for proceeds depending on the account language. Parsing has to
// survive all of them, so counts drop every separator and decimals resolve the
// separator by position rather than by guessing a locale.

import type { Metric, Metrics, Row } from "./types";

/** Digits only (plus a leading minus) — safe for counts, which are integers. */
export function parseCount(raw: string | number | null | undefined): number {
  if (typeof raw === "number") return Number.isFinite(raw) ? Math.round(raw) : 0;
  if (!raw) return 0;
  const cleaned = String(raw).replace(/[^\d-]/g, "");
  const n = Number.parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Decimal that may use either separator. When both appear, the LAST one is the
 * decimal point ("1.234,5" -> 1234.5, "1,234.5" -> 1234.5); when only a comma
 * appears it is the decimal point ("12,3" -> 12.3).
 */
export function parseDecimal(raw: string | number | null | undefined): number {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  if (!raw) return 0;
  let s = String(raw).replace(/[%\s ]/g, "");
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    // Both present: the later one is the decimal separator.
    s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma > -1) {
    s = s.replace(",", ".");
  }
  const n = Number.parseFloat(s.replace(/[^\d.eE+-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Money. Same separator rules as any decimal, but currency symbols and codes
 * ("$1,234.56", "1.234,56 EUR") have to come off first.
 */
export function parseMoney(raw: string | number | null | undefined): number {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  if (!raw) return 0;
  return parseDecimal(String(raw).replace(/[^\d.,\-]/g, ""));
}

/**
 * CTR as a fraction. Exports write it as "3.45%", as "3.45" or (rarely, via the
 * API) as "0.0345". A bare value above 1 can only be a percentage, and a value
 * with a "%" always is.
 */
export function parseCtr(raw: string | number | null | undefined): number {
  const isPercentLiteral = typeof raw === "string" && raw.includes("%");
  const n = parseDecimal(raw);
  if (isPercentLiteral || n > 1) return n / 100;
  return n;
}

// --- aggregation ----------------------------------------------------------

/**
 * Totals for every metric the preset declares, respecting each one's own rule:
 * counts and money sum, average position is weighted by impressions, and ratios
 * are derived from the finished totals rather than meaned across rows — a mean
 * of per-row CTRs is a different (and wrong) number.
 */
export function totalsOf(rows: Row[], metrics: Metric[]): Metrics {
  const totals: Metrics = {};

  for (const metric of metrics) {
    if (metric.agg === "sum") {
      let sum = 0;
      for (const row of rows) sum += row.metrics[metric.id] ?? 0;
      totals[metric.id] = sum;
    } else if (metric.agg === "weightedMean") {
      let weighted = 0;
      let weight = 0;
      let plain = 0;
      let counted = 0;
      for (const row of rows) {
        const value = row.metrics[metric.id];
        if (value === undefined) continue;
        const w = metric.weightBy ? (row.metrics[metric.weightBy] ?? 0) : 1;
        weighted += value * w;
        weight += w;
        plain += value;
        counted += 1;
      }
      // Fall back to a plain mean when the weights are all zero, so a file with
      // no impressions still reports a position rather than a 0.
      totals[metric.id] = weight > 0 ? weighted / weight : counted > 0 ? plain / counted : 0;
    }
  }

  // Derived metrics run last: they read the sums computed above.
  for (const metric of metrics) {
    if (metric.agg === "derived" && metric.derive) totals[metric.id] = metric.derive(totals);
  }

  return totals;
}

/** Sum one metric over rows. */
export function sumOf(rows: Row[], metricId: string): number {
  let sum = 0;
  for (const row of rows) sum += row.metrics[metricId] ?? 0;
  return sum;
}

// --- formatting -----------------------------------------------------------

const locale = (lang: string) => (lang === "es" ? "es-ES" : "en-GB");

export function formatCount(n: number, lang: string): string {
  return new Intl.NumberFormat(locale(lang)).format(Math.round(n));
}

export function formatCompact(n: number, lang: string): string {
  const abs = Math.abs(n);
  if (abs < 10000) return formatCount(n, lang);
  return new Intl.NumberFormat(locale(lang), {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export function formatPercent(fraction: number, lang: string, digits = 2): string {
  return `${new Intl.NumberFormat(locale(lang), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(fraction * 100)}%`;
}

export function formatPosition(n: number, lang: string): string {
  return new Intl.NumberFormat(locale(lang), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(n);
}

/**
 * Money in the export's own currency. An unknown or non-ISO currency code falls
 * back to a plain decimal rather than throwing, because the code comes from a
 * user-supplied CSV and cannot be trusted to be a real ISO 4217 value.
 */
export function formatMoney(n: number, lang: string, currency?: string, compact = false): string {
  const options: Intl.NumberFormatOptions = compact
    ? { notation: "compact", maximumFractionDigits: 1 }
    : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  if (currency && /^[A-Za-z]{3}$/.test(currency)) {
    try {
      return new Intl.NumberFormat(locale(lang), {
        ...options,
        style: "currency",
        currency: currency.toUpperCase(),
      }).format(n);
    } catch {
      // Fall through to the plain format below.
    }
  }
  const plain = new Intl.NumberFormat(locale(lang), options).format(n);
  return currency ? `${plain} ${currency}` : plain;
}

/** Format a value the way its metric wants to be read. */
export function formatMetric(
  value: number,
  metric: Metric,
  lang: string,
  currency?: string,
  compact = false
): string {
  switch (metric.kind) {
    case "money":
      return formatMoney(value, lang, currency, compact);
    case "ratio":
      return formatPercent(value, lang);
    case "position":
      return formatPosition(value, lang);
    default:
      return compact ? formatCompact(value, lang) : formatCount(value, lang);
  }
}

/** Signed delta, e.g. "+1,204" / "−3.2". Uses a real minus sign. */
export function formatDelta(
  value: number,
  metric: Metric,
  lang: string,
  currency?: string
): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatMetric(Math.abs(value), metric, lang, currency)}`;
}

/**
 * Whether a change is an improvement. Everything is better up except average
 * position, which is better DOWN — the one everybody gets backwards.
 */
export function isImprovement(metric: Metric, value: number): boolean {
  return metric.lowerIsBetter ? value < 0 : value > 0;
}
