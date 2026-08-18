// Browser-side controller for one dashboard widget.
//
// <DashboardApp> renders the shell and calls initDashboard() on it. This file
// owns the dropzone, the loaded-file chips and the two-file comparison, then
// hands rendering to the views the PRESET declares — it neither knows nor asks
// which platform it is showing, and adding a preset changes nothing here.

import { getPreset } from "./presets";
import { strings, type AnalyticsStrings } from "./i18n";
import { ParseError, shapeOf, type Dataset, type Lang, type Preset, type ViewContext } from "./types";
import { formatCount } from "./numbers";
import { el } from "./views/dom";

/** Entry point called by <DashboardApp> for every widget on the page. */
export function initDashboard(root: HTMLElement): void {
  // May be invoked twice for the same element (immediate call + the
  // astro:page-load listener), so bind listeners only once.
  if (root.dataset.anReady === "1") return;
  root.dataset.anReady = "1";

  const preset = getPreset(root.dataset.preset ?? "");
  const lang = (root.dataset.lang as Lang) ?? "en";
  if (!preset) return;

  new Dashboard(root, preset, lang, strings[lang]);
}

class Dashboard {
  private datasets: Dataset[] = [];
  /** Bumped on every render so a slow chart import can't paint stale data. */
  private renderToken = 0;
  private charts: { destroy(): void }[] = [];

  private readonly el: {
    input: HTMLInputElement;
    drop: HTMLElement;
    error: HTMLElement;
    files: HTMLElement;
    howTo: HTMLElement | null;
    views: HTMLElement;
  };

  constructor(
    private readonly root: HTMLElement,
    private readonly preset: Preset,
    private readonly lang: Lang,
    private readonly t: AnalyticsStrings
  ) {
    const q = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
    this.el = {
      input: q<HTMLInputElement>("[data-an-input]"),
      drop: q("[data-an-drop]"),
      error: q("[data-an-error]"),
      files: q("[data-an-files]"),
      howTo: root.querySelector<HTMLElement>("[data-an-howto]"),
      views: q("[data-an-views]"),
    };
    this.bind();
  }

  // --- wiring -------------------------------------------------------------

  private bind(): void {
    const { input, drop } = this.el;

    input.addEventListener("change", () => {
      if (input.files) void this.addFiles(Array.from(input.files));
      // Reset so re-picking the same file still fires a change event.
      input.value = "";
    });

    ["dragenter", "dragover"].forEach((ev) =>
      drop.addEventListener(ev, (e) => {
        e.preventDefault();
        drop.classList.add("border-primary", "bg-base-200");
      })
    );
    ["dragleave", "drop"].forEach((ev) =>
      drop.addEventListener(ev, (e) => {
        e.preventDefault();
        if (ev === "dragleave" && drop.contains((e as DragEvent).relatedTarget as Node)) return;
        drop.classList.remove("border-primary", "bg-base-200");
      })
    );
    drop.addEventListener("drop", (e) => {
      const files = (e as DragEvent).dataTransfer?.files;
      if (files && files.length) void this.addFiles(Array.from(files));
    });
  }

  // --- file intake --------------------------------------------------------

  private async addFiles(files: File[]): Promise<void> {
    this.clearError();
    for (const file of files) {
      try {
        const text = await file.text();
        const dataset = this.preset.parse(text, file.name, this.lang);

        // Both guards below re-read this.datasets rather than a value captured
        // before the await: `file.text()` yields, so another selection can land
        // while it is pending, and a stale snapshot would let that one through.
        if (this.datasets.length >= 2) {
          this.showError(this.t.errTooMany);
          break;
        }

        // Two different export shapes share no metrics and often no dimension,
        // so refuse the pairing rather than render a meaningless comparison.
        // Compared against EVERY loaded dataset, which makes the rule symmetric
        // by construction — whichever shape was dropped first, a later one that
        // disagrees is refused — instead of relying on the two-file cap to make
        // "the first dataset" happen to mean "the other one".
        if (this.datasets.some((loaded) => loaded.shapeId !== dataset.shapeId)) {
          this.showError(this.t.errMismatch);
          continue;
        }

        this.datasets.push(dataset);
      } catch (err) {
        this.showError(this.messageFor(err));
      }
    }
    this.render();
  }

  private messageFor(err: unknown): string {
    if (err instanceof ParseError) {
      if (err.code === "unrecognised") {
        // Name the formats this preset actually reads, so the message is
        // useful on a dashboard the reader may have picked by mistake.
        return this.t.errUnrecognised(
          this.preset.shapes.map((s) => s.label[this.lang]).join(", ")
        );
      }
      if (err.code === "empty") return this.t.errEmpty;
      return this.t.errBadCsv;
    }
    return this.t.errRead;
  }

  private showError(message: string): void {
    this.el.error.textContent = message;
    this.el.error.classList.remove("hidden");
  }

  private clearError(): void {
    this.el.error.textContent = "";
    this.el.error.classList.add("hidden");
  }

  // --- rendering ----------------------------------------------------------

  private get comparing(): boolean {
    return this.datasets.length === 2;
  }

  private render(): void {
    const token = ++this.renderToken;
    this.renderFiles();
    this.destroyCharts();
    this.el.views.innerHTML = "";

    if (this.datasets.length === 0) {
      this.el.views.classList.add("hidden");
      this.el.howTo?.classList.remove("hidden");
      return;
    }

    this.el.views.classList.remove("hidden");
    this.el.howTo?.classList.add("hidden");

    const ctx: ViewContext = {
      lang: this.lang,
      t: this.t,
      preset: this.preset,
      current: this.datasets[this.datasets.length - 1],
      baseline: this.comparing ? this.datasets[0] : null,
      comparing: this.comparing,
      // Charts registered after a newer render started belong to stale data;
      // destroy them on arrival instead of letting them paint over the new view.
      registerChart: (chart) => {
        if (token === this.renderToken) this.charts.push(chart);
        else chart.destroy();
      },
    };

    for (const view of this.preset.views) {
      if (!view.supports(ctx)) continue;

      const section = el("section", "mb-10");
      section.appendChild(el("h2", "text-xl font-bold mb-1", view.title(this.t, ctx)));
      const intro = view.intro?.(this.t, ctx);
      if (intro) section.appendChild(el("p", "text-sm opacity-70 mb-3 max-w-3xl", intro));

      const host = el("div", "");
      section.appendChild(host);
      this.el.views.appendChild(section);

      // A view that throws takes its own section down, not the dashboard.
      try {
        const result = view.mount(host, ctx);
        if (result instanceof Promise) result.catch(() => this.viewFailed(host));
      } catch {
        this.viewFailed(host);
      }
    }
  }

  private viewFailed(host: HTMLElement): void {
    host.appendChild(
      el("div", "alert alert-warning rounded-lg text-xs py-2", this.t.chartUnavailable)
    );
  }

  private renderFiles(): void {
    const { files } = this.el;
    files.innerHTML = "";
    if (this.datasets.length === 0) {
      files.classList.add("hidden");
      return;
    }
    files.classList.remove("hidden");

    const list = el("div", "flex flex-wrap items-center gap-2");

    this.datasets.forEach((dataset, index) => {
      const chip = el(
        "span",
        "inline-flex items-center gap-2 rounded-lg border border-base-300 bg-base-200 px-3 py-1.5 text-sm"
      );

      if (this.comparing) {
        chip.appendChild(
          el(
            "span",
            `badge badge-sm ${index === 0 ? "badge-secondary" : "badge-accent"}`,
            index === 0 ? this.t.periodA : this.t.periodB
          )
        );
      }

      const name = el("span", "font-medium max-w-[16rem] truncate", dataset.filename);
      chip.appendChild(name);

      const shapeLabel = shapeOf(this.preset, dataset.shapeId)?.label[this.lang] ?? dataset.shapeId;
      chip.appendChild(
        el(
          "span",
          "opacity-60 text-xs whitespace-nowrap",
          `${shapeLabel} · ${this.t.rowsLabel(formatCount(dataset.rows.length, this.lang))}`
        )
      );

      const remove = el("button", "btn btn-ghost btn-xs px-1", "✕") as HTMLButtonElement;
      remove.type = "button";
      remove.setAttribute("aria-label", `${this.t.removeFile}: ${dataset.filename}`);
      remove.addEventListener("click", () => {
        this.datasets.splice(index, 1);
        this.clearError();
        this.render();
      });
      chip.appendChild(remove);

      list.appendChild(chip);
    });

    files.appendChild(list);

    const actions = el("div", "mt-2 flex flex-wrap items-center gap-3 text-xs");

    if (this.comparing) {
      const swap = el("button", "btn btn-outline btn-xs", this.t.swapPeriods) as HTMLButtonElement;
      swap.type = "button";
      swap.addEventListener("click", () => {
        this.datasets.reverse();
        this.render();
      });
      actions.appendChild(swap);
    } else {
      actions.appendChild(el("span", "opacity-70", this.t.addSecond));
    }

    const clear = el("button", "btn btn-ghost btn-xs", this.t.clearAll) as HTMLButtonElement;
    clear.type = "button";
    clear.addEventListener("click", () => {
      this.datasets = [];
      this.clearError();
      this.render();
    });
    actions.appendChild(clear);

    files.appendChild(actions);
  }

  private destroyCharts(): void {
    for (const chart of this.charts) chart.destroy();
    this.charts = [];
  }
}
