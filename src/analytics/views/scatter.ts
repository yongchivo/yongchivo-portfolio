// VIEW — two metrics plotted against each other, one dot per row.
//
// Configured with the axes rather than hard-coded to CTR and position, so any
// dimensional preset can point it at its own pair.

import { chartBox, withChart } from "./dom";
import { renderScatter } from "../charts";
import { hasMetric, metricOf, type View } from "../types";

export function scatterView(config: {
  xMetric: string;
  yMetric: string;
  /** Extra metrics to list in the tooltip. */
  tooltipMetrics?: string[];
}): View {
  return {
    id: "scatter",

    supports(ctx) {
      const x = metricOf(ctx.preset, config.xMetric);
      const y = metricOf(ctx.preset, config.yMetric);
      return Boolean(x && y && hasMetric(ctx.current, x) && hasMetric(ctx.current, y));
    },

    title: (t) => t.scatterTitle,
    intro: (t) => t.scatterIntro,

    async mount(host, ctx) {
      const x = metricOf(ctx.preset, config.xMetric)!;
      const y = metricOf(ctx.preset, config.yMetric)!;
      const extras = (config.tooltipMetrics ?? [])
        .map((id) => metricOf(ctx.preset, id))
        .filter((m): m is NonNullable<typeof m> => Boolean(m));

      const periods = ctx.baseline
        ? [
            { label: `${ctx.t.periodA} · ${ctx.baseline.filename}`, dataset: ctx.baseline },
            { label: `${ctx.t.periodB} · ${ctx.current.filename}`, dataset: ctx.current },
          ]
        : [{ label: ctx.current.filename, dataset: ctx.current }];

      const canvas = chartBox(host, "h-[360px]", ctx.t.scatterTitle);
      await withChart(
        host,
        ctx.t,
        () =>
          renderScatter(
            canvas,
            periods.map((p) => ({
              label: p.label,
              points: p.dataset.rows.map((row) => ({
                x: row.metrics[x.id] ?? 0,
                // Ratios plot as percentages; the axis is labelled "%".
                y: (row.metrics[y.id] ?? 0) * 100,
                key: row.key,
                extra: row.metrics,
              })),
            })),
            { xMetric: x, yMetric: y, extraMetrics: extras },
            { lang: ctx.lang, currency: ctx.current.currency }
          ),
        ctx.registerChart
      );
    },
  };
}
