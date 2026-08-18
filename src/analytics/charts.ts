// Chart.js wrappers for the two dashboard charts.
//
// Chart.js is bundled from node_modules and served same-origin, uses <canvas>
// rather than injected markup and contains no eval()/new Function(), so it runs
// under the site's CSP (`script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'`)
// with no policy change — unlike a CDN build, which the policy would block.
// Only the controllers, elements and scales these two charts need are
// registered, so the auto-registering barrel never gets pulled into the bundle.

import type { Chart as ChartType, ChartConfiguration } from "chart.js";

import { POSITION_BUCKETS } from "./insights";
import type { Row } from "./types";
import { formatCount, formatPercent, formatPosition } from "./numbers";
import type { AnalyticsStrings } from "./i18n";

// The site is single-theme (daisyUI "yongchivo", dark). These mirror
// tailwind.config.cjs so the charts sit in the same palette as everything else.
export const theme = {
  magenta: "#d946ef",
  purple: "#a855f7",
  cyan: "#22d3ee",
  green: "#34d399",
  amber: "#fbbf24",
  red: "#fb7185",
  text: "#e8e6f2",
  muted: "rgba(232, 230, 242, 0.6)",
  grid: "rgba(232, 230, 242, 0.10)",
  surface: "#131120",
  border: "#1c1a2e",
};

const TIER_COLOR = { good: theme.green, warn: theme.amber, bad: theme.red } as const;

export interface Series {
  label: string;
  rows: Row[];
}

/** Loaded once, then reused — the module registers globals on first import. */
let chartLib: typeof import("chart.js") | null = null;

async function loadChart(): Promise<typeof import("chart.js")> {
  if (chartLib) return chartLib;
  const lib = await import("chart.js");
  lib.Chart.register(
    lib.BarController,
    lib.BarElement,
    lib.ScatterController,
    lib.PointElement,
    lib.LinearScale,
    lib.CategoryScale,
    lib.Tooltip,
    lib.Legend
  );
  lib.Chart.defaults.color = theme.muted;
  lib.Chart.defaults.font.family =
    'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
  chartLib = lib;
  return lib;
}

function baseOptions(): ChartConfiguration["options"] {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 250 },
    plugins: {
      legend: { labels: { color: theme.muted, boxWidth: 10, usePointStyle: true } },
      tooltip: {
        backgroundColor: theme.surface,
        borderColor: theme.border,
        borderWidth: 1,
        titleColor: theme.text,
        bodyColor: theme.muted,
        padding: 10,
        displayColors: false,
      },
    },
  };
}

/** Truncate a long page URL or query so a tooltip stays one line. */
function short(key: string, max = 60): string {
  return key.length > max ? `${key.slice(0, max - 1)}…` : key;
}

/**
 * VIEW 3 — every row as a dot, position across, CTR up. Outliers are the point:
 * bottom-left is a good ranking with a title nobody clicks, top-right is a page
 * people want that hasn't been pushed up yet.
 */
export async function renderScatter(
  canvas: HTMLCanvasElement,
  series: Series[],
  lang: string,
  t: AnalyticsStrings
): Promise<ChartType> {
  const { Chart } = await loadChart();
  // Two series = comparison: the baseline recedes, the current period leads.
  const colors = series.length > 1 ? [theme.purple, theme.cyan] : [theme.cyan];

  return new Chart(canvas, {
    type: "scatter",
    data: {
      datasets: series.map((s, i) => ({
        label: s.label,
        data: s.rows.map((r) => ({
          x: r.position,
          y: r.ctr * 100,
          k: r.key,
          clicks: r.clicks,
          impressions: r.impressions,
        })),
        backgroundColor: series.length > 1 && i === 0 ? `${colors[i]}66` : `${colors[i]}cc`,
        borderColor: colors[i],
        borderWidth: 1,
        pointRadius: 3.5,
        pointHoverRadius: 6,
      })),
    },
    options: {
      ...baseOptions(),
      scales: {
        x: {
          type: "linear",
          title: { display: true, text: t.scatterX, color: theme.muted },
          min: 0,
          grid: { color: theme.grid },
          ticks: { color: theme.muted, precision: 0 },
        },
        y: {
          type: "linear",
          title: { display: true, text: t.scatterY, color: theme.muted },
          min: 0,
          grid: { color: theme.grid },
          ticks: { color: theme.muted, callback: (v) => `${v}%` },
        },
      },
      plugins: {
        ...baseOptions()!.plugins,
        legend: { display: series.length > 1, labels: { color: theme.muted, usePointStyle: true } },
        tooltip: {
          ...baseOptions()!.plugins!.tooltip,
          callbacks: {
            title: (items) => short((items[0].raw as { k: string }).k),
            label: (item) => {
              const p = item.raw as { x: number; y: number; clicks: number; impressions: number };
              return [
                `${t.scatterX}: ${formatPosition(p.x, lang)}`,
                `CTR: ${formatPercent(p.y / 100, lang)}`,
                `${t.totalClicks}: ${formatCount(p.clicks, lang)}`,
                `${t.totalImpressions}: ${formatCount(p.impressions, lang)}`,
              ];
            },
          },
        },
      },
    },
  });
}

/**
 * VIEW 4 — how many rows sit in each position band. Single series colours each
 * bar by its tier (page one green, page two amber, past that red); a comparison
 * drops the tier colours so the two periods stay distinguishable.
 */
export async function renderDistribution(
  canvas: HTMLCanvasElement,
  series: { label: string; counts: number[] }[],
  lang: string,
  t: AnalyticsStrings
): Promise<ChartType> {
  const { Chart } = await loadChart();
  const comparing = series.length > 1;
  const periodColors = [theme.purple, theme.cyan];

  return new Chart(canvas, {
    type: "bar",
    data: {
      labels: POSITION_BUCKETS.map((b) => b.label),
      datasets: series.map((s, i) => ({
        label: s.label,
        data: s.counts,
        backgroundColor: comparing
          ? `${periodColors[i]}cc`
          : POSITION_BUCKETS.map((b) => `${TIER_COLOR[b.tier]}cc`),
        borderColor: comparing ? periodColors[i] : POSITION_BUCKETS.map((b) => TIER_COLOR[b.tier]),
        borderWidth: 1,
        borderRadius: 4,
      })),
    },
    options: {
      ...baseOptions(),
      scales: {
        x: {
          title: { display: true, text: t.distX, color: theme.muted },
          grid: { display: false },
          ticks: { color: theme.muted },
        },
        y: {
          title: { display: true, text: t.distY, color: theme.muted },
          beginAtZero: true,
          grid: { color: theme.grid },
          ticks: { color: theme.muted, precision: 0 },
        },
      },
      plugins: {
        ...baseOptions()!.plugins,
        legend: { display: comparing, labels: { color: theme.muted, usePointStyle: true } },
        tooltip: {
          ...baseOptions()!.plugins!.tooltip,
          callbacks: {
            label: (item) => `${item.dataset.label}: ${formatCount(Number(item.parsed.y ?? 0), lang)}`,
          },
        },
      },
    },
  });
}
