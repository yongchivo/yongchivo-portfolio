// Generates public/cv/john-cv.pdf from the shared CV content in src/data/cv.ts.
//
//   npm run cv:pdf
//
// Run this after editing src/data/cv.ts — the same data drives the /cv page, so
// the PDF is regenerated rather than hand-maintained.
//
// Design notes: the site itself is dark (#0b0a14 with a magenta/purple/cyan
// gradient), which is wrong for a document people print and for ATS parsers, so
// the PDF inverts to a light page and carries the brand through in the accent
// purple only. Text is drawn as real text, never as an image, so it stays
// selectable and machine-readable.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import {
  contact,
  profile,
  education,
  projects,
  academicProjects,
  experience,
  certifications,
  skills,
} from "../src/data/cv.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "public/cv/john-cv.pdf");

// A4, in points.
const PAGE_W = 595.276;
const PAGE_H = 841.89;

const MARGIN_X = 48;
const MARGIN_TOP = 46;
const MARGIN_BOTTOM = 52;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

// Brand purple (#a855f7) deepened to #7c3aed so it holds up as text on white.
const ACCENT = rgb(0.486, 0.227, 0.929);
const ACCENT_FAINT = rgb(0.886, 0.855, 0.98);
const INK = rgb(0.102, 0.09, 0.141);
const MUTED = rgb(0.42, 0.42, 0.48);

/**
 * The base-14 fonts are WinAnsi-encoded; anything outside that set throws at
 * draw time. Map the typographic characters we actually use and drop the rest.
 */
function sanitize(text) {
  return text
    .replace(/’/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7E -ÿ–—•·]/g, "");
}

function wrap(text, font, size, maxWidth) {
  const words = sanitize(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = word;
  }
  if (line) lines.push(line);
  return lines;
}

async function build() {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);

  pdf.setTitle(`${contact.name} — CV`);
  pdf.setAuthor(contact.name);
  pdf.setSubject(contact.headline);
  pdf.setCreator("yongchivo.com");
  pdf.setProducer("pdf-lib");

  const pages = [];
  let page;
  let y;

  function newPage() {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    pages.push(page);
    y = PAGE_H - MARGIN_TOP;
  }

  /** Reserve vertical space, starting a new page when the block will not fit. */
  function need(height) {
    if (y - height < MARGIN_BOTTOM) newPage();
  }

  function drawLines(lines, { font, size, color, leading, indent = 0 }) {
    for (const line of lines) {
      need(leading);
      page.drawText(line, {
        x: MARGIN_X + indent,
        y: y - size,
        size,
        font,
        color,
      });
      y -= leading;
    }
  }

  function drawParagraph(text, opts) {
    const indent = opts.indent ?? 0;
    drawLines(wrap(text, opts.font, opts.size, CONTENT_W - indent), opts);
  }

  newPage();

  // --- Header -------------------------------------------------------------
  page.drawText(sanitize(contact.name), {
    x: MARGIN_X,
    y: y - 25,
    size: 25,
    font: bold,
    color: INK,
  });
  y -= 34;

  page.drawText(sanitize(contact.headline), {
    x: MARGIN_X,
    y: y - 12,
    size: 12,
    font: regular,
    color: ACCENT,
  });
  y -= 20;

  const contactLine = [
    contact.email,
    contact.website,
    contact.github,
    contact.linkedin,
  ].join("  ·  ");
  drawParagraph(contactLine, {
    font: regular,
    size: 8.8,
    color: MUTED,
    leading: 11.5,
  });

  y -= 8;
  page.drawRectangle({
    x: MARGIN_X,
    y,
    width: CONTENT_W,
    height: 1.8,
    color: ACCENT,
  });
  y -= 18;

  // --- Sections -----------------------------------------------------------
  // Blocks measure themselves before drawing so nothing is orphaned: an entry
  // moves to the next page whole rather than splitting mid-sentence, and a
  // heading follows its first block across the break instead of stranding.
  const HEADING_H = 26;

  function heading(text, firstBlockHeight = 30) {
    need(HEADING_H + firstBlockHeight);
    page.drawText(sanitize(text.toUpperCase()), {
      x: MARGIN_X,
      y: y - 11,
      size: 11,
      font: bold,
      color: ACCENT,
    });
    y -= 15;
    page.drawRectangle({
      x: MARGIN_X,
      y,
      width: CONTENT_W,
      height: 0.8,
      color: ACCENT_FAINT,
    });
    y -= 9;
  }

  function entryHeight({ body }) {
    return 14 + 13 + wrap(body, regular, 9.5, CONTENT_W).length * 12.5 + 7;
  }

  function entry({ title, subtitle, body }) {
    const bodyLines = wrap(body, regular, 9.5, CONTENT_W);
    const height = entryHeight({ body });
    // Keep the whole entry together when it can fit on a page of its own.
    if (height <= PAGE_H - MARGIN_TOP - MARGIN_BOTTOM) need(height);

    page.drawText(sanitize(title), {
      x: MARGIN_X,
      y: y - 10.5,
      size: 10.5,
      font: bold,
      color: INK,
    });
    y -= 14;

    page.drawText(sanitize(subtitle), {
      x: MARGIN_X,
      y: y - 9,
      size: 9,
      font: italic,
      color: MUTED,
    });
    y -= 13;

    drawLines(bodyLines, {
      font: regular,
      size: 9.5,
      color: INK,
      leading: 12.5,
    });
    y -= 7;
  }

  function bullet(text) {
    const lines = wrap(text, regular, 9.5, CONTENT_W - 12);
    need(12.5 * lines.length);
    page.drawText("•", {
      x: MARGIN_X,
      y: y - 9.5,
      size: 9.5,
      font: regular,
      color: ACCENT,
    });
    drawLines(lines, {
      font: regular,
      size: 9.5,
      color: INK,
      leading: 12.5,
      indent: 12,
    });
  }

  /** Bold label, with the value set in a column beside it. */
  function labelWidthOf(label) {
    // The trailing gap is explicit rather than a drawn space, which is too
    // narrow to read as separation after a long bold label.
    return bold.widthOfTextAtSize(`${sanitize(label)}:`, 9.5) + 5;
  }

  function labelled(label, value) {
    const indent = labelWidthOf(label);
    const lines = wrap(value, regular, 9.5, CONTENT_W - indent);

    need(12.5 * lines.length);
    page.drawText(`${sanitize(label)}:`, {
      x: MARGIN_X,
      y: y - 9.5,
      size: 9.5,
      font: bold,
      color: INK,
    });
    // Continuation lines align under the value, not back at the margin.
    drawLines(lines, {
      font: regular,
      size: 9.5,
      color: INK,
      leading: 12.5,
      indent,
    });
  }

  heading("Profile", 3 * 12.5);
  drawParagraph(profile, {
    font: regular,
    size: 9.5,
    color: INK,
    leading: 12.5,
  });
  y -= 8;

  heading("Education", entryHeight(education[0]));
  education.forEach(entry);
  y -= 1;

  heading("Projects", entryHeight(projects[0]));
  projects.forEach(entry);
  y -= 1;

  heading("Academic Projects", entryHeight(academicProjects[0]));
  academicProjects.forEach(entry);
  y -= 1;

  heading("Experience", entryHeight(experience[0]));
  experience.forEach(entry);
  y -= 1;

  heading("Certifications & Licences", 3 * 12.5);
  certifications.forEach(bullet);
  y -= 9;

  heading("Skills", 2 * 12.5);
  for (const group of skills) {
    labelled(group.name, group.items.join(" · "));
    y -= 2;
  }

  // --- Footers ------------------------------------------------------------
  pages.forEach((p, i) => {
    const left = `${contact.name} · ${contact.website}/cv`;
    const right = `Page ${i + 1} of ${pages.length}`;
    p.drawText(sanitize(left), {
      x: MARGIN_X,
      y: MARGIN_BOTTOM - 24,
      size: 8,
      font: regular,
      color: MUTED,
    });
    p.drawText(right, {
      x: PAGE_W - MARGIN_X - regular.widthOfTextAtSize(right, 8),
      y: MARGIN_BOTTOM - 24,
      size: 8,
      font: regular,
      color: MUTED,
    });
  });

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, await pdf.save());

  const { size } = await readFile(OUT).then((b) => ({ size: b.length }));
  console.log(
    `Wrote ${OUT.replace(ROOT + "/", "")} — ${pages.length} page(s), ${(size / 1024).toFixed(1)} KB`,
  );
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
