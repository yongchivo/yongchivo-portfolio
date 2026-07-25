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

/** Entry point called by <ConverterApp> for every widget on the page. */
export function initConverter(root: HTMLElement): void {
  const conversion = getConversion(root.dataset.convId ?? "");
  const lang = (root.dataset.lang as "en" | "es") ?? "en";
  if (!conversion) return;
  const t = strings[lang];

  if (conversion.kind === "data") {
    initDataConverter(root, conversion, t);
  } else if (conversion.kind === "pdf" || conversion.kind === "operation") {
    initPdfConverter(root, conversion, t);
  } else {
    initImageConverter(root, conversion, t);
  }
}

function initImageConverter(
  root: HTMLElement,
  conversion: Conversion,
  t: ConverterStrings
): void {
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

// --- data widget ----------------------------------------------------------
//
// A different shape from images: paste-or-drop text in, converted text shown
// inline (with copy + download) as you type. One document at a time.

function initDataConverter(
  root: HTMLElement,
  conversion: Conversion,
  t: ConverterStrings
): void {
  const input = root.querySelector<HTMLInputElement>("[data-cv-input]");
  const drop = root.querySelector<HTMLElement>("[data-cv-drop]");
  const textarea = root.querySelector<HTMLTextAreaElement>("[data-cv-text]");
  const output = root.querySelector<HTMLElement>("[data-cv-output]");
  const errorBox = root.querySelector<HTMLElement>("[data-cv-error]");
  const copyBtn = root.querySelector<HTMLButtonElement>("[data-cv-copy]");
  const downloadLink = root.querySelector<HTMLAnchorElement>("[data-cv-download]");
  if (!textarea || !output) return;

  let debounce: number | undefined;
  let url: string | undefined;
  let outputText = "";
  // Remembers the last file's name so downloads keep it (e.g. data.csv -> data.json).
  let sourceName = `data.${conversion.sourceExts[0]}`;

  function revokeUrl() {
    if (url) URL.revokeObjectURL(url);
    url = undefined;
  }

  function setReady(ready: boolean) {
    if (copyBtn) copyBtn.disabled = !ready;
    if (downloadLink)
      downloadLink.classList.toggle("pointer-events-none", !ready);
    if (downloadLink) downloadLink.classList.toggle("opacity-40", !ready);
  }

  function showError(message: string) {
    revokeUrl();
    outputText = "";
    output!.textContent = t.emptyOutput;
    output!.classList.add("opacity-50");
    setReady(false);
    if (errorBox) {
      errorBox.textContent = message;
      errorBox.classList.remove("hidden");
    }
  }

  function clearOutput() {
    revokeUrl();
    outputText = "";
    output!.textContent = t.emptyOutput;
    output!.classList.add("opacity-50");
    setReady(false);
    errorBox?.classList.add("hidden");
  }

  async function run() {
    const text = textarea!.value;
    if (!text.trim()) {
      clearOutput();
      return;
    }
    const file = new File([text], sourceName, {
      type: conversion.sourceMimes[0] ?? "text/plain",
    });
    try {
      const result = await convertFile(file, conversion);
      outputText = await result.blob.text();
      output!.textContent = outputText;
      output!.classList.remove("opacity-50");
      errorBox?.classList.add("hidden");
      revokeUrl();
      url = URL.createObjectURL(result.blob);
      if (downloadLink) {
        downloadLink.href = url;
        downloadLink.download = result.filename;
      }
      setReady(true);
    } catch (err) {
      showError(err instanceof Error ? err.message : t.error);
    }
  }

  function loadFile(file: File) {
    sourceName = file.name;
    file.text().then((text) => {
      textarea!.value = text;
      run();
    });
  }

  // --- wiring -------------------------------------------------------------

  textarea.addEventListener("input", () => {
    window.clearTimeout(debounce);
    debounce = window.setTimeout(run, 300);
  });

  input?.addEventListener("change", () => {
    if (input.files && input.files.length) loadFile(input.files[0]);
    input.value = "";
  });

  if (drop) {
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
      if (dt?.files?.length) loadFile(dt.files[0]);
    });
  }

  copyBtn?.addEventListener("click", async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      const original = copyBtn.textContent;
      copyBtn.textContent = t.copied;
      window.setTimeout(() => (copyBtn.textContent = original), 1200);
    } catch {
      /* clipboard blocked — the download button still works */
    }
  });

  clearOutput();
}

// --- PDF widget -----------------------------------------------------------
//
// Multi-file capable (image->pdf, merge) with reorder; single-file for the
// rest. Produces one or many result files, each individually downloadable.
// pdf.ts (pdf-lib + pdf.js) is imported on demand so it code-splits onto PDF
// pages only.

function initPdfConverter(
  root: HTMLElement,
  conversion: Conversion,
  t: ConverterStrings
): void {
  const box = root.querySelector<HTMLElement>("[data-cv-mode]");
  const input = root.querySelector<HTMLInputElement>("[data-cv-input]");
  const drop = root.querySelector<HTMLElement>("[data-cv-drop]");
  const filesList = root.querySelector<HTMLElement>("[data-cv-files]");
  const runBtn = root.querySelector<HTMLButtonElement>("[data-cv-run]");
  const clearBtn = root.querySelector<HTMLButtonElement>("[data-cv-clear]");
  const errorBox = root.querySelector<HTMLElement>("[data-cv-error]");
  const results = root.querySelector<HTMLElement>("[data-cv-results]");
  const qualityInput = root.querySelector<HTMLInputElement>("[data-cv-quality]");
  const qualityValue = root.querySelector<HTMLElement>("[data-cv-quality-value]");
  if (!box || !input || !filesList || !runBtn || !results) return;

  const mode = box.dataset.cvMode ?? "";
  const multi = box.dataset.cvMulti === "1";

  let files: File[] = [];
  let urls: string[] = [];

  function hideError() {
    errorBox?.classList.add("hidden");
  }
  function showError(message: string) {
    if (errorBox) {
      errorBox.textContent = message;
      errorBox.classList.remove("hidden");
    }
  }

  function clearResults() {
    urls.forEach((u) => URL.revokeObjectURL(u));
    urls = [];
    if (results) results.innerHTML = "";
  }

  function renderFiles() {
    if (!filesList) return;
    filesList.innerHTML = "";
    files.forEach((file, index) => {
      const li = document.createElement("li");
      li.className =
        "flex items-center gap-2 rounded-lg bg-base-200 border border-base-300 px-3 py-2";

      const meta = document.createElement("div");
      meta.className = "min-w-0 grow";
      const name = document.createElement("div");
      name.className = "truncate text-sm font-medium";
      name.textContent = `${index + 1}. ${file.name}`;
      const sub = document.createElement("div");
      sub.className = "text-xs opacity-70";
      sub.textContent = humanSize(file.size);
      meta.append(name, sub);

      const controls = document.createElement("div");
      controls.className = "flex items-center gap-1 shrink-0";

      if (multi) {
        controls.appendChild(
          iconButton("↑", t.moveUp, index === 0, () => {
            [files[index - 1], files[index]] = [files[index], files[index - 1]];
            renderFiles();
          })
        );
        controls.appendChild(
          iconButton("↓", t.moveDown, index === files.length - 1, () => {
            [files[index + 1], files[index]] = [files[index], files[index + 1]];
            renderFiles();
          })
        );
      }
      controls.appendChild(
        iconButton("✕", t.remove, false, () => {
          files.splice(index, 1);
          renderFiles();
        })
      );

      li.append(meta, controls);
      filesList.appendChild(li);
    });
  }

  function iconButton(
    label: string,
    title: string,
    disabled: boolean,
    onClick: () => void
  ): HTMLButtonElement {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn btn-ghost btn-xs";
    b.textContent = label;
    b.title = title;
    b.setAttribute("aria-label", title);
    b.disabled = disabled;
    b.addEventListener("click", onClick);
    return b;
  }

  function addFiles(incoming: FileList | File[]) {
    const valid = Array.from(incoming).filter((f) => accepts(conversion, f));
    if (valid.length === 0) {
      showError(t.wrongType);
      return;
    }
    hideError();
    files = multi ? [...files, ...valid] : [valid[0]];
    renderFiles();
  }

  function readOptions() {
    const opts: Record<string, unknown> = {};
    if (conversion.pdf?.imageFormat) {
      opts.format = conversion.pdf.imageFormat;
      opts.ext = conversion.targetExt;
    }
    const pagesize = root.querySelector<HTMLSelectElement>("[data-cv-pagesize]");
    if (pagesize) opts.pageSize = pagesize.value;
    const ranges = root.querySelector<HTMLInputElement>("[data-cv-ranges]");
    if (ranges) opts.ranges = ranges.value;
    const angle = root.querySelector<HTMLSelectElement>("[data-cv-angle]");
    if (angle) opts.angle = Number(angle.value);
    const pages = root.querySelector<HTMLInputElement>("[data-cv-pages]");
    if (pages) opts.pages = pages.value;
    if (qualityInput)
      opts.quality = Math.max(0, Math.min(1, Number(qualityInput.value) / 100));
    return opts;
  }

  function renderResults(items: ConversionResult[]) {
    if (!results) return;
    clearResults();

    if (items.length > 1) {
      const bar = document.createElement("div");
      bar.className = "flex justify-end";
      const all = document.createElement("button");
      all.type = "button";
      all.className = "btn btn-primary btn-sm";
      all.textContent = t.downloadAll;
      all.addEventListener("click", () => {
        results.querySelectorAll<HTMLAnchorElement>("a[download]").forEach((a) => {
          const link = document.createElement("a");
          link.href = a.href;
          link.download = a.download;
          document.body.appendChild(link);
          link.click();
          link.remove();
        });
      });
      bar.appendChild(all);
      results.appendChild(bar);
    }

    for (const item of items) {
      const url = URL.createObjectURL(item.blob);
      urls.push(url);

      const li = document.createElement("li");
      li.className =
        "flex items-center gap-3 rounded-lg bg-base-200 border border-base-300 px-3 py-2";
      const meta = document.createElement("div");
      meta.className = "min-w-0 grow";
      const name = document.createElement("div");
      name.className = "truncate text-sm font-medium";
      name.textContent = item.filename;
      const sub = document.createElement("div");
      sub.className = "text-xs opacity-70";
      sub.textContent = humanSize(item.blob.size);
      meta.append(name, sub);

      const a = document.createElement("a");
      a.href = url;
      a.download = item.filename;
      a.className = "btn btn-sm btn-primary shrink-0";
      a.textContent = t.download;

      li.append(meta, a);
      results.appendChild(li);
    }
  }

  async function run() {
    if (files.length === 0) {
      showError(t.wrongType);
      return;
    }
    hideError();
    clearResults();
    const label = runBtn!.textContent;
    runBtn!.disabled = true;
    runBtn!.textContent = t.working;
    try {
      const { runPdfTool } = await import("./pdf");
      const items = await runPdfTool(mode as never, files, readOptions());
      renderResults(items);
    } catch (err) {
      showError(err instanceof Error ? err.message : t.error);
    } finally {
      runBtn!.disabled = false;
      runBtn!.textContent = label;
    }
  }

  // --- wiring -------------------------------------------------------------

  input.addEventListener("change", () => {
    if (input.files && input.files.length) addFiles(input.files);
    input.value = "";
  });

  if (drop) {
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
  }

  if (qualityInput && qualityValue) {
    qualityValue.textContent = `${qualityInput.value}%`;
    qualityInput.addEventListener(
      "input",
      () => (qualityValue.textContent = `${qualityInput.value}%`)
    );
  }

  runBtn.addEventListener("click", run);
  clearBtn?.addEventListener("click", () => {
    files = [];
    renderFiles();
    clearResults();
    hideError();
  });
}
