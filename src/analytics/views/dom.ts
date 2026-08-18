// Small DOM helpers shared by the view modules.
//
// Everything here builds nodes and sets textContent — never innerHTML with
// values that came out of a CSV. Keys, source names and filenames are all
// user-supplied and can hold anything.

import type { AnalyticsStrings } from "../i18n";
import { formatMetric, isImprovement } from "../numbers";
import type { Metric } from "../types";

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = "",
  text?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** A bordered surface with a canvas sized to `heightClass`. */
export function chartBox(host: HTMLElement, heightClass: string, label: string): HTMLCanvasElement {
  const box = el("div", `rounded-xl border border-base-300 bg-base-200 p-3 ${heightClass}`);
  const canvas = el("canvas");
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", label);
  box.appendChild(canvas);
  host.appendChild(box);
  return canvas;
}

/**
 * Run a chart render, degrading to a message instead of an exception. Every
 * view keeps its own fallback so one failed chart can't blank the dashboard.
 */
export async function withChart(
  host: HTMLElement,
  t: AnalyticsStrings,
  render: () => Promise<{ destroy(): void }>,
  register: (chart: { destroy(): void }) => void
): Promise<void> {
  try {
    register(await render());
  } catch {
    host.appendChild(
      el("div", "alert alert-warning rounded-lg text-xs py-2 mt-2", t.chartUnavailable)
    );
  }
}

/** "▲ 1,204" in green or red, by whether the change is an improvement. */
export function deltaChip(
  value: number,
  metric: Metric,
  lang: string,
  currency: string | undefined,
  extraClass = ""
): HTMLElement | null {
  if (value === 0) return null;
  const span = el(
    "span",
    `font-medium tabular-nums ${isImprovement(metric, value) ? "text-success" : "text-error"} ${extraClass}`
  );
  span.textContent = `${value > 0 ? "▲" : "▼"} ${formatMetric(Math.abs(value), metric, lang, currency)}`;
  return span;
}

/** One big number with its label, and a delta line when comparing. */
export function statCard(config: {
  label: string;
  value: string;
  delta?: { value: number; metric: Metric } | null;
  lang: string;
  currency?: string;
  vsLabel: string;
}): HTMLElement {
  const box = el("div", "rounded-xl border border-base-300 bg-base-200 p-4");
  box.appendChild(el("div", "text-xs uppercase tracking-wide opacity-60", config.label));
  box.appendChild(el("div", "mt-1 text-2xl md:text-3xl font-bold tabular-nums", config.value));

  if (config.delta) {
    const chip = deltaChip(
      config.delta.value,
      config.delta.metric,
      config.lang,
      config.currency,
      "mt-1 text-xs block"
    );
    if (chip) {
      chip.append(` ${config.vsLabel}`);
      box.appendChild(chip);
    }
  }
  return box;
}

/** A muted paragraph under a view. */
export function note(text: string): HTMLElement {
  return el("p", "mt-2 text-xs opacity-60", text);
}
