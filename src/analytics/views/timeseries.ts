// VIEW — two metrics over time on independent axes.
//
// Downloads and proceeds differ by orders of magnitude, so a shared axis would
// flatten one of them into the baseline; each gets its own scale instead. Long
// ranges roll up to weeks automatically, because sixty-plus daily points stop
// being readable at this width.

import { chartBox, note, withChart } from "./dom";
import { renderDualAxisLine, theme, PERIOD_COLORS, type LineSeries } from "../charts";
import { pickGranularity, spanInDays, timeSeries } from "../insights";
import { hasMetric, metricOf, type View } from "../types";

export function timeSeriesView(config: { leftMetric: string; rightMetric?: string }): View {
  return {
    id: "timeseries",

    supports(ctx) {
      const left = metricOf(ctx.preset, config.leftMetric);
      const dated = ctx.current.rows.some((r) => r.date);
      return Boolean(left && hasMetric(ctx.current, left) && dated);
    },

    title: (t) => t.timeTitle,
    intro: (t) => t.timeIntro,

    async mount(host, ctx) {
      const { preset, current, baseline, lang, t } = ctx;
      const left = metricOf(preset, config.leftMetric)!;
      const right = config.rightMetric ? metricOf(preset, config.rightMetric) : undefined;
      const showRight = Boolean(right && hasMetric(current, right));

      // Both periods must bucket the same way or the two lines aren't
      // comparable, so the longer range picks the granularity for both.
      const longest = Math.max(
        spanInDays(current.rows),
        baseline ? spanInDays(baseline.rows) : 0
      );
      const granularity = pickGranularity(
        longest === spanInDays(current.rows) ? current.rows : baseline!.rows
      );

      const currentPoints = timeSeries(current.rows, preset.metrics, granularity, lang);
      const basePoints = baseline
        ? timeSeries(baseline.rows, preset.metrics, granularity, lang)
        : null;

      const series: LineSeries[] = [
        {
          label: showRight ? left.label[lang] : `${left.label[lang]} · ${current.filename}`,
          values: currentPoints.map((p) => p.metrics[left.id] ?? 0),
          metric: left,
          axis: "left",
          color: theme.cyan,
        },
      ];
      if (showRight && right) {
        series.push({
          label: right.label[lang],
          values: currentPoints.map((p) => p.metrics[right.id] ?? 0),
          metric: right,
          axis: "right",
          color: theme.magenta,
        });
      }

      if (basePoints) {
        // Two date ranges share no dates, so the baseline is aligned to the
        // START of its own range — point N against point N — and drawn dashed.
        series.unshift({
          label: `${t.periodA} · ${left.label[lang]}`,
          values: currentPoints.map((_, i) => basePoints[i]?.metrics[left.id] ?? null),
          metric: left,
          axis: "left",
          color: PERIOD_COLORS[0],
          dashed: true,
        });
      }

      const canvas = chartBox(host, "h-[340px]", t.timeTitle);
      await withChart(
        host,
        t,
        () =>
          renderDualAxisLine(
            canvas,
            { labels: currentPoints.map((p) => p.label), series },
            { lang, currency: current.currency }
          ),
        ctx.registerChart
      );

      const notes: string[] = [];
      if (granularity === "week") notes.push(t.timeWeekly(String(longest)));
      if (basePoints) notes.push(t.timeAligned);
      if (notes.length) host.appendChild(note(notes.join(" ")));
    },
  };
}
