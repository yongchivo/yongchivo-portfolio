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
