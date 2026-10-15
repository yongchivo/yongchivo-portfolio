// Browser-side controller for a single converter widget.
//
// The <ConverterApp> component renders the markup and calls initConverter()
// on it. This file owns all the interactive behaviour: drag & drop, the file
// queue, batch conversion, per-file download and "download all".

import { getConversion, type Conversion } from "./registry";
import { strings, type ConverterStrings } from "./i18n";
import { accepts, convertFile, sniffImage, type ConversionResult } from "./engine";
import { ConvertError } from "./errors";

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

/**
 * Message to show for a caught error, in the page language. ConvertError ->
 * its localised string with {params} filled in; any other Error -> its own
 * (English) message; anything else -> the generic "Failed".
 */
function errorText(err: unknown, t: ConverterStrings): string {
  if (err instanceof ConvertError) {
    const params: Record<string, string | number> = { ...err.params };
    // "{name}: {why}" wrappers: localise the inner reason too.
    if (err.reason instanceof ConvertError && "why" in params) {
      params.why = errorText(err.reason, t);
    }
    return t[err.key].replace(/\{(\w+)\}/g, (match, name: string) =>
      name in params ? String(params[name]) : match
    );
  }
  return err instanceof Error ? err.message : t.error;
}

/** Entry point called by <ConverterApp> for every widget on the page. */
export function initConverter(root: HTMLElement): void {
  // Idempotency guard: initConverter may be invoked more than once for the same
  // element (immediate call + the astro:page-load listener). Bind listeners only
  // once so we never double-handle a selection.
  if (root.dataset.cvReady === "1") return;
  root.dataset.cvReady = "1";

  const conversion = getConversion(root.dataset.convId ?? "");
  const lang = (root.dataset.lang as "en" | "es") ?? "en";
  if (!conversion) return;
  const t = strings[lang];

  if (conversion.kind === "data") {
    initDataConverter(root, conversion, t);
  } else if (conversion.kind === "pdf" || conversion.kind === "operation") {
    initPdfConverter(root, conversion, t);
  } else if (conversion.kind === "audio" || conversion.kind === "video") {
    initMediaConverter(root, conversion, t);
  } else if (conversion.kind === "document") {
    initDocConverter(root, conversion, t);
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
      item.message = errorText(err, t);
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
      showError(errorText(err, t));
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

// images-to-pdf limits: keep a tab from running out of memory decoding photos.
const IMG_MAX_MB = 20;
const IMG_MAX_COUNT = 50;
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
  const pagesize = root.querySelector<HTMLSelectElement>("[data-cv-pagesize]");
  const orientation = root.querySelector<HTMLSelectElement>("[data-cv-orientation]");
  const margin = root.querySelector<HTMLSelectElement>("[data-cv-margin]");
  const marginCustom = root.querySelector<HTMLInputElement>("[data-cv-margin-custom]");
  const marginCustomWrap = root.querySelector<HTMLElement>("[data-cv-margin-custom-wrap]");
  if (!box || !input || !filesList || !runBtn || !results) return;

  const mode = box.dataset.cvMode ?? "";
  const multi = box.dataset.cvMulti === "1";
  const isImages = mode === "images-to-pdf";

  let files: File[] = [];
  let urls: string[] = [];
  let thumbs: string[] = [];

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

  /** Re-render the list; `focus` puts keyboard focus back after a move/remove. */
  function renderFiles(focus?: { index: number; act: string }) {
    if (!filesList) return;
    filesList.innerHTML = "";
    thumbs.forEach((u) => URL.revokeObjectURL(u));
    thumbs = [];
    if (isImages && files.length === 0) {
      const empty = document.createElement("li");
      empty.className = "text-sm opacity-60";
      empty.textContent = t.imagesEmpty;
      filesList.appendChild(empty);
    }
    files.forEach((file, index) => {
      const li = document.createElement("li");
      li.className =
        "flex items-center gap-2 rounded-lg bg-base-200 border border-base-300 px-3 py-2";

      if (isImages) {
        // Thumbnail; falls back to the extension where the browser can't
        // render the format in an <img> (HEIC outside Safari).
        const box = document.createElement("div");
        box.className =
          "relative w-12 h-12 shrink-0 rounded bg-base-300 overflow-hidden grid place-items-center text-[10px] uppercase opacity-90";
        box.textContent = file.name.split(".").pop() ?? "";
        const url = URL.createObjectURL(file);
        thumbs.push(url);
        const img = document.createElement("img");
        img.src = url;
        img.alt = "";
        img.className = "absolute inset-0 w-full h-full object-cover bg-white";
        img.addEventListener("error", () => img.remove());
        box.appendChild(img);
        li.appendChild(box);
      }

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
          iconButton("↑", t.moveUp, "up", index === 0, () => {
            [files[index - 1], files[index]] = [files[index], files[index - 1]];
            renderFiles({ index: index - 1, act: "up" });
          })
        );
        controls.appendChild(
          iconButton("↓", t.moveDown, "down", index === files.length - 1, () => {
            [files[index + 1], files[index]] = [files[index], files[index + 1]];
            renderFiles({ index: index + 1, act: "down" });
          })
        );
      }
      controls.appendChild(
        iconButton("✕", `${t.remove}: ${file.name}`, "remove", false, () => {
          files.splice(index, 1);
          renderFiles({ index: Math.min(index, files.length - 1), act: "remove" });
        })
      );

      li.append(meta, controls);
      filesList.appendChild(li);
    });

    if (focus) {
      const li = filesList.children[focus.index];
      const target =
        li?.querySelector<HTMLElement>(`[data-act="${focus.act}"]:not(:disabled)`) ??
        li?.querySelector<HTMLElement>("button:not(:disabled)") ??
        input;
      target?.focus();
    }
  }

  function iconButton(
    label: string,
    title: string,
    act: string,
    disabled: boolean,
    onClick: () => void
  ): HTMLButtonElement {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.act = act;
    b.className = "btn btn-ghost btn-xs";
    b.textContent = label;
    b.title = title;
    b.setAttribute("aria-label", title);
    b.disabled = disabled;
    b.addEventListener("click", onClick);
    return b;
  }

  /** images-to-pdf: size, magic-byte and count checks; problems are reported per file. */
  async function screenImages(list: File[], problems: string[]): Promise<File[]> {
    const ok: File[] = [];
    for (const f of list) {
      if (f.size > IMG_MAX_MB * 1024 * 1024) {
        problems.push(t.imageTooLarge.replace("{name}", f.name).replace("{mb}", String(IMG_MAX_MB)));
        continue;
      }
      let head: Uint8Array | null = null;
      try {
        head = new Uint8Array(await f.slice(0, 12).arrayBuffer());
      } catch {
        /* unreadable — rejected below */
      }
      if (!accepts(conversion, f) || !head || !sniffImage(head)) {
        problems.push(t.notAnImage.replace("{name}", f.name));
        continue;
      }
      ok.push(f);
    }
    const room = IMG_MAX_COUNT - files.length;
    if (ok.length > room) {
      problems.push(t.tooManyImages.replace("{max}", String(IMG_MAX_COUNT)));
      return ok.slice(0, Math.max(0, room));
    }
    return ok;
  }

  async function addFiles(incoming: FileList | File[]) {
    const list = Array.from(incoming); // copy before any await: the input's FileList is reset
    const problems: string[] = [];
    const valid = isImages
      ? await screenImages(list, problems)
      : list.filter((f) => accepts(conversion, f));
    if (!isImages && valid.length === 0) problems.push(t.wrongType);
    if (problems.length) showError(problems.join("\n"));
    else hideError();
    if (valid.length === 0) return;
    files = multi ? [...files, ...valid] : [valid[0]];
    renderFiles();
  }

  function readOptions() {
    const opts: Record<string, unknown> = {};
    if (conversion.pdf?.imageFormat) {
      opts.format = conversion.pdf.imageFormat;
      opts.ext = conversion.targetExt;
    }
    if (pagesize) opts.pageSize = pagesize.value;
    if (orientation) opts.orientation = orientation.value;
    if (margin) {
      opts.marginMm =
        margin.value === "custom"
          ? Math.max(0, Math.min(100, Number(marginCustom?.value) || 0))
          : Number(margin.value);
    }
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
      showError(errorText(err, t));
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

  // Orientation only means something on a fixed page size; "fit" takes the image's shape.
  const syncPageOptions = () => {
    if (orientation && pagesize) orientation.disabled = pagesize.value === "fit";
    const custom = margin?.value === "custom";
    marginCustomWrap?.classList.toggle("hidden", !custom);
    marginCustomWrap?.classList.toggle("flex", custom);
  };
  pagesize?.addEventListener("change", syncPageOptions);
  margin?.addEventListener("change", syncPageOptions);
  syncPageOptions();

  runBtn.addEventListener("click", run);
  clearBtn?.addEventListener("click", () => {
    files = [];
    renderFiles();
    clearResults();
    hideError();
  });
  renderFiles(); // empty state
}

// --- media widget (audio / video via FFmpeg.wasm) -------------------------
//
// Single file in, single file out. The FFmpeg core (32 MB) is loaded on first
// run only, with a status line ("loading…" then "converting… NN%"). media.ts
// is imported on demand so FFmpeg code-splits onto audio/video pages only.

function initMediaConverter(
  root: HTMLElement,
  conversion: Conversion,
  t: ConverterStrings
): void {
  const input = root.querySelector<HTMLInputElement>("[data-cv-input]");
  const drop = root.querySelector<HTMLElement>("[data-cv-drop]");
  const filesList = root.querySelector<HTMLElement>("[data-cv-files]");
  const runBtn = root.querySelector<HTMLButtonElement>("[data-cv-run]");
  const clearBtn = root.querySelector<HTMLButtonElement>("[data-cv-clear]");
  const errorBox = root.querySelector<HTMLElement>("[data-cv-error]");
  const results = root.querySelector<HTMLElement>("[data-cv-results]");
  const status = root.querySelector<HTMLElement>("[data-cv-status]");
  const fpsInput = root.querySelector<HTMLInputElement>("[data-cv-fps]");
  const widthInput = root.querySelector<HTMLInputElement>("[data-cv-width]");
  if (!input || !filesList || !runBtn || !results) return;

  const isVideoInput = conversion.sourceMimes.some((m) => m.startsWith("video/"));
  const maxMb = isVideoInput ? 150 : 300;

  let file: File | null = null;
  let url: string | undefined;

  function hideError() {
    errorBox?.classList.add("hidden");
  }
  function showError(message: string) {
    if (errorBox) {
      errorBox.textContent = message;
      errorBox.classList.remove("hidden");
    }
  }
  function setStatus(text: string) {
    if (status) status.textContent = text;
  }
  function clearResult() {
    if (url) URL.revokeObjectURL(url);
    url = undefined;
    if (results) results.innerHTML = "";
  }

  function renderFile() {
    if (!filesList) return;
    filesList.innerHTML = "";
    if (!file) return;
    const li = document.createElement("li");
    li.className =
      "flex items-center gap-2 rounded-lg bg-base-200 border border-base-300 px-3 py-2";
    const meta = document.createElement("div");
    meta.className = "min-w-0 grow";
    const name = document.createElement("div");
    name.className = "truncate text-sm font-medium";
    name.textContent = file.name;
    const sub = document.createElement("div");
    sub.className = "text-xs opacity-70";
    sub.textContent = humanSize(file.size);
    meta.append(name, sub);
    const rm = document.createElement("button");
    rm.type = "button";
    rm.className = "btn btn-ghost btn-xs shrink-0";
    rm.textContent = "✕";
    rm.title = t.remove;
    rm.setAttribute("aria-label", t.remove);
    rm.addEventListener("click", () => {
      file = null;
      renderFile();
      clearResult();
      hideError();
      setStatus("");
    });
    li.append(meta, rm);
    filesList.appendChild(li);
  }

  function setFile(f: File) {
    if (!accepts(conversion, f)) {
      showError(t.wrongType);
      return;
    }
    hideError();
    setStatus("");
    clearResult();
    file = f;
    renderFile();
  }

  function renderResult(item: ConversionResult) {
    clearResult();
    if (!results) return;
    url = URL.createObjectURL(item.blob);
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

  async function run() {
    if (!file) {
      showError(t.wrongType);
      return;
    }
    if (file.size > maxMb * 1024 * 1024) {
      showError(t.mediaTooLarge.replace("{mb}", String(maxMb)));
      return;
    }
    hideError();
    clearResult();
    const label = runBtn!.textContent;
    runBtn!.disabled = true;
    runBtn!.textContent = t.working;
    try {
      const { convertMedia } = await import("./media");
      const item = await convertMedia(file, conversion, {
        fps: fpsInput ? Number(fpsInput.value) : undefined,
        width: widthInput ? Number(widthInput.value) : undefined,
        onStatus: (phase) =>
          setStatus(phase === "loading" ? t.mediaLoading : t.mediaConverting),
        onProgress: (ratio) =>
          setStatus(`${t.mediaConverting} · ${Math.round(ratio * 100)}%`),
      });
      setStatus("");
      renderResult(item);
    } catch (err) {
      setStatus("");
      showError(errorText(err, t));
    } finally {
      runBtn!.disabled = false;
      runBtn!.textContent = label;
    }
  }

  input.addEventListener("change", () => {
    if (input.files && input.files.length) setFile(input.files[0]);
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
      if (dt?.files?.length) setFile(dt.files[0]);
    });
  }

  runBtn.addEventListener("click", run);
  clearBtn?.addEventListener("click", () => {
    file = null;
    renderFile();
    clearResult();
    hideError();
    setStatus("");
  });
}

// --- document widget (Word .docx -> PDF via the print dialog) ---------------
//
// One file. docx.ts renders it into the preview <iframe>; "Save as PDF" prints
// that frame, and the browser's print engine writes the PDF.

const DOC_MAX_MB = 30;

function initDocConverter(
  root: HTMLElement,
  conversion: Conversion,
  t: ConverterStrings
): void {
  const input = root.querySelector<HTMLInputElement>("[data-cv-input]");
  const drop = root.querySelector<HTMLElement>("[data-cv-drop]");
  const runBtn = root.querySelector<HTMLButtonElement>("[data-cv-run]");
  const clearBtn = root.querySelector<HTMLButtonElement>("[data-cv-clear]");
  const errorBox = root.querySelector<HTMLElement>("[data-cv-error]");
  const status = root.querySelector<HTMLElement>("[data-cv-status]");
  const frame = root.querySelector<HTMLIFrameElement>("[data-cv-preview]");
  if (!input || !runBtn || !frame) return;

  function setError(message: string | null) {
    if (!errorBox) return;
    errorBox.textContent = message ?? "";
    errorBox.classList.toggle("hidden", !message);
  }
  function reset() {
    runBtn!.disabled = true;
    frame!.classList.add("hidden");
    frame!.contentDocument?.body.replaceChildren();
    if (status) status.textContent = "";
  }

  async function open(file: File) {
    reset();
    setError(null);
    if (file.size > DOC_MAX_MB * 1024 * 1024) {
      setError(t.docTooLarge.replace("{mb}", String(DOC_MAX_MB)));
      return;
    }
    const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    // OLE2 header = legacy binary .doc; a .docx is a ZIP ("PK\x03\x04").
    if (head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0) {
      setError(t.docLegacyDoc);
      return;
    }
    const isZip = head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04;
    if (!isZip || !accepts(conversion, file)) {
      setError(t.docNotDocx);
      return;
    }

    if (status) status.textContent = t.docRendering;
    try {
      const { renderDocx } = await import("./docx");
      frame!.classList.remove("hidden"); // visible first: renderDocx sizes pages to it
      await renderDocx(file, frame!);
      runBtn!.disabled = false;
      if (status) status.textContent = file.name;
    } catch {
      reset();
      setError(t.docReadFailed);
    }
  }

  input.addEventListener("change", () => {
    const file = input.files?.[0];
    input.value = "";
    if (file) open(file);
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
      const file = (e as DragEvent).dataTransfer?.files?.[0];
      if (file) open(file);
    });
  }

  runBtn.addEventListener("click", () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
  });
  clearBtn?.addEventListener("click", () => {
    reset();
    setError(null);
  });
}
