// VIEW — share of a metric by one facet (source, device, territory).
//
// Renders only when the export actually carried that facet, so a Sales file
// without a source column simply doesn't get the section rather than getting an
// empty one.

import { chartBox, el, withChart } from "./dom";
import { renderDoughnut, SERIES_COLORS } from "../charts";
import { byFacet } from "../insights";
import { formatMetric, formatPercent } from "../numbers";
import { hasMetric, metricOf, type View } from "../types";

/** Beyond this many slices a doughnut is unreadable; the rest become "Other". */
const MAX_SLICES = 7;

export function breakdownView(config: { facet: string; metric: string }): View {
  return {
    id: `breakdown-${config.facet}`,

    supports(ctx) {
      const metric = metricOf(ctx.preset, config.metric);
      return Boolean(
        metric && hasMetric(ctx.current, metric) && ctx.current.facets.includes(config.facet)
      );
    },

    title: (t) => t.sourceTitle,
    intro: (t) => t.sourceIntro,

    async mount(host, ctx) {
      const { preset, current, lang, t } = ctx;
      const metric = metricOf(preset, config.metric)!;
      const slices = byFacet(current.rows, config.facet, preset.metrics, metric.id);

      const head = slices.slice(0, MAX_SLICES);
      const tail = slices.slice(MAX_SLICES);
      const labels = head.map((s) => s.value);
      const values = head.map((s) => s.metrics[metric.id] ?? 0);
      if (tail.length > 0) {
        labels.push(t.otherSources);
        values.push(tail.reduce((sum, s) => sum + (s.metrics[metric.id] ?? 0), 0));
      }

      const grid = el("div", "grid gap-4 lg:grid-cols-2 items-center");
      const chartHost = el("div", "");
      grid.appendChild(chartHost);

      // A ranked list beside the doughnut: the chart shows the shape, the list
      // gives the actual figures, which a doughnut is bad at.
      const list = el("div", "flex flex-col gap-1.5");
      labels.forEach((label, i) => {
        const total = values.reduce((a, b) => a + b, 0);
        const row = el("div", "flex items-center gap-2 text-sm");
        const swatch = el("span", "inline-block w-2.5 h-2.5 rounded-sm shrink-0");
        swatch.style.backgroundColor = SERIES_COLORS[i % SERIES_COLORS.length];
        const name = el("span", "truncate grow", label);
        name.title = label;
        row.append(
          swatch,
          name,
          el(
            "span",
            "tabular-nums font-medium shrink-0",
            formatMetric(values[i], metric, lang, current.currency, true)
          ),
          el(
            "span",
            "tabular-nums opacity-60 w-14 text-right shrink-0",
            formatPercent(total > 0 ? values[i] / total : 0, lang, 1)
          )
        );
        list.appendChild(row);
      });
      grid.appendChild(list);
      host.appendChild(grid);

      const canvas = chartBox(chartHost, "h-[280px]", t.sourceTitle);
      await withChart(
        host,
        t,
        () => renderDoughnut(canvas, { labels, values, metric }, { lang, currency: current.currency }),
        ctx.registerChart
      );
    },
  };
}
