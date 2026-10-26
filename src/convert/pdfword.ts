// PDF -> Word (.docx), 100% client-side.
//
// pdf.js gives positioned text runs (with their fonts) and the page's operator
// list (where each image is painted). We rebuild flowing paragraphs from the
// text, drop the images in at their vertical position, and write a minimal
// WordprocessingML package with JSZip. It is a reconstruction, not a layout
// copy: tables and columns become plain paragraphs, vector drawings are
// dropped. A scanned PDF (no text layer) comes through as its page images.

import type { PDFPageProxy as PdfPage } from "pdfjs-dist";
import type { ConversionResult } from "./engine";
import { ConvertError } from "./errors";
import { canvasToBlob, friendlyPdfError, loadPdfjs, stripExt } from "./pdf";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MARGIN_PT = 72; // Word's default 1" margins
const EMU_PER_PT = 12700;
const MAX_IMAGE_PX = 3000; // longest side; keeps canvases and the .docx sane

type Matrix = number[]; // [a, b, c, d, e, f]

interface Run {
  text: string;
  font: string;
  size: number;
  bold: boolean;
  italic: boolean;
}
interface Line {
  baseline: number;
  x: number;
  right: number;
  size: number;
  runs: Run[];
}
interface Para {
  top: number;
  lines: Line[];
}
interface Img {
  top: number;
  wPt: number;
  hPt: number;
  id: number;
}
type Block = { para: Para } | { img: Img };

/** Same composition pdf.js uses (Util.transform): m · n. */
function mul(m: Matrix, n: Matrix): Matrix {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}

/** pdf.js object stores resolve asynchronously; give up after `ms` rather than hang. */
function objGet(page: PdfPage, id: string, ms = 10000): Promise<any> {
  const store = id.startsWith("g_") ? page.commonObjs : page.objs;
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    store.get(id, (v: unknown) => {
      clearTimeout(timer);
      resolve(v);
    });
  });
}

/** "ABCDEF+TimesNewRomanPS-BoldMT" -> { family: "Times New Roman", bold: true }. */
function fontInfo(f: any): { family: string; bold: boolean; italic: boolean } {
  const raw = String(f?.name ?? "").replace(/^[A-Z]{6}\+/, "");
  const bold = !!f?.bold || !!f?.black || /bold|black|heavy|semibold|demi/i.test(raw);
  const italic = !!f?.italic || /italic|oblique/i.test(raw);
  let family = raw
    .split(/[-,]/)[0]
    .replace(/(PS)?MT$|PS$|Std$/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
  if (/^helvetica|^arial/i.test(family)) family = "Arial";
  else if (/^times/i.test(family)) family = "Times New Roman";
  else if (/^courier/i.test(family)) family = "Courier New";
  return { family: family || "Calibri", bold, italic };
}

/** Decoded pdf.js image -> JPEG bytes on white (alpha flattened), or null to skip. */
async function imageToJpeg(img: any): Promise<Uint8Array | null> {
  const w = img?.width;
  const h = img?.height;
  if (!w || !h || w * h < 64) return null; // spacer pixels
  let source: CanvasImageSource;
  if (img.bitmap) {
    source = img.bitmap;
  } else if (img.data) {
    const rgba = new Uint8ClampedArray(w * h * 4);
    const src = img.data as Uint8Array;
    if (img.kind === 3) rgba.set(src.subarray(0, rgba.length));
    else if (img.kind === 2) {
      for (let i = 0, j = 0; j < rgba.length; i += 3, j += 4) {
        rgba[j] = src[i];
        rgba[j + 1] = src[i + 1];
        rgba[j + 2] = src[i + 2];
        rgba[j + 3] = 255;
      }
    } else if (img.kind === 1) {
      // 1 bit per pixel, rows byte-aligned, 1 = white (as pdf.js paints it).
      const rowBytes = (w + 7) >> 3;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const v = src[y * rowBytes + (x >> 3)] & (128 >> (x & 7)) ? 255 : 0;
          const j = (y * w + x) * 4;
          rgba[j] = rgba[j + 1] = rgba[j + 2] = v;
          rgba[j + 3] = 255;
        }
    } else return null;
    const full = document.createElement("canvas");
    full.width = w;
    full.height = h;
    full.getContext("2d")!.putImageData(new ImageData(rgba, w, h), 0, 0);
    source = full;
  } else return null;

  const scale = Math.min(1, MAX_IMAGE_PX / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const blob = await canvasToBlob(canvas, "image/jpeg", 0.9);
  canvas.width = canvas.height = 0;
  return new Uint8Array(await blob.arrayBuffer());
}

/** Text lines -> paragraphs (line spacing, indent, short last line, bullets). */
function toParagraphs(lines: Line[]): Para[] {
  const paras: Para[] = [];
  let cur: Para | null = null;
  for (const line of lines) {
    const prev = cur?.lines[cur.lines.length - 1];
    const text = line.runs.map((r) => r.text).join("");
    const startsNew =
      !prev ||
      line.baseline - prev.baseline <= 0 ||
      line.baseline - prev.baseline > prev.size * 1.45 ||
      Math.abs(line.size - prev.size) > 1 ||
      line.x > cur!.lines[0].x + line.size * 1.5 || // indented first line
      prev.right < Math.max(...cur!.lines.map((l) => l.right)) - line.size * 4 || // short last line
      /^\s*([•◦▪·‣–-]|\d+[.)])\s/.test(text);
    if (startsNew) {
      cur = { top: line.baseline - line.size, lines: [line] };
      paras.push(cur);
    } else cur!.lines.push(line);
  }
  return paras;
}

async function readPage(
  page: PdfPage,
  OPS: Record<string, number>,
  media: Map<string, number | null>, // image key -> media id (null = skipped)
  addMedia: (bytes: Uint8Array) => number
): Promise<{ blocks: Block[]; width: number; height: number }> {
  const viewport = page.getViewport({ scale: 1 });
  const ops = await page.getOperatorList(); // also loads the page's fonts + images

  // --- images: walk the operator list tracking the CTM -------------------
  const imgs: Img[] = [];
  let ctm: Matrix = [1, 0, 0, 1, 0, 0];
  const stack: Matrix[] = [];
  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i];
    const args = ops.argsArray[i];
    if (fn === OPS.save) stack.push(ctm);
    else if (fn === OPS.restore) ctm = stack.pop() ?? ctm;
    else if (fn === OPS.transform) ctm = mul(ctm, args);
    else if (fn === OPS.paintFormXObjectBegin) {
      stack.push(ctm);
      if (Array.isArray(args?.[0])) ctm = mul(ctm, args[0]);
    } else if (fn === OPS.paintFormXObjectEnd) ctm = stack.pop() ?? ctm;
    else if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject) {
      // The image fills the unit square under the CTM.
      const pts = [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ].map(([x, y]) =>
        viewport.convertToViewportPoint(ctm[0] * x + ctm[2] * y + ctm[4], ctm[1] * x + ctm[3] * y + ctm[5])
      );
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      const wPt = Math.max(...xs) - Math.min(...xs);
      const hPt = Math.max(...ys) - Math.min(...ys);
      if (wPt < 4 || hPt < 4) continue;

      const key =
        fn === OPS.paintImageXObject ? `${String(args[0]).startsWith("g_") ? "" : page.pageNumber}:${args[0]}` : "";
      let m = key ? media.get(key) : undefined;
      if (m === undefined) {
        const data = fn === OPS.paintImageXObject ? await objGet(page, args[0]) : args[0];
        const jpeg = await imageToJpeg(data).catch(() => null);
        m = jpeg ? addMedia(jpeg) : null;
        if (key) media.set(key, m);
      }
      if (m) imgs.push({ top: Math.min(...ys), wPt, hPt, id: m });
    }
  }

  // --- text: stream order -> lines -> paragraphs -------------------------
  const content = await page.getTextContent();
  const fonts = new Map<string, ReturnType<typeof fontInfo>>();
  const lines: Line[] = [];
  let line: Line | null = null;
  for (const item of content.items as any[]) {
    if (typeof item.str !== "string") continue;
    if (!item.str) {
      if (item.hasEOL) line = null;
      continue;
    }
    const t = item.transform as Matrix;
    const [x, baseline] = viewport.convertToViewportPoint(t[4], t[5]);
    const size = Math.hypot(t[2], t[3]) || item.height || 10;
    if (!fonts.has(item.fontName)) fonts.set(item.fontName, fontInfo(await objGet(page, item.fontName, 3000)));
    const f = fonts.get(item.fontName)!;

    const sameLine =
      line && Math.abs(baseline - line.baseline) < size * 0.5 && x >= line.right - size;
    if (!sameLine) {
      line = { baseline, x, right: x, size, runs: [] };
      lines.push(line);
    }
    const l = line!;
    const last = l.runs[l.runs.length - 1];
    let text = item.str as string;
    if (last && x - l.right > size * 0.25 && !/\s$/.test(last.text) && !/^\s/.test(text)) text = " " + text;
    if (last && last.font === f.family && last.bold === f.bold && last.italic === f.italic && Math.abs(last.size - size) < 0.5)
      last.text += text;
    else l.runs.push({ text, font: f.family, size, bold: f.bold, italic: f.italic });
    l.right = Math.max(l.right, x + (item.width || 0));
    l.size = Math.max(l.size, size);
    if (item.hasEOL) line = null;
  }

  // --- merge: images go before the first paragraph that starts below them ---
  const blocks: Block[] = toParagraphs(lines).map((para) => ({ para }));
  for (const img of imgs.sort((a, b) => a.top - b.top)) {
    const at = blocks.findIndex((b) => "para" in b && b.para.top > img.top);
    blocks.splice(at === -1 ? blocks.length : at, 0, { img });
  }
  return { blocks, width: viewport.width, height: viewport.height };
}

// --- WordprocessingML ---------------------------------------------------------

function xml(s: string): string {
  return s
    .replace(/[^\x09\x0A\x0D\x20-퟿-�\u{10000}-\u{10FFFF}]/gu, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function runXml(r: Run): string {
  const half = Math.max(2, Math.round(r.size * 2));
  const font = xml(r.font);
  return (
    `<w:r><w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}"/>` +
    (r.bold ? "<w:b/>" : "") +
    (r.italic ? "<w:i/>" : "") +
    `<w:sz w:val="${half}"/><w:szCs w:val="${half}"/></w:rPr>` +
    `<w:t xml:space="preserve">${xml(r.text)}</w:t></w:r>`
  );
}

function paraXml(p: Para, pageWidth: number): string {
  // Join wrapped lines with a space (none after a trailing hyphen/space).
  const runs: Run[] = [];
  p.lines.forEach((l, i) => {
    l.runs.forEach((r, j) => {
      const copy = { ...r };
      if (i > 0 && j === 0) {
        const prev = runs[runs.length - 1];
        if (prev && !/[\s-]$/.test(prev.text)) copy.text = " " + copy.text;
      }
      runs.push(copy);
    });
  });
  // A single line sitting in the middle of the page reads as centred (titles).
  const l = p.lines[0];
  const centred =
    p.lines.length === 1 &&
    l.x > pageWidth * 0.2 &&
    Math.abs((l.x + l.right) / 2 - pageWidth / 2) < l.size;
  return (
    `<w:p><w:pPr><w:spacing w:after="120"/>${centred ? '<w:jc w:val="center"/>' : ""}</w:pPr>` +
    runs.map(runXml).join("") +
    "</w:p>"
  );
}

function imgXml(img: Img, maxWPt: number, maxHPt: number): string {
  const scale = Math.min(1, maxWPt / img.wPt, maxHPt / img.hPt);
  const cx = Math.round(img.wPt * scale * EMU_PER_PT);
  const cy = Math.round(img.hPt * scale * EMU_PER_PT);
  const n = img.id;
  return (
    `<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${n}" name="Picture ${n}"/>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
    `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:nvPicPr><pic:cNvPr id="${n}" name="image${n}.jpeg"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="rIdImg${n}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>` +
    `</a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`
  );
}

export async function pdfToWord(file: File): Promise<ConversionResult> {
  const pdfjs = await loadPdfjs();
  let doc;
  try {
    doc = await pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      isEvalSupported: false,
      disableFontFace: true, // we only need font names, not glyphs
    }).promise;
  } catch (err) {
    throw friendlyPdfError(err);
  }

  const images: Uint8Array[] = [];
  const addMedia = (bytes: Uint8Array) => images.push(bytes); // 1-based id
  const media = new Map<string, number | null>();
  const body: string[] = [];
  let pageSize: [number, number] = [612, 792];
  let hasContent = false;

  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const { blocks, width, height } = await readPage(page, pdfjs.OPS as any, media, addMedia);
      if (i === 1) pageSize = [width, height];
      if (i > 1) body.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
      const maxW = pageSize[0] - 2 * MARGIN_PT;
      const maxH = pageSize[1] - 2 * MARGIN_PT;
      for (const b of blocks) {
        hasContent = true;
        body.push("para" in b ? paraXml(b.para, width) : imgXml(b.img, maxW, maxH));
      }
      page.cleanup();
    }
  } finally {
    await doc.destroy();
  }

  if (!hasContent) {
    throw new ConvertError(
      "pdfWordEmpty",
      "No text or images could be found in this PDF."
    );
  }

  const [pw, ph] = pageSize;
  const twip = (pt: number) => Math.round(pt * 20);
  const m = twip(MARGIN_PT);
  const sect =
    `<w:sectPr><w:pgSz w:w="${twip(pw)}" w:h="${twip(ph)}"${pw > ph ? ' w:orient="landscape"' : ""}/>` +
    `<w:pgMar w:top="${m}" w:right="${m}" w:bottom="${m}" w:left="${m}" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>`;

  const documentXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"` +
    ` xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"` +
    ` xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">` +
    `<w:body>${body.join("")}${sect}</w:body></w:document>`;

  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  // No directory entries: real .docx files don't have them.
  const add = (name: string, data: string | Uint8Array) =>
    zip.file(name, data, { createFolders: false });
  add(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
      `<Default Extension="xml" ContentType="application/xml"/>` +
      `<Default Extension="jpeg" ContentType="image/jpeg"/>` +
      `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
      `</Types>`
  );
  add(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>` +
      `</Relationships>`
  );
  add(
    "word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      images
        .map(
          (_, i) =>
            `<Relationship Id="rIdImg${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${i + 1}.jpeg"/>`
        )
        .join("") +
      `</Relationships>`
  );
  add("word/document.xml", documentXml);
  images.forEach((bytes, i) => add(`word/media/image${i + 1}.jpeg`, bytes));

  const blob = await zip.generateAsync({ type: "blob", mimeType: DOCX_MIME, compression: "DEFLATE" });
  return { blob, filename: `${stripExt(file.name)}.docx` };
}
