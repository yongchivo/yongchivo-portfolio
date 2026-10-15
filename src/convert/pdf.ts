// PDF conversions and tools — 100% client-side.
//
// Two libraries, both audited CSP-safe (no eval / no new Function / no network
// in the code paths we use) and loaded ON DEMAND so they code-split onto PDF
// pages only:
//   - pdf-lib : create / merge / split / rotate / embed images. Pure JS.
//   - pdf.js  : render PDF pages to a canvas (PDF -> image, and compress).
//               Uses a same-origin module Worker (allowed by default-src
//               'self') and, only for exotic image codecs, WASM (covered by the
//               existing 'wasm-unsafe-eval'). We pass `data` bytes (never a URL)
//               so its XHR path is never touched, and `isEvalSupported: false`.
//
// pdf-lib is loaded by every tool; pdf.js only by the ones that rasterise
// (pdf-to-images, compress), so image->pdf / merge / split / rotate stay light.

import { decodeSource, sniffImage, type ConversionResult } from "./engine";
import { ConvertError } from "./errors";

// --- lazy library loaders -------------------------------------------------

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | undefined;
async function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import("pdfjs-dist");
      // Vite's `?worker` gives a same-origin, bundled Worker constructor that
      // works in both dev and prod (the plain `?url` form gets Vite's HMR
      // client injected in dev, which stalls pdf.js). Same-origin, so CSP
      // default-src 'self' covers it — no policy change needed.
      const PdfWorker = (
        await import("pdfjs-dist/build/pdf.worker.min.mjs?worker")
      ).default;
      pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker();
      return pdfjs;
    })();
  }
  return pdfjsPromise;
}

async function loadPdfLib() {
  return import("pdf-lib");
}

// --- small helpers --------------------------------------------------------

function stripExt(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name;
}

function pdfBlob(bytes: Uint8Array, name: string): ConversionResult {
  return { blob: new Blob([bytes], { type: "application/pdf" }), filename: name };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new ConvertError("encodeFailed", "This browser could not encode the image"))),
      type,
      quality
    )
  );
}

/**
 * Turn a pdf-lib / pdf.js error into a message worth showing a human. Only ever
 * called around loading/parsing a PDF, so anything that isn't a recognised
 * "encrypted" case is treated as a corrupt/invalid file — pdf-lib and pdf.js
 * both throw low-level parser messages ("Failed to parse number …") that would
 * only confuse the user.
 */
function friendlyPdfError(err: unknown): ConvertError {
  const name = (err as { name?: string })?.name ?? "";
  const msg = (err as { message?: string })?.message ?? "";
  if (name === "PasswordException" || /password|encrypted/i.test(msg)) {
    return new ConvertError(
      "pdfPasswordRequired",
      "This PDF is password-protected. Remove the password and try again."
    );
  }
  return new ConvertError("pdfInvalid", "This file isn't a valid PDF, or it's corrupted.");
}

/** "1-3, 5, 8-10" -> one labelled range per comma token (for split). */
function parseRanges(spec: string, pageCount: number) {
  const tokens = (spec ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (tokens.length === 0) {
    throw new ConvertError(
      "rangesEmpty",
      "Enter the page ranges to extract, e.g. 1-3, 5, 8-10"
    );
  }
  return tokens.map((tok) => {
    const m = tok.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) {
      throw new ConvertError(
        "rangeUnreadable",
        `Couldn't read "${tok}" — use pages like 1-3, 5, 8-10`,
        { tok }
      );
    }
    const start = parseInt(m[1], 10);
    const end = m[2] ? parseInt(m[2], 10) : start;
    if (start < 1 || end < start || end > pageCount) {
      throw new ConvertError(
        "rangeOutOfRange",
        `"${tok}" is out of range — this PDF has ${pageCount} page(s)`,
        { tok, count: pageCount }
      );
    }
    const indices: number[] = [];
    for (let p = start; p <= end; p++) indices.push(p - 1);
    return { label: start === end ? `${start}` : `${start}-${end}`, indices };
  });
}

/** "1-3, 5" -> flat 0-based page indices (for rotate). Blank = all pages. */
function parsePageList(spec: string | undefined, pageCount: number): number[] | null {
  if (!spec || !spec.trim()) return null;
  const set = new Set<number>();
  for (const tok of spec.split(",").map((s) => s.trim()).filter(Boolean)) {
    const m = tok.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) {
      throw new ConvertError(
        "pageListUnreadable",
        `Couldn't read "${tok}" — use pages like 1-3, 5`,
        { tok }
      );
    }
    const start = parseInt(m[1], 10);
    const end = m[2] ? parseInt(m[2], 10) : start;
    if (start < 1 || end < start || end > pageCount) {
      throw new ConvertError(
        "pageOutOfRange",
        `Page "${tok}" is out of range — this PDF has ${pageCount} page(s)`,
        { tok, count: pageCount }
      );
    }
    for (let p = start; p <= end; p++) set.add(p - 1);
  }
  return [...set];
}

// --- Family A: format conversions -----------------------------------------

const PAGE_SIZES: Record<"a4" | "letter", [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};
const PT_PER_MM = 72 / 25.4;
// Fixed re-encode quality for images that go through the canvas.
const JPEG_QUALITY = 0.92;

export interface ImagesToPdfOptions {
  pageSize?: "fit" | "a4" | "letter";
  /** Ignored for "fit" (the page takes the image's shape). */
  orientation?: "auto" | "portrait" | "landscape";
  /** White space on every side, in mm. */
  marginMm?: number;
}

/** Page size + where the image sits on it, in PDF points. Contain-fit, centred. */
export function layoutPage(
  iw: number,
  ih: number,
  { pageSize = "fit", orientation = "auto", marginMm = 0 }: ImagesToPdfOptions
) {
  const m = Math.max(0, marginMm) * PT_PER_MM;
  if (pageSize === "fit") {
    return { page: [iw + 2 * m, ih + 2 * m] as [number, number], x: m, y: m, w: iw, h: ih };
  }
  let [pw, ph] = PAGE_SIZES[pageSize];
  if (orientation === "landscape" || (orientation === "auto" && iw > ih)) [pw, ph] = [ph, pw];
  const aw = pw - 2 * m;
  const ah = ph - 2 * m;
  if (aw <= 0 || ah <= 0) {
    throw new ConvertError("marginsTooLarge", "The margins are too large for this page size");
  }
  const scale = Math.min(aw / iw, ah / ih);
  const w = iw * scale;
  const h = ih * scale;
  return { page: [pw, ph] as [number, number], x: (pw - w) / 2, y: (ph - h) / 2, w, h };
}

/**
 * Decode any supported image (WebP/HEIC/JPEG) and re-encode it as a JPEG pdf-lib
 * can embed. Going through createImageBitmap also applies EXIF rotation, which
 * pdf-lib's embedJpg ignores (phone photos would come out sideways). Alpha is
 * flattened onto white.
 */
async function toJpeg(file: File, heic: boolean): Promise<Uint8Array> {
  const source = await decodeSource(file, heic ? "heic" : "canvas");
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  try {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    source.drawTo(ctx);
    const blob = await canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY);
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    source.dispose();
    canvas.width = canvas.height = 0; // release the backing store now, not at GC
  }
}

async function imagesToPdf(
  files: File[],
  opts: ImagesToPdfOptions
): Promise<ConversionResult> {
  if (files.length === 0) throw new ConvertError("addAtLeastOneImage", "Add at least one image");
  const { PDFDocument } = await loadPdfLib();
  const pdf = await PDFDocument.create();

  for (const file of files) {
    let img;
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const kind = sniffImage(bytes);
      if (!kind) {
        throw new ConvertError("notSupportedImage", "not a JPG, PNG, WebP or HEIC image");
      }
      // PNG embeds losslessly as-is (its transparency shows as the white page).
      img =
        kind === "png"
          ? await pdf.embedPng(bytes)
          : await pdf.embedJpg(await toJpeg(file, kind === "heic"));
    } catch (err) {
      const why = err instanceof Error && err.message ? err.message : "couldn't read this image";
      throw new ConvertError("fileError", `"${file.name}": ${why}`, { name: file.name, why }, err);
    }

    const { page, x, y, w, h } = layoutPage(img.width, img.height, opts);
    pdf.addPage(page).drawImage(img, { x, y, width: w, height: h });
  }

  const out = await pdf.save();
  const name = files.length === 1 ? `${stripExt(files[0].name)}.pdf` : "images.pdf";
  return pdfBlob(out, name);
}

export interface PdfToImagesOptions {
  format?: "image/jpeg" | "image/png";
  ext?: string;
  quality?: number;
  scale?: number;
}

async function pdfToImages(
  file: File,
  { format = "image/png", ext = "png", quality = 0.92, scale = 2 }: PdfToImagesOptions
): Promise<ConversionResult[]> {
  const pdfjs = await loadPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());

  let doc;
  try {
    doc = await pdfjs.getDocument({ data, isEvalSupported: false }).promise;
  } catch (err) {
    throw friendlyPdfError(err);
  }

  const base = stripExt(file.name);
  const pad = String(doc.numPages).length;
  const results: ConversionResult[] = [];

  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context unavailable");
      if (format === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      await page.render({ canvasContext: ctx, viewport }).promise;
      const blob = await canvasToBlob(
        canvas,
        format,
        format === "image/jpeg" ? quality : undefined
      );
      results.push({
        blob,
        filename: `${base}-page-${String(i).padStart(pad, "0")}.${ext}`,
      });
      page.cleanup();
    }
  } finally {
    await doc.destroy();
  }
  return results;
}

// --- Family B: PDF tools --------------------------------------------------

async function mergePdfs(files: File[]): Promise<ConversionResult> {
  if (files.length < 2) throw new ConvertError("addAtLeastTwoPdfs", "Add at least two PDFs to merge");
  const { PDFDocument } = await loadPdfLib();
  const out = await PDFDocument.create();

  for (const file of files) {
    let src;
    try {
      src = await PDFDocument.load(await file.arrayBuffer());
    } catch (err) {
      const why = friendlyPdfError(err);
      throw new ConvertError(
        "fileError",
        `"${file.name}": ${why.message}`,
        { name: file.name, why: why.message },
        why
      );
    }
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }

  const bytes = await out.save();
  return pdfBlob(bytes, "merged.pdf");
}

async function splitPdf(file: File, ranges: string): Promise<ConversionResult[]> {
  const { PDFDocument } = await loadPdfLib();
  let src;
  try {
    src = await PDFDocument.load(await file.arrayBuffer());
  } catch (err) {
    throw friendlyPdfError(err);
  }

  const parsed = parseRanges(ranges, src.getPageCount());
  const base = stripExt(file.name);
  const results: ConversionResult[] = [];

  for (const range of parsed) {
    const out = await PDFDocument.create();
    const pages = await out.copyPages(src, range.indices);
    pages.forEach((p) => out.addPage(p));
    const bytes = await out.save();
    results.push(pdfBlob(bytes, `${base}-pages-${range.label}.pdf`));
  }
  return results;
}

export interface RotateOptions {
  angle?: number;
  pages?: string;
}

async function rotatePdf(
  file: File,
  { angle = 90, pages }: RotateOptions
): Promise<ConversionResult> {
  const { PDFDocument, degrees } = await loadPdfLib();
  let doc;
  try {
    doc = await PDFDocument.load(await file.arrayBuffer());
  } catch (err) {
    throw friendlyPdfError(err);
  }

  const all = doc.getPages();
  const targets = parsePageList(pages, all.length) ?? all.map((_, i) => i);
  for (const idx of targets) {
    const page = all[idx];
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + angle) % 360));
  }

  const bytes = await doc.save();
  return pdfBlob(bytes, `${stripExt(file.name)}-rotated.pdf`);
}

export interface CompressOptions {
  quality?: number;
}

// Honest compression: re-render every page to a JPEG at the chosen quality and
// rebuild the PDF from those images, dropping all metadata. This genuinely
// shrinks scanned / image-heavy PDFs, but it flattens pages (text stops being
// selectable) and won't help — may even enlarge — already-optimised text PDFs.
async function compressPdf(
  file: File,
  { quality = 0.6 }: CompressOptions
): Promise<ConversionResult> {
  const pdfjs = await loadPdfjs();
  const { PDFDocument } = await loadPdfLib();
  const data = new Uint8Array(await file.arrayBuffer());

  let doc;
  try {
    doc = await pdfjs.getDocument({ data, isEvalSupported: false }).promise;
  } catch (err) {
    throw friendlyPdfError(err);
  }

  const out = await PDFDocument.create();
  const scale = 1.5;
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context unavailable");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;

      const jpeg = await canvasToBlob(canvas, "image/jpeg", quality);
      const img = await out.embedJpg(new Uint8Array(await jpeg.arrayBuffer()));
      const unscaled = page.getViewport({ scale: 1 });
      const p = out.addPage([unscaled.width, unscaled.height]);
      p.drawImage(img, { x: 0, y: 0, width: unscaled.width, height: unscaled.height });
      page.cleanup();
    }
  } finally {
    await doc.destroy();
  }

  const bytes = await out.save();
  return pdfBlob(bytes, `${stripExt(file.name)}-compressed.pdf`);
}

// --- dispatcher -----------------------------------------------------------

export type PdfMode =
  | "images-to-pdf"
  | "pdf-to-images"
  | "merge"
  | "split"
  | "rotate"
  | "compress";

export interface PdfToolOptions extends ImagesToPdfOptions {
  format?: "image/jpeg" | "image/png";
  ext?: string;
  quality?: number;
  ranges?: string;
  angle?: number;
  pages?: string;
}

/** Run a PDF tool and always return an array of results (1 or many files). */
export async function runPdfTool(
  mode: PdfMode,
  files: File[],
  opts: PdfToolOptions = {}
): Promise<ConversionResult[]> {
  switch (mode) {
    case "images-to-pdf":
      return [await imagesToPdf(files, opts)];
    case "pdf-to-images":
      return pdfToImages(files[0], opts);
    case "merge":
      return [await mergePdfs(files)];
    case "split":
      return splitPdf(files[0], opts.ranges ?? "");
    case "rotate":
      return [await rotatePdf(files[0], opts)];
    case "compress":
      return [await compressPdf(files[0], opts)];
    default:
      throw new Error(`Unknown PDF tool: ${mode}`);
  }
}
