// VIEW — how many rows sit in each position band.

import { chartBox, withChart } from "./dom";
import { renderBars, TIER_COLOR } from "../charts";
import { POSITION_BUCKETS, bucketCounts } from "../insights";
import { hasMetric, metricOf, type View } from "../types";

export function distributionView(config: { metric: string; countLabel: string }): View {
  return {
    id: "distribution",

    supports(ctx) {
      const metric = metricOf(ctx.preset, config.metric);
      return Boolean(metric && hasMetric(ctx.current, metric));
    },

    title: (t) => t.distTitle,
    intro: (t) => t.distIntro,

    async mount(host, ctx) {
      const periods = ctx.baseline
        ? [
            { label: `${ctx.t.periodA} · ${ctx.baseline.filename}`, dataset: ctx.baseline },
            { label: `${ctx.t.periodB} · ${ctx.current.filename}`, dataset: ctx.current },
          ]
        : [{ label: ctx.current.filename, dataset: ctx.current }];

      // A row count is the y value here, not the position metric itself, so the
      // axis formats as a plain count.
      const countMetric = {
        id: "__rows",
        label: { en: ctx.t.distY, es: ctx.t.distY },
        kind: "count" as const,
        agg: "sum" as const,
      };

      const canvas = chartBox(host, "h-[300px]", ctx.t.distTitle);
      await withChart(
        host,
        ctx.t,
        () =>
          renderBars(
            canvas,
            {
              labels: POSITION_BUCKETS.map((b) => b.label),
              series: periods.map((p) => ({
                label: p.label,
                values: bucketCounts(p.dataset.rows, config.metric),
                // A single series colours each bar by its tier; two periods drop
                // the tier colours so the periods stay distinguishable.
                color: POSITION_BUCKETS.map((b) => TIER_COLOR[b.tier]),
              })),
              metric: countMetric,
              xTitle: ctx.t.distX,
              yTitle: ctx.t.distY,
            },
            { lang: ctx.lang }
          ),
        ctx.registerChart
      );
    },
  };
}
