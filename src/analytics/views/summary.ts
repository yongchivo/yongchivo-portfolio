// VIEW — the headline numbers, with period-over-period deltas when comparing.
//
// Preset-agnostic: it renders whichever of the preset's `summaryMetrics` the
// uploaded file can actually support, so a Sales export shows two cards and an
// App Analytics export shows four without either preset saying so.

import { statCard, el } from "./dom";
import { formatMetric, totalsOf } from "../numbers";
import { hasMetric, metricOf, type View, type ViewContext } from "../types";
import type { AnalyticsStrings } from "../i18n";

export function summaryView(config: { note?: (t: AnalyticsStrings) => string } = {}): View {
  return {
    id: "summary",

    supports(ctx) {
      return ctx.preset.summaryMetrics.some((id) => {
        const metric = metricOf(ctx.preset, id);
        return metric ? hasMetric(ctx.current, metric) : false;
      });
    },

    title: (t) => t.summaryTitle,

    mount(host, ctx) {
      const { preset, current, baseline, lang, t } = ctx;

      // Warnings first: a mixed-currency export makes the money card a lie, and
      // the reader needs that before the number, not after it.
      for (const warning of current.warnings ?? []) {
        host.appendChild(el("div", "alert alert-warning rounded-lg text-xs py-2 mb-3", warning));
      }

      const shown = preset.summaryMetrics
        .map((id) => metricOf(preset, id))
        .filter((m): m is NonNullable<typeof m> => Boolean(m) && hasMetric(current, m!));

      const now = totalsOf(current.rows, preset.metrics);
      const before = baseline ? totalsOf(baseline.rows, preset.metrics) : null;

      // Written out rather than built by concatenation: Tailwind compiles the
      // class names it can SEE in the source, so `"lg:grid-cols-" + n` yields a
      // class that never exists in the stylesheet.
      const columns =
        shown.length >= 4
          ? "lg:grid-cols-4"
          : shown.length === 3
            ? "lg:grid-cols-3"
            : "lg:grid-cols-2";
      const grid = el("div", `grid gap-3 grid-cols-2 ${columns}`);

      for (const metric of shown) {
        grid.appendChild(
          statCard({
            label: metric.label[lang],
            value: formatMetric(now[metric.id] ?? 0, metric, lang, current.currency, true),
            delta: before ? { value: (now[metric.id] ?? 0) - (before[metric.id] ?? 0), metric } : null,
            lang,
            currency: current.currency,
            vsLabel: t.vsPrevious,
          })
        );
      }

      host.appendChild(grid);
      if (config.note) host.appendChild(el("p", "mt-2 text-xs opacity-60", config.note(t)));
    },
  };
}
