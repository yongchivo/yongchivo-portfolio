// Chart.js wrappers for every chart the dashboard draws.
//
// Chart.js is bundled from node_modules and served same-origin, uses <canvas>
// rather than injected markup and contains no eval()/new Function(), so it runs
// under the site's CSP (`script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'`)
// with no policy change — unlike a CDN build, which the policy would block.
// Only the controllers, elements and scales these charts need are registered,
// so the auto-registering barrel never gets pulled into the bundle.
//
// The funnel view deliberately does NOT live here: it is built from HTML so it
// can print a drop-off percentage BETWEEN the stages, which a canvas bar chart
// has nowhere to put.

import type { Chart as ChartType, ChartConfiguration } from "chart.js";

import type { Metric, Metrics } from "./types";
import { formatMetric } from "./numbers";

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

/** Two periods, in comparison order: baseline recedes, current leads. */
export const PERIOD_COLORS = [theme.purple, theme.cyan];

/** Categorical palette for breakdowns, ordered for contrast when truncated. */
export const SERIES_COLORS = [
  theme.cyan,
  theme.magenta,
  theme.green,
  theme.amber,
  theme.purple,
  theme.red,
  "#60a5fa",
  "#f472b6",
];

export const TIER_COLOR = { good: theme.green, warn: theme.amber, bad: theme.red } as const;

/** Everything a chart needs to label and format itself. */
export interface ChartContext {
  lang: string;
  currency?: string;
}

/** Loaded once, then reused — the module registers globals on first import. */
let chartLib: typeof import("chart.js") | null = null;

async function loadChart(): Promise<typeof import("chart.js")> {
  if (chartLib) return chartLib;
  const lib = await import("chart.js");
  lib.Chart.register(
    lib.BarController,
    lib.BarElement,
    lib.LineController,
    lib.LineElement,
    lib.ScatterController,
    lib.DoughnutController,
    lib.ArcElement,
    lib.PointElement,
    lib.LinearScale,
    lib.CategoryScale,
    lib.Filler,
    lib.Tooltip,
    lib.Legend
  );
  lib.Chart.defaults.color = theme.muted;
  lib.Chart.defaults.font.family =
    'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
  chartLib = lib;
  return lib;
}

// Deliberately un-annotated: typing this as ChartConfiguration["options"] drags
// in the union of every chart type's `scales`, which then refuses to spread into
// a doughnut config. The inferred structural type spreads into all of them.
function baseOptions() {
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

function tooltipStyle() {
  return baseOptions().plugins.tooltip;
}

/** Truncate a long page URL, query or source name so a tooltip stays one line. */
function short(key: string, max = 60): string {
  return key.length > max ? `${key.slice(0, max - 1)}…` : key;
}

// --- scatter (dimensional) ------------------------------------------------

export interface ScatterSeries {
  label: string;
  points: { x: number; y: number; key: string; extra: Metrics }[];
}

/**
 * Every row as a dot. Outliers are the point: bottom-left is a good ranking
 * with a title nobody clicks, top-right is a page people want that hasn't been
 * pushed up yet.
 */
export async function renderScatter(
  canvas: HTMLCanvasElement,
  series: ScatterSeries[],
  config: { xMetric: Metric; yMetric: Metric; extraMetrics: Metric[] },
  ctx: ChartContext
): Promise<ChartType> {
  const { Chart } = await loadChart();
  const comparing = series.length > 1;
  const colors = comparing ? PERIOD_COLORS : [theme.cyan];
  const { xMetric, yMetric, extraMetrics } = config;

  return new Chart(canvas, {
    type: "scatter",
    data: {
      datasets: series.map((s, i) => ({
        label: s.label,
        data: s.points,
        backgroundColor: comparing && i === 0 ? `${colors[i]}66` : `${colors[i]}cc`,
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
          title: { display: true, text: xMetric.label[ctx.lang as "en"], color: theme.muted },
          min: 0,
          grid: { color: theme.grid },
          ticks: { color: theme.muted, precision: 0 },
        },
        y: {
          type: "linear",
          title: { display: true, text: yMetric.label[ctx.lang as "en"], color: theme.muted },
          min: 0,
          grid: { color: theme.grid },
          ticks: { color: theme.muted, callback: (v) => `${v}%` },
        },
      },
      plugins: {
        ...baseOptions().plugins,
        legend: { display: comparing, labels: { color: theme.muted, usePointStyle: true } },
        tooltip: {
          ...tooltipStyle(),
          callbacks: {
            title: (items) => short((items[0].raw as { key: string }).key),
            label: (item) => {
              const point = item.raw as { x: number; y: number; extra: Metrics };
              return [
                `${xMetric.label[ctx.lang as "en"]}: ${formatMetric(point.x, xMetric, ctx.lang)}`,
                `${yMetric.label[ctx.lang as "en"]}: ${formatMetric(point.y / 100, yMetric, ctx.lang)}`,
                ...extraMetrics.map(
                  (m) =>
                    `${m.label[ctx.lang as "en"]}: ${formatMetric(point.extra[m.id] ?? 0, m, ctx.lang, ctx.currency)}`
                ),
              ];
            },
          },
        },
      },
    },
  });
}

// --- bars (distribution, weekday) -----------------------------------------

export interface BarSeries {
  label: string;
  values: number[];
  /** Per-bar colours; a single colour applies to every bar. */
  color?: string | string[];
}

/**
 * Grouped vertical bars. Serves both the position distribution and the weekday
 * rollup — one series normally, two when comparing periods.
 */
export async function renderBars(
  canvas: HTMLCanvasElement,
  config: {
    labels: string[];
    series: BarSeries[];
    metric: Metric;
    xTitle?: string;
    yTitle?: string;
    /** Extra tooltip lines, keyed by bar index. */
    note?: (seriesIndex: number, barIndex: number) => string | null;
  },
  ctx: ChartContext
): Promise<ChartType> {
  const { Chart } = await loadChart();
  const comparing = config.series.length > 1;

  return new Chart(canvas, {
    type: "bar",
    data: {
      labels: config.labels,
      datasets: config.series.map((s, i) => ({
        label: s.label,
        data: s.values,
        backgroundColor: comparing
          ? `${PERIOD_COLORS[i]}cc`
          : Array.isArray(s.color)
            ? s.color.map((c) => `${c}cc`)
            : `${s.color ?? theme.cyan}cc`,
        borderColor: comparing ? PERIOD_COLORS[i] : (s.color ?? theme.cyan),
        borderWidth: 1,
        borderRadius: 4,
      })),
    },
    options: {
      ...baseOptions(),
      scales: {
        x: {
          title: config.xTitle
            ? { display: true, text: config.xTitle, color: theme.muted }
            : { display: false },
          grid: { display: false },
          ticks: { color: theme.muted },
        },
        y: {
          title: config.yTitle
            ? { display: true, text: config.yTitle, color: theme.muted }
            : { display: false },
          beginAtZero: true,
          grid: { color: theme.grid },
          ticks: {
            color: theme.muted,
            callback: (v) => formatMetric(Number(v), config.metric, ctx.lang, ctx.currency, true),
          },
        },
      },
      plugins: {
        ...baseOptions().plugins,
        legend: { display: comparing, labels: { color: theme.muted, usePointStyle: true } },
        tooltip: {
          ...tooltipStyle(),
          callbacks: {
            label: (item) => {
              const value = formatMetric(
                Number(item.parsed.y ?? 0),
                config.metric,
                ctx.lang,
                ctx.currency
              );
              const line = comparing ? `${item.dataset.label}: ${value}` : value;
              const note = config.note?.(item.datasetIndex, item.dataIndex);
              return note ? [line, note] : line;
            },
          },
        },
      },
    },
  });
}

// --- dual-axis line (time series) -----------------------------------------

export interface LineSeries {
  label: string;
  values: (number | null)[];
  metric: Metric;
  /** "left" or "right" y-axis. */
  axis: "left" | "right";
  color: string;
  /** Dashed for the baseline period. */
  dashed?: boolean;
}

/**
 * Time series with an independent scale per axis, so a downloads count and a
 * proceeds figure — which differ by orders of magnitude — can share one chart
 * without either flattening into the baseline.
 */
export async function renderDualAxisLine(
  canvas: HTMLCanvasElement,
  config: { labels: string[]; series: LineSeries[] },
  ctx: ChartContext
): Promise<ChartType> {
  const { Chart } = await loadChart();
  const usesRight = config.series.some((s) => s.axis === "right");
  const leftMetric = config.series.find((s) => s.axis === "left")?.metric;
  const rightMetric = config.series.find((s) => s.axis === "right")?.metric;

  return new Chart(canvas, {
    type: "line",
    data: {
      labels: config.labels,
      datasets: config.series.map((s) => ({
        label: s.label,
        data: s.values,
        yAxisID: s.axis === "right" ? "yRight" : "yLeft",
        borderColor: s.color,
        backgroundColor: `${s.color}22`,
        borderWidth: 2,
        borderDash: s.dashed ? [5, 4] : undefined,
        pointRadius: config.labels.length > 40 ? 0 : 2.5,
        pointHoverRadius: 5,
        tension: 0.25,
        fill: s.axis === "left" && !s.dashed,
        spanGaps: true,
      })),
    },
    options: {
      ...baseOptions(),
      interaction: { mode: "index", intersect: false },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: theme.muted,
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 12,
          },
        },
        yLeft: {
          type: "linear",
          position: "left",
          beginAtZero: true,
          title: leftMetric
            ? { display: true, text: leftMetric.label[ctx.lang as "en"], color: theme.muted }
            : undefined,
          grid: { color: theme.grid },
          ticks: {
            color: theme.muted,
            callback: (v) =>
              leftMetric
                ? formatMetric(Number(v), leftMetric, ctx.lang, ctx.currency, true)
                : String(v),
          },
        },
        yRight: {
          type: "linear",
          position: "right",
          display: usesRight,
          beginAtZero: true,
          title: rightMetric
            ? { display: true, text: rightMetric.label[ctx.lang as "en"], color: theme.muted }
            : undefined,
          // Only the left axis draws gridlines, or they interleave into moiré.
          grid: { drawOnChartArea: false },
          ticks: {
            color: theme.muted,
            callback: (v) =>
              rightMetric
                ? formatMetric(Number(v), rightMetric, ctx.lang, ctx.currency, true)
                : String(v),
          },
        },
      },
      plugins: {
        ...baseOptions().plugins,
        legend: { display: true, labels: { color: theme.muted, usePointStyle: true } },
        tooltip: {
          ...tooltipStyle(),
          displayColors: true,
          callbacks: {
            label: (item) => {
              const series = config.series[item.datasetIndex];
              const value = Number(item.parsed.y ?? 0);
              return `${series.label}: ${formatMetric(value, series.metric, ctx.lang, ctx.currency)}`;
            },
          },
        },
      },
    },
  });
}

// --- doughnut (breakdown) -------------------------------------------------

/** Share of a total by category — where the downloads actually came from. */
export async function renderDoughnut(
  canvas: HTMLCanvasElement,
  config: { labels: string[]; values: number[]; metric: Metric },
  ctx: ChartContext
): Promise<ChartType> {
  const { Chart } = await loadChart();
  const total = config.values.reduce((a, b) => a + b, 0);

  // Annotated rather than inferred: spreading the shared base options widens the
  // config away from "doughnut", and `cutout` only exists on that variant.
  const doughnutConfig: ChartConfiguration<"doughnut"> = {
    type: "doughnut",
    data: {
      labels: config.labels,
      datasets: [
        {
          data: config.values,
          backgroundColor: config.labels.map(
            (_, i) => `${SERIES_COLORS[i % SERIES_COLORS.length]}cc`
          ),
          borderColor: theme.surface,
          borderWidth: 2,
        },
      ],
    },
    options: {
      ...baseOptions(),
      cutout: "58%",
      plugins: {
        ...baseOptions().plugins,
        // The breakdown view renders its own ranked list with figures and
        // shares, so an in-chart legend would just repeat it.
        legend: { display: false },
        tooltip: {
          ...tooltipStyle(),
          callbacks: {
            label: (item) => {
              const value = Number(item.parsed ?? 0);
              const share = total > 0 ? (value / total) * 100 : 0;
              return `${formatMetric(value, config.metric, ctx.lang, ctx.currency)} · ${share.toFixed(1)}%`;
            },
          },
        },
      },
    },
  };

  return new Chart(canvas, doughnutConfig);
}
