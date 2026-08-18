// VIEW — which day of the week actually performs.
//
// Offers a metric switch because "best day" means downloads to one reader and
// revenue to another, and the two rarely peak on the same day. The tooltip
// carries the per-day average as well as the total, since a range with six
// Mondays and five Tuesdays flatters Monday.

import { chartBox, el, withChart } from "./dom";
import { renderBars, theme } from "../charts";
import { byWeekday } from "../insights";
import { formatMetric } from "../numbers";
import { hasMetric, metricOf, type Metric, type View } from "../types";

export function weekdayView(config: { metrics: string[] }): View {
  const availableMetrics = (ctx: Parameters<View["supports"]>[0]): Metric[] =>
    config.metrics
      .map((id) => metricOf(ctx.preset, id))
      .filter((m): m is Metric => Boolean(m) && hasMetric(ctx.current, m!));

  return {
    id: "weekday",

    supports: (ctx) =>
      availableMetrics(ctx).length > 0 && ctx.current.rows.some((r) => r.date),

    title: (t) => t.weekdayTitle,
    intro: (t) => t.weekdayIntro,

    async mount(host, ctx) {
      const { preset, current, baseline, lang, t } = ctx;
      const metrics = availableMetrics(ctx);
      let active = metrics[0];

      const periods = baseline
        ? [
            { label: `${t.periodA} · ${baseline.filename}`, rows: baseline.rows },
            { label: `${t.periodB} · ${current.filename}`, rows: current.rows },
          ]
        : [{ label: current.filename, rows: current.rows }];

      // Metric switch, only when there is more than one to switch between.
      const switcher = el("div", "flex flex-wrap items-center gap-1 mb-3");
      const buttons: HTMLButtonElement[] = [];
      if (metrics.length > 1) {
        for (const metric of metrics) {
          const button = el("button", "btn btn-xs") as HTMLButtonElement;
          button.type = "button";
          button.textContent = metric.label[lang];
          button.addEventListener("click", () => {
            if (active === metric) return;
            active = metric;
            paintSwitcher();
            void draw();
          });
          buttons.push(button);
          switcher.appendChild(button);
        }
        host.appendChild(switcher);
      }

      function paintSwitcher(): void {
        buttons.forEach((button, i) => {
          button.className = `btn btn-xs ${metrics[i] === active ? "btn-primary" : "btn-ghost"}`;
        });
      }

      const canvas = chartBox(host, "h-[300px]", t.weekdayTitle);
      let chart: { destroy(): void } | null = null;

      async function draw(): Promise<void> {
        chart?.destroy();
        const buckets = periods.map((p) => byWeekday(p.rows, preset.metrics, lang));
        await withChart(
          host,
          t,
          async () => {
            chart = await renderBars(
              canvas,
              {
                labels: buckets[0].map((b) => b.label),
                series: buckets.map((weekdays, i) => ({
                  label: periods[i].label,
                  values: weekdays.map((b) => b.metrics[active.id] ?? 0),
                  color: theme.cyan,
                })),
                metric: active,
                yTitle: active.label[lang],
                note: (seriesIndex, barIndex) => {
                  const bucket = buckets[seriesIndex]?.[barIndex];
                  if (!bucket || bucket.days === 0) return null;
                  const average = (bucket.metrics[active.id] ?? 0) / bucket.days;
                  return t.weekdayAverage(
                    formatMetric(average, active, lang, current.currency),
                    String(bucket.days)
                  );
                },
              },
              { lang, currency: current.currency }
            );
            return chart;
          },
          ctx.registerChart
        );
      }

      paintSwitcher();
      await draw();
    },
  };
}
