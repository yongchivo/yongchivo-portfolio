// VIEW — the sortable, filterable row table.
//
// Column set, formatting and sort direction all come from the preset's metric
// descriptors, so this renders a Search Console query table today and any other
// dimensional preset's table unchanged. Owns its own sort/filter/paging state,
// which is why it re-renders only its <tbody> rather than the whole dashboard.

import { el } from "./dom";
import { formatCount, formatMetric, isImprovement } from "../numbers";
import { compare, positionTier, toTableRows, type TableRow } from "../insights";
import { metricOf, shapeOf, type Metric, type View, type ViewContext } from "../types";

const PAGE_SIZE = 50;
const TIER_CLASS = { good: "text-success", warn: "text-warning", bad: "text-error" } as const;

export function tableView(config: {
  /** Metric the Δ column tracks when comparing. */
  deltaMetric: string;
  /** Default sort column. */
  sortBy: string;
}): View {
  return {
    id: "table",
    supports: (ctx) => Boolean(ctx.preset.columns?.length),
    title: (t, ctx) =>
      t.tableTitle(shapeOf(ctx.preset, ctx.current.shapeId)?.entityPlural[ctx.lang] ?? ""),

    mount(host, ctx) {
      const { preset, lang, t } = ctx;
      const columns = preset.columns ?? [];
      const shape = shapeOf(preset, ctx.current.shapeId);
      const deltaMetric = metricOf(preset, config.deltaMetric);

      let sortField = config.sortBy;
      let sortDir: "asc" | "desc" = "desc";
      let query = "";
      let limit = PAGE_SIZE;

      const allRows = ctx.baseline
        ? compare(ctx.baseline, ctx.current, preset.metrics)
        : toTableRows(ctx.current);

      // --- chrome ---------------------------------------------------------
      const search = el(
        "input",
        "input input-bordered input-sm w-full sm:w-64"
      ) as HTMLInputElement;
      search.type = "search";
      search.placeholder = t.searchPlaceholder;
      search.setAttribute("aria-label", t.searchPlaceholder);

      const bar = el("div", "flex flex-wrap items-center justify-end gap-3 mb-3");
      bar.appendChild(search);
      host.appendChild(bar);

      const wrapper = el("div", "overflow-x-auto rounded-xl border border-base-300");
      const table = el("table", "table table-sm table-pin-rows");
      const thead = el("thead");
      const tbody = el("tbody");
      table.append(thead, tbody);
      wrapper.appendChild(table);
      host.appendChild(wrapper);

      const footer = el("div", "mt-2 flex flex-wrap items-center gap-3");
      const count = el("span", "text-xs opacity-60");
      const more = el("button", "btn btn-ghost btn-xs hidden", t.showMore) as HTMLButtonElement;
      more.type = "button";
      footer.append(count, more);
      host.appendChild(footer);

      // --- behaviour ------------------------------------------------------
      /**
       * A "lost" row has no position in the current period, so sorting on its
       * literal 0 would park every vanished query above the #1 result. Sort
       * those by the position they used to hold instead.
       */
      const sortValue = (row: TableRow, metric: Metric | undefined): number => {
        if (metric?.lowerIsBetter && row.status === "lost") {
          return row.before?.metrics[metric.id] ?? Number.POSITIVE_INFINITY;
        }
        return row.metrics[sortField] ?? 0;
      };

      function renderHead(): void {
        const tr = el("tr");
        for (const column of columns) {
          const metric = column.field === "key" ? undefined : metricOf(preset, column.field);
          const th = el("th", `bg-base-200 ${column.field === "key" ? "text-left" : "text-right"}`);

          const button = el(
            "button",
            "inline-flex items-center gap-1 hover:text-primary transition"
          ) as HTMLButtonElement;
          button.type = "button";
          const label =
            column.field === "key"
              ? (shape?.entity[lang] ?? column.label?.[lang] ?? "")
              : (metric?.label[lang] ?? column.field);
          button.textContent = label;

          if (sortField === column.field) {
            button.appendChild(el("span", "text-primary", sortDir === "asc" ? "▲" : "▼"));
          }
          button.setAttribute("aria-label", `${t.sortBy} ${label}`);
          button.addEventListener("click", () => {
            if (sortField === column.field) {
              sortDir = sortDir === "asc" ? "desc" : "asc";
            } else {
              sortField = column.field;
              // Text reads best A→Z, and so does a metric where lower is
              // better; every other metric reads best biggest-first.
              sortDir = column.field === "key" || metric?.lowerIsBetter ? "asc" : "desc";
            }
            limit = PAGE_SIZE;
            renderHead();
            renderBody();
          });

          th.appendChild(button);
          tr.appendChild(th);
        }

        if (ctx.comparing) tr.appendChild(el("th", "bg-base-200 text-right", "Δ"));
        thead.innerHTML = "";
        thead.appendChild(tr);
      }

      function rowElement(row: TableRow): HTMLElement {
        const tr = el("tr", "hover");

        for (const column of columns) {
          if (column.field === "key") {
            const td = el("td", "max-w-[22rem]");
            const label = el("span", "block truncate", row.key);
            label.title = row.key;
            td.appendChild(label);
            if (row.status === "new" || row.status === "lost") {
              td.appendChild(
                el(
                  "span",
                  `badge badge-xs ml-1 ${row.status === "new" ? "badge-success" : "badge-error"}`,
                  row.status === "new" ? t.statusNew : t.statusLost
                )
              );
            }
            tr.appendChild(td);
            continue;
          }

          const metric = metricOf(preset, column.field);
          const td = el("td", "text-right tabular-nums");
          const value = row.metrics[column.field] ?? 0;

          if (metric?.lowerIsBetter && row.status === "lost") {
            // The row isn't in the current period at all, so it has no
            // position. Printing 0.0 would render as a green "better than #1".
            td.textContent = "–";
            td.classList.add("opacity-40");
            const previous = row.before?.metrics[metric.id];
            if (previous !== undefined) {
              td.title = formatMetric(previous, metric, lang, ctx.current.currency);
            }
          } else if (metric) {
            td.textContent = formatMetric(value, metric, lang, ctx.current.currency);
            if (metric.kind === "position") {
              td.classList.add(TIER_CLASS[positionTier(value)], "font-medium");
            }
          } else {
            td.textContent = formatCount(value, lang);
          }
          tr.appendChild(td);
        }

        if (ctx.comparing) {
          const td = el("td", "text-right tabular-nums whitespace-nowrap");
          const change = deltaMetric ? row.delta?.[deltaMetric.id] : undefined;
          if (deltaMetric && change) {
            const span = el(
              "span",
              `font-medium ${isImprovement(deltaMetric, change) ? "text-success" : "text-error"}`
            );
            span.textContent = `${change > 0 ? "▲" : "▼"} ${formatMetric(
              Math.abs(change),
              deltaMetric,
              lang,
              ctx.current.currency
            )}`;
            td.appendChild(span);
          } else {
            td.classList.add("opacity-40");
            td.textContent = "–";
          }
          tr.appendChild(td);
        }

        return tr;
      }

      function renderBody(): void {
        const filtered = query
          ? allRows.filter((r) => r.key.toLowerCase().includes(query))
          : allRows;
        const metric = metricOf(preset, sortField);
        const dir = sortDir === "asc" ? 1 : -1;
        const sorted = [...filtered].sort((a, b) => {
          if (sortField === "key") return a.key.localeCompare(b.key, lang) * dir;
          return (sortValue(a, metric) - sortValue(b, metric)) * dir;
        });

        const shown = sorted.slice(0, limit);
        tbody.innerHTML = "";

        if (sorted.length === 0) {
          const tr = el("tr");
          const td = el("td", "text-center opacity-60 py-6", t.noMatches);
          td.colSpan = columns.length + (ctx.comparing ? 1 : 0);
          tr.appendChild(td);
          tbody.appendChild(tr);
        } else {
          for (const row of shown) tbody.appendChild(rowElement(row));
        }

        count.textContent = t.showing(
          formatCount(shown.length, lang),
          formatCount(sorted.length, lang)
        );
        more.classList.toggle("hidden", shown.length >= sorted.length);
      }

      search.addEventListener("input", () => {
        query = search.value.trim().toLowerCase();
        limit = PAGE_SIZE;
        renderBody();
      });
      more.addEventListener("click", () => {
        limit += PAGE_SIZE;
        renderBody();
      });

      renderHead();
      renderBody();
    },
  };
}
