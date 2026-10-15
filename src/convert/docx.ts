// Word (.docx) -> PDF, 100% client-side.
//
// docx-preview turns the .docx into HTML pages; the browser's own print engine
// then writes the PDF ("Save as PDF"), so text stays real, selectable text.
// Loaded on demand, so docx-preview + JSZip only ship to the Word page.
//
// The document is rendered inside a same-origin <iframe> so its CSS can't
// leak into the site, and printing that frame prints only the document.
// Hardening, since the .docx is untrusted input:
//  - renderAltChunks: false — altChunks embed raw HTML via <iframe srcdoc>,
//    which would inherit our CSP (inline scripts allowed).
//  - every link that isn't http(s)/mailto/#anchor loses its href.
//  - useBase64URL: images/fonts as data: URLs (font-src only allows data:).

const CLASS = "docx";

export async function renderDocx(file: File, frame: HTMLIFrameElement): Promise<void> {
  const { renderAsync } = await import("docx-preview");
  const doc = frame.contentDocument;
  if (!doc) throw new Error("Preview frame unavailable");
  doc.head.replaceChildren();
  doc.body.replaceChildren();

  await renderAsync(file, doc.body, doc.head, {
    className: CLASS,
    inWrapper: true,
    hideWrapperOnPrint: true,
    ignoreLastRenderedPageBreak: false, // follow Word's own page breaks
    useBase64URL: true,
    renderAltChunks: false,
    renderComments: false,
    renderChanges: false,
  });

  doc.querySelectorAll("a").forEach((a) => {
    const href = a.getAttribute("href") ?? "";
    if (!/^(https?:|mailto:|#)/i.test(href)) a.removeAttribute("href");
    else if (!href.startsWith("#")) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
  });

  // One docx page = one printed sheet, no margins (the docx margins are the
  // section's padding). Shave 1pt off each page's min-height so rounding never
  // spills an empty sheet. ponytail: @page uses the first section's size; a
  // document mixing portrait and landscape sections prints all at that size.
  const sections = doc.querySelectorAll<HTMLElement>(`section.${CLASS}`);
  const first = sections[0];
  const size =
    first?.style.width && first.style.minHeight
      ? `${first.style.width} ${first.style.minHeight}`
      : "auto";
  sections.forEach((s) => {
    if (s.style.minHeight) s.style.minHeight = `calc(${s.style.minHeight} - 1pt)`;
  });

  // On screen, shrink the pages to the frame's width (a centred flex column
  // would otherwise crop the left edge of a page wider than the frame). The
  // frame must be visible here, or clientWidth is 0.
  const fit = first ? Math.min(1, (frame.clientWidth - 60) / first.offsetWidth) : 1;

  const style = doc.createElement("style");
  style.textContent = `
    body { margin: 0; }
    @media screen { .${CLASS}-wrapper { zoom: ${fit > 0 ? fit : 1}; } }
    @media print {
      @page { size: ${size}; margin: 0; }
      section.${CLASS} { break-after: page; box-shadow: none; margin: 0; }
      section.${CLASS}:last-of-type { break-after: auto; }
    }`;
  doc.head.appendChild(style);
  doc.title = file.name.replace(/\.docx$/i, "");
}
