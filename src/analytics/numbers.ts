// Number parsing and formatting shared by every preset.
//
// Platform exports are locale-formatted: Search Console will hand you
// "1,234" / "1.234" for counts, "3.45%" / "3,45 %" for CTR and "12.3" / "12,3"
// for position depending on the account language. Parsing has to survive all of
// them, so counts drop every separator and decimals resolve the separator by
// position rather than by guessing a locale.

import type { Row, Totals } from "./types";

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
  let s = String(raw).replace(/[%\s ]/g, "");
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

export function totalsOf(rows: Row[]): Totals {
  let clicks = 0;
  let impressions = 0;
  let weightedPosition = 0;
  for (const r of rows) {
    clicks += r.clicks;
    impressions += r.impressions;
    weightedPosition += r.position * r.impressions;
  }
  return {
    rows: rows.length,
    clicks,
    impressions,
    ctr: impressions > 0 ? clicks / impressions : 0,
    // Impression-weighted, matching how Search Console averages position.
    // Falls back to a plain mean when a file somehow carries no impressions.
    position:
      impressions > 0
        ? weightedPosition / impressions
        : rows.length > 0
          ? rows.reduce((a, r) => a + r.position, 0) / rows.length
          : 0,
  };
}

// --- formatting -----------------------------------------------------------

export function formatCount(n: number, lang: string): string {
  return new Intl.NumberFormat(lang === "es" ? "es-ES" : "en-GB").format(Math.round(n));
}

export function formatCompact(n: number, lang: string): string {
  const abs = Math.abs(n);
  if (abs < 10000) return formatCount(n, lang);
  return new Intl.NumberFormat(lang === "es" ? "es-ES" : "en-GB", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export function formatPercent(fraction: number, lang: string, digits = 2): string {
  return `${new Intl.NumberFormat(lang === "es" ? "es-ES" : "en-GB", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(fraction * 100)}%`;
}

export function formatPosition(n: number, lang: string): string {
  return new Intl.NumberFormat(lang === "es" ? "es-ES" : "en-GB", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(n);
}

/** Signed delta, e.g. "+1,204" / "−3.2". Uses a real minus sign. */
export function formatDelta(n: number, lang: string, kind: "int" | "percent" | "position"): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  const abs = Math.abs(n);
  if (kind === "percent") return `${sign}${formatPercent(abs, lang)}`;
  if (kind === "position") return `${sign}${formatPosition(abs, lang)}`;
  return `${sign}${formatCount(abs, lang)}`;
}
