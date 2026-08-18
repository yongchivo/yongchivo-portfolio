// VIEW — the conversion funnel, stage by stage.
//
// Built from HTML rather than Chart.js on purpose: the useful number is the
// drop-off BETWEEN two stages, and a canvas bar chart has nowhere to put it.
// Plain elements also keep the figures selectable and readable by a screen
// reader, and cost nothing against the CSP.

import { el, note } from "./dom";
import { formatMetric, formatPercent, totalsOf } from "../numbers";
import { hasMetric, metricOf, type Metric, type View } from "../types";

export function funnelView(config: { stages: string[] }): View {
  const stagesFor = (ctx: Parameters<View["supports"]>[0]): Metric[] =>
    config.stages
      .map((id) => metricOf(ctx.preset, id))
      .filter((m): m is Metric => Boolean(m) && hasMetric(ctx.current, m!));

  return {
    id: "funnel",

    // One bar is not a funnel; two stages is the minimum that shows a drop-off.
    supports: (ctx) => stagesFor(ctx).length >= 2,

    title: (t) => t.funnelTitle,
    intro: (t) => t.funnelIntro,

    mount(host, ctx) {
      const { preset, current, baseline, lang, t } = ctx;
      const stages = stagesFor(ctx);
      const now = totalsOf(current.rows, preset.metrics);
      const before = baseline ? totalsOf(baseline.rows, preset.metrics) : null;

      const top = now[stages[0].id] ?? 0;
      const wrapper = el("div", "rounded-xl border border-base-300 bg-base-200 p-4");

      stages.forEach((metric, index) => {
        const value = now[metric.id] ?? 0;
        // Bars are scaled against the top of the funnel, so the narrowing is
        // the shape of the real conversion rather than a rescaled-to-fit lie.
        const width = top > 0 ? Math.max(1.5, (value / top) * 100) : 0;

        const row = el("div", "");
        const head = el("div", "flex flex-wrap items-baseline justify-between gap-2");
        head.appendChild(el("span", "text-sm font-medium", metric.label[lang]));

        const figures = el("div", "flex items-baseline gap-2");
        figures.appendChild(
          el(
            "span",
            "text-lg font-bold tabular-nums",
            formatMetric(value, metric, lang, current.currency, true)
          )
        );
        // Share of the top stage — "of every impression, this many got here".
        if (index > 0 && top > 0) {
          figures.appendChild(
            el("span", "text-xs opacity-60 tabular-nums", formatPercent(value / top, lang, 1))
          );
        }
        if (before) {
          const previous = before[metric.id] ?? 0;
          const change = value - previous;
          if (change !== 0) {
            figures.appendChild(
              el(
                "span",
                `text-xs font-medium tabular-nums ${change > 0 ? "text-success" : "text-error"}`,
                `${change > 0 ? "▲" : "▼"} ${formatMetric(Math.abs(change), metric, lang, current.currency, true)}`
              )
            );
          }
        }
        head.appendChild(figures);
        row.appendChild(head);

        const track = el("div", "mt-1 h-7 w-full rounded-md bg-base-300/60 overflow-hidden");
        const bar = el(
          "div",
          "h-full rounded-md bg-gradient-to-r from-brand-purple to-brand-cyan"
        );
        bar.style.width = `${width}%`;
        track.appendChild(bar);
        row.appendChild(track);
        wrapper.appendChild(row);

        // The drop-off sits between the bars, which is the whole reason this
        // view is HTML and not a chart.
        const next = stages[index + 1];
        if (next) {
          const from = value;
          const to = now[next.id] ?? 0;
          const dropped = from > 0 ? 1 - to / from : 0;
          const line = el("div", "flex items-center gap-2 py-1.5 pl-1 text-xs");
          line.appendChild(el("span", "opacity-50", "↓"));
          line.appendChild(
            el(
              "span",
              from > 0 && dropped > 0 ? "text-error font-medium" : "opacity-60",
              t.funnelDropOff(formatPercent(Math.max(0, dropped), lang, 1))
            )
          );
          line.appendChild(
            el(
              "span",
              "opacity-60",
              t.funnelContinued(formatPercent(from > 0 ? to / from : 0, lang, 1))
            )
          );
          wrapper.appendChild(line);
        }
      });

      host.appendChild(wrapper);
      host.appendChild(note(t.funnelNote));
    },
  };
}
