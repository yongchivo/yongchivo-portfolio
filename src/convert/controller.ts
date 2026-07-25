// Browser-side controller for a single converter widget.
//
// The <ConverterApp> component renders the markup and calls initConverter()
// on it. This file owns all the interactive behaviour: drag & drop, the file
// queue, batch conversion, per-file download and "download all".

import { getConversion, type Conversion } from "./registry";
import { strings, type ConverterStrings } from "./i18n";
import { accepts, convertFile, type ConversionResult } from "./engine";

type Status = "queued" | "working" | "done" | "error";

interface Item {
  id: number;
  file: File;
  status: Status;
  result?: ConversionResult;
  url?: string;
  message?: string;
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function initConverter(root: HTMLElement): void {
  const conversion = getConversion(root.dataset.convId ?? "");
  const lang = (root.dataset.lang as "en" | "es") ?? "en";
  if (!conversion) return;
  const t = strings[lang];

  const input = root.querySelector<HTMLInputElement>("[data-cv-input]");
  const drop = root.querySelector<HTMLElement>("[data-cv-drop]");
  const list = root.querySelector<HTMLElement>("[data-cv-list]");
  const qualityInput = root.querySelector<HTMLInputElement>("[data-cv-quality]");
  const qualityValue = root.querySelector<HTMLElement>("[data-cv-quality-value]");
  const downloadAllBtn = root.querySelector<HTMLButtonElement>("[data-cv-download-all]");
  const clearBtn = root.querySelector<HTMLButtonElement>("[data-cv-clear]");
  const actions = root.querySelector<HTMLElement>("[data-cv-actions]");
  if (!input || !drop || !list) return;

  let items: Item[] = [];
  let nextId = 0;
  let qualityTimer: number | undefined;

  const quality = () =>
    qualityInput ? Math.max(0, Math.min(1, Number(qualityInput.value) / 100)) : 0.92;

  function revoke(item: Item) {
    if (item.url) URL.revokeObjectURL(item.url);
    item.url = undefined;
  }

  function render() {
    if (!list) return;
    list.innerHTML = "";
    for (const item of items) list.appendChild(rowFor(item, t));
    const anyDone = items.some((i) => i.status === "done");
    if (actions) actions.classList.toggle("hidden", items.length === 0);
    if (downloadAllBtn) downloadAllBtn.disabled = !anyDone;
  }

  function rowFor(item: Item, t: ConverterStrings): HTMLElement {
    const li = document.createElement("li");
    li.className =
      "flex items-center gap-3 rounded-lg bg-base-200 border border-base-300 px-3 py-2";

    const meta = document.createElement("div");
    meta.className = "min-w-0 grow";
    const name = document.createElement("div");
    name.className = "truncate text-sm font-medium";
    name.textContent = item.result?.filename ?? item.file.name;
    const sub = document.createElement("div");
    sub.className = "text-xs opacity-70";
    if (item.status === "done" && item.result) {
      sub.textContent = `${humanSize(item.file.size)} → ${humanSize(item.result.blob.size)}`;
    } else if (item.status === "error") {
      sub.textContent = item.message ?? t.error;
    } else {
      sub.textContent = humanSize(item.file.size);
    }
    meta.append(name, sub);

    const right = document.createElement("div");
    right.className = "flex items-center gap-2 shrink-0";

    if (item.status === "done" && item.url && item.result) {
      const a = document.createElement("a");
      a.href = item.url;
      a.download = item.result.filename;
      a.className = "btn btn-sm btn-primary";
      a.textContent = t.download;
      right.appendChild(a);
    } else {
      const badge = document.createElement("span");
      const tone =
        item.status === "error"
          ? "badge-error"
          : item.status === "working"
            ? "badge-warning"
            : "badge-ghost";
      badge.className = `badge ${tone} gap-1`;
      badge.textContent =
        item.status === "working"
          ? t.converting
          : item.status === "error"
            ? t.error
            : t.done;
      right.appendChild(badge);
    }

    li.append(meta, right);
    return li;
  }

  async function process(item: Item) {
    item.status = "working";
    revoke(item);
    render();
    try {
      const result = await convertFile(item.file, conversion as Conversion, {
        quality: quality(),
      });
      item.result = result;
      item.url = URL.createObjectURL(result.blob);
      item.status = "done";
    } catch (err) {
      item.status = "error";
      item.message = err instanceof Error ? err.message : t.error;
    }
    render();
  }

  async function addFiles(files: FileList | File[]) {
    const incoming = Array.from(files);
    const toProcess: Item[] = [];
    for (const file of incoming) {
      if (!accepts(conversion as Conversion, file)) {
        const item: Item = {
          id: nextId++,
          file,
          status: "error",
          message: t.wrongType,
        };
        items.push(item);
        continue;
      }
      const item: Item = { id: nextId++, file, status: "queued" };
      items.push(item);
      toProcess.push(item);
    }
    render();
    // Convert sequentially to keep memory in check with large batches.
    for (const item of toProcess) await process(item);
  }

  function reconvertAll() {
    const redo = items.filter((i) => i.status === "done" || i.status === "working");
    (async () => {
      for (const item of redo) await process(item);
    })();
  }

  // --- wiring -------------------------------------------------------------

  input.addEventListener("change", () => {
    if (input.files && input.files.length) addFiles(input.files);
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
    const dt = (e as DragEvent).dataTransfer;
    if (dt?.files?.length) addFiles(dt.files);
  });

  if (qualityInput && qualityValue) {
    const sync = () => (qualityValue.textContent = `${qualityInput.value}%`);
    sync();
    qualityInput.addEventListener("input", () => {
      sync();
      window.clearTimeout(qualityTimer);
      qualityTimer = window.setTimeout(reconvertAll, 350);
    });
  }

  downloadAllBtn?.addEventListener("click", () => {
    for (const item of items) {
      if (item.status === "done" && item.url && item.result) {
        const a = document.createElement("a");
        a.href = item.url;
        a.download = item.result.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    }
  });

  clearBtn?.addEventListener("click", () => {
    items.forEach(revoke);
    items = [];
    render();
  });

  render();
}
