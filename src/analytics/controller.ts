// Browser-side controller for one dashboard widget.
//
// <DashboardApp> renders the markup and calls initDashboard() on it; everything
// interactive lives here — the dropzone, the loaded-file chips, the four views
// and the two-file comparison. It is preset-agnostic: the only platform-aware
// call is `preset.parse()`, so a new preset needs nothing in this file.

import { getPreset } from "./presets";
import { strings, type AnalyticsStrings } from "./i18n";
import { ParseError, shapeOf, type Dataset, type Lang, type Preset, type Row } from "./types";
import {
  bucketCounts,
  compare,
  isImprovement,
  positionTier,
  toTableRows,
  type Delta,
  type TableRow,
} from "./insights";
import {
  formatCompact,
  formatCount,
  formatDelta,
  formatPercent,
  formatPosition,
  totalsOf,
} from "./numbers";

type SortField = keyof Row;
type SortDir = "asc" | "desc";

const PAGE_SIZE = 50;

const TIER_CLASS = { good: "text-success", warn: "text-warning", bad: "text-error" } as const;

/**
 * A "lost" row has no position in the current period, so sorting on its literal
 * 0 would park every vanished query above the #1 result. Sort those by the
 * position they used to hold instead, which keeps them where you'd look for them.
 */
function sortValue(row: TableRow, field: SortField): number {
  if (field === "position" && row.status === "lost") {
    return row.before?.position ?? Number.POSITIVE_INFINITY;
  }
  return row[field] as number;
}

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
  private sortField: SortField = "clicks";
  private sortDir: SortDir = "desc";
  private query = "";
  private limit = PAGE_SIZE;
  /** Bumped on every render so a slow chart import can't paint stale data. */
  private renderToken = 0;
  private charts: { destroy(): void }[] = [];

  private readonly el: {
    input: HTMLInputElement;
    drop: HTMLElement;
    error: HTMLElement;
    files: HTMLElement;
    howTo: HTMLElement | null;
    dash: HTMLElement;
    summary: HTMLElement;
    tableTitle: HTMLElement;
    search: HTMLInputElement;
    thead: HTMLElement;
    tbody: HTMLElement;
    count: HTMLElement;
    more: HTMLButtonElement;
    scatter: HTMLCanvasElement;
    dist: HTMLCanvasElement;
    chartError: HTMLElement;
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
      dash: q("[data-an-dash]"),
      summary: q("[data-an-summary]"),
      tableTitle: q("[data-an-table-title]"),
      search: q<HTMLInputElement>("[data-an-search]"),
      thead: q("[data-an-thead]"),
      tbody: q("[data-an-tbody]"),
      count: q("[data-an-count]"),
      more: q<HTMLButtonElement>("[data-an-more]"),
      scatter: q<HTMLCanvasElement>("[data-an-scatter]"),
      dist: q<HTMLCanvasElement>("[data-an-dist]"),
      chartError: q("[data-an-chart-error]"),
    };
    this.bind();
  }

  // --- wiring -------------------------------------------------------------

  private bind(): void {
    const { input, drop, search, more } = this.el;

    input.addEventListener("change", () => {
      if (input.files) this.addFiles(Array.from(input.files));
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
      if (files && files.length) this.addFiles(Array.from(files));
    });

    search.addEventListener("input", () => {
      this.query = search.value.trim().toLowerCase();
      this.limit = PAGE_SIZE;
      this.renderTable();
    });

    more.addEventListener("click", () => {
      this.limit += PAGE_SIZE;
      this.renderTable();
    });
  }

  // --- file intake --------------------------------------------------------

  private async addFiles(files: File[]): Promise<void> {
    this.clearError();
    for (const file of files) {
      if (this.datasets.length >= 2) {
        this.showError(this.t.errTooMany);
        break;
      }
      try {
        const text = await file.text();
        const dataset = this.preset.parse(text, file.name);
        // Comparing Queries against Pages would join on keys that can never
        // match, so refuse it rather than render an empty comparison.
        const existing = this.datasets[0];
        if (existing && existing.shapeId !== dataset.shapeId) {
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
      if (err.code === "unrecognised") return this.t.errUnrecognised;
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

  // --- derived data -------------------------------------------------------

  private get comparing(): boolean {
    return this.datasets.length === 2;
  }

  /** The period whose absolute numbers the summary and charts show. */
  private get current(): Dataset {
    return this.datasets[this.datasets.length - 1];
  }

  private get baseline(): Dataset | null {
    return this.comparing ? this.datasets[0] : null;
  }

  private tableRows(): TableRow[] {
    const baseline = this.baseline;
    return baseline ? compare(baseline, this.current) : toTableRows(this.current);
  }

  // --- rendering ----------------------------------------------------------

  private render(): void {
    const token = ++this.renderToken;
    this.renderFiles();

    if (this.datasets.length === 0) {
      this.el.dash.classList.add("hidden");
      this.el.howTo?.classList.remove("hidden");
      this.destroyCharts();
      return;
    }

    this.el.dash.classList.remove("hidden");
    this.el.howTo?.classList.add("hidden");
    this.limit = PAGE_SIZE;

    this.renderSummary();
    this.renderTableHead();
    this.renderTable();
    void this.renderCharts(token);
  }

  private renderFiles(): void {
    const { files } = this.el;
    files.innerHTML = "";
    if (this.datasets.length === 0) {
      files.classList.add("hidden");
      return;
    }
    files.classList.remove("hidden");

    const list = document.createElement("div");
    list.className = "flex flex-wrap items-center gap-2";

    this.datasets.forEach((dataset, index) => {
      const chip = document.createElement("span");
      chip.className =
        "inline-flex items-center gap-2 rounded-lg border border-base-300 bg-base-200 px-3 py-1.5 text-sm";

      if (this.comparing) {
        const period = document.createElement("span");
        period.className = `badge badge-sm ${index === 0 ? "badge-secondary" : "badge-accent"}`;
        period.textContent = index === 0 ? this.t.periodA : this.t.periodB;
        chip.appendChild(period);
      }

      const name = document.createElement("span");
      name.className = "font-medium max-w-[16rem] truncate";
      name.textContent = dataset.filename;
      chip.appendChild(name);

      const meta = document.createElement("span");
      meta.className = "opacity-60 text-xs whitespace-nowrap";
      const shapeLabel = shapeOf(this.preset, dataset.shapeId)?.label[this.lang] ?? dataset.shapeId;
      meta.textContent = `${shapeLabel} · ${this.t.rowsLabel(formatCount(dataset.rows.length, this.lang))}`;
      chip.appendChild(meta);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "btn btn-ghost btn-xs px-1";
      remove.setAttribute("aria-label", `${this.t.removeFile}: ${dataset.filename}`);
      remove.textContent = "✕";
      remove.addEventListener("click", () => {
        this.datasets.splice(index, 1);
        this.clearError();
        this.render();
      });
      chip.appendChild(remove);

      list.appendChild(chip);
    });

    files.appendChild(list);

    const actions = document.createElement("div");
    actions.className = "mt-2 flex flex-wrap items-center gap-3 text-xs";

    if (this.comparing) {
      const swap = document.createElement("button");
      swap.type = "button";
      swap.className = "btn btn-outline btn-xs";
      swap.textContent = this.t.swapPeriods;
      swap.addEventListener("click", () => {
        this.datasets.reverse();
        this.render();
      });
      actions.appendChild(swap);
    } else {
      const hint = document.createElement("span");
      hint.className = "opacity-70";
      hint.textContent = this.t.addSecond;
      actions.appendChild(hint);
    }

    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "btn btn-ghost btn-xs";
    clear.textContent = this.t.clearAll;
    clear.addEventListener("click", () => {
      this.datasets = [];
      this.query = "";
      this.el.search.value = "";
      this.clearError();
      this.render();
    });
    actions.appendChild(clear);

    files.appendChild(actions);
  }

  /** VIEW 1 — the four numbers, with period-over-period deltas when comparing. */
  private renderSummary(): void {
    const now = totalsOf(this.current.rows);
    const before = this.baseline ? totalsOf(this.baseline.rows) : null;
    const { summary } = this.el;
    summary.innerHTML = "";

    const cards: {
      label: string;
      value: string;
      delta?: { text: string; good: boolean } | null;
    }[] = [
      {
        label: this.t.totalClicks,
        value: formatCompact(now.clicks, this.lang),
        delta: before && this.deltaChip("clicks", now.clicks - before.clicks),
      },
      {
        label: this.t.totalImpressions,
        value: formatCompact(now.impressions, this.lang),
        delta: before && this.deltaChip("impressions", now.impressions - before.impressions),
      },
      {
        label: this.t.avgCtr,
        value: formatPercent(now.ctr, this.lang),
        delta: before && this.deltaChip("ctr", now.ctr - before.ctr),
      },
      {
        label: this.t.avgPosition,
        value: formatPosition(now.position, this.lang),
        delta: before && this.deltaChip("position", now.position - before.position),
      },
    ];

    for (const card of cards) {
      const box = document.createElement("div");
      box.className = "rounded-xl border border-base-300 bg-base-200 p-4";

      const label = document.createElement("div");
      label.className = "text-xs uppercase tracking-wide opacity-60";
      label.textContent = card.label;

      const value = document.createElement("div");
      value.className = "mt-1 text-2xl md:text-3xl font-bold tabular-nums";
      value.textContent = card.value;

      box.append(label, value);

      if (card.delta) {
        const delta = document.createElement("div");
        delta.className = `mt-1 text-xs font-medium tabular-nums ${
          card.delta.good ? "text-success" : "text-error"
        }`;
        delta.textContent = `${card.delta.text} ${this.t.vsPrevious}`;
        box.appendChild(delta);
      }

      summary.appendChild(box);
    }
  }

  private deltaChip(field: keyof Delta, value: number): { text: string; good: boolean } | null {
    if (value === 0) return null;
    const kind = field === "ctr" ? "percent" : field === "position" ? "position" : "int";
    const arrow = value > 0 ? "▲" : "▼";
    return {
      text: `${arrow} ${formatDelta(value, this.lang, kind).replace(/^[+−]/, "")}`,
      good: isImprovement(field, value),
    };
  }

  /** VIEW 2 (header) — clickable, sortable column headers. */
  private renderTableHead(): void {
    const shape = shapeOf(this.preset, this.current.shapeId);
    this.el.tableTitle.textContent = this.t.tableTitle(
      shape?.entityPlural[this.lang] ?? this.preset.columns[0].label[this.lang]
    );

    const tr = document.createElement("tr");
    for (const column of this.preset.columns) {
      const th = document.createElement("th");
      th.className = `bg-base-200 ${column.type === "text" ? "text-left" : "text-right"}`;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "inline-flex items-center gap-1 hover:text-primary transition";
      // The dimension column keeps the preset's generic label; the entity name
      // ("Query" / "Page") is already on the section heading.
      button.textContent =
        column.field === "key"
          ? (shape?.entity[this.lang] ?? column.label[this.lang])
          : column.label[this.lang];

      if (this.sortField === column.field) {
        const caret = document.createElement("span");
        caret.className = "text-primary";
        caret.textContent = this.sortDir === "asc" ? "▲" : "▼";
        button.appendChild(caret);
      }
      button.setAttribute(
        "aria-label",
        `${this.t.sortBy} ${column.label[this.lang]}`
      );
      button.addEventListener("click", () => {
        if (this.sortField === column.field) {
          this.sortDir = this.sortDir === "asc" ? "desc" : "asc";
        } else {
          this.sortField = column.field;
          // Text reads best A→Z; every metric reads best biggest-first, except
          // position where "best" is the smallest number.
          this.sortDir = column.type === "text" || column.type === "position" ? "asc" : "desc";
        }
        this.limit = PAGE_SIZE;
        this.renderTableHead();
        this.renderTable();
      });

      th.appendChild(button);
      tr.appendChild(th);
    }

    if (this.comparing) {
      const th = document.createElement("th");
      th.className = "bg-base-200 text-right";
      th.textContent = "Δ";
      tr.appendChild(th);
    }

    this.el.thead.innerHTML = "";
    this.el.thead.appendChild(tr);
  }

  /** VIEW 2 (body) — filtered, sorted and capped at `limit` rows. */
  private renderTable(): void {
    const all = this.tableRows();
    const filtered = this.query
      ? all.filter((r) => r.key.toLowerCase().includes(this.query))
      : all;

    const field = this.sortField;
    const dir = this.sortDir === "asc" ? 1 : -1;
    const sorted = [...filtered].sort((a, b) => {
      if (field === "key") return a.key.localeCompare(b.key, this.lang) * dir;
      return (sortValue(a, field) - sortValue(b, field)) * dir;
    });

    const shown = sorted.slice(0, this.limit);
    const { tbody, count, more } = this.el;
    tbody.innerHTML = "";

    if (sorted.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = this.preset.columns.length + (this.comparing ? 1 : 0);
      td.className = "text-center opacity-60 py-6";
      td.textContent = this.t.noMatches;
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
      for (const row of shown) tbody.appendChild(this.rowElement(row));
    }

    count.textContent = this.t.showing(
      formatCount(shown.length, this.lang),
      formatCount(sorted.length, this.lang)
    );
    more.classList.toggle("hidden", shown.length >= sorted.length);
  }

  private rowElement(row: TableRow): HTMLElement {
    const tr = document.createElement("tr");
    tr.className = "hover";

    for (const column of this.preset.columns) {
      const td = document.createElement("td");
      td.className = column.type === "text" ? "max-w-[22rem]" : "text-right tabular-nums";

      if (column.field === "key") {
        const label = document.createElement("span");
        label.className = "block truncate";
        label.title = row.key;
        // textContent, never innerHTML: keys come straight out of the user's
        // CSV and can hold anything.
        label.textContent = row.key;
        td.appendChild(label);
        if (row.status === "new" || row.status === "lost") {
          const badge = document.createElement("span");
          badge.className = `badge badge-xs ml-1 ${
            row.status === "new" ? "badge-success" : "badge-error"
          }`;
          badge.textContent = row.status === "new" ? this.t.statusNew : this.t.statusLost;
          td.appendChild(badge);
        }
      } else if (column.type === "percent") {
        td.textContent = formatPercent(row.ctr, this.lang);
      } else if (column.type === "position") {
        if (row.status === "lost") {
          // The row isn't in the current period at all, so it has no position.
          // Printing 0.0 would render as a green "better than #1", which is a lie.
          td.textContent = "–";
          td.classList.add("opacity-40");
          if (row.before) td.title = formatPosition(row.before.position, this.lang);
        } else {
          td.textContent = formatPosition(row.position, this.lang);
          td.classList.add(TIER_CLASS[positionTier(row.position)], "font-medium");
        }
      } else {
        td.textContent = formatCount(row[column.field] as number, this.lang);
      }

      tr.appendChild(td);
    }

    if (this.comparing) {
      const td = document.createElement("td");
      td.className = "text-right tabular-nums whitespace-nowrap";
      const delta = row.delta;
      // The Δ column tracks clicks — the number people actually act on. Position
      // movement is already visible in its own colour-coded column.
      if (delta && delta.clicks !== 0) {
        const span = document.createElement("span");
        span.className = `font-medium ${
          isImprovement("clicks", delta.clicks) ? "text-success" : "text-error"
        }`;
        span.textContent = `${delta.clicks > 0 ? "▲" : "▼"} ${formatCount(
          Math.abs(delta.clicks),
          this.lang
        )}`;
        if (delta.position !== null) {
          span.title = `${this.t.avgPosition}: ${formatDelta(delta.position, this.lang, "position")}`;
        }
        td.appendChild(span);
      } else {
        td.className += " opacity-40";
        td.textContent = "–";
      }
      tr.appendChild(td);
    }

    return tr;
  }

  /** VIEWS 3 and 4. */
  private async renderCharts(token: number): Promise<void> {
    this.el.chartError.classList.add("hidden");
    try {
      const { renderScatter, renderDistribution } = await import("./charts");
      // A second file may have landed while Chart.js was loading.
      if (token !== this.renderToken) return;

      const periods = this.baseline
        ? [
            { label: `${this.t.periodA} · ${this.baseline.filename}`, rows: this.baseline.rows },
            { label: `${this.t.periodB} · ${this.current.filename}`, rows: this.current.rows },
          ]
        : [{ label: this.current.filename, rows: this.current.rows }];

      this.destroyCharts();
      this.charts = await Promise.all([
        renderScatter(this.el.scatter, periods, this.lang, this.t),
        renderDistribution(
          this.el.dist,
          periods.map((p) => ({ label: p.label, counts: bucketCounts(p.rows) })),
          this.lang,
          this.t
        ),
      ]);
    } catch {
      // The table above carries the same data, so a chart failure degrades
      // rather than breaking the page.
      this.el.chartError.textContent = this.t.chartUnavailable;
      this.el.chartError.classList.remove("hidden");
    }
  }

  private destroyCharts(): void {
    for (const chart of this.charts) chart.destroy();
    this.charts = [];
  }
}
