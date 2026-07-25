// Central catalogue of every conversion the tool offers.
//
// This drives BOTH the page generation (SEO copy, related links) and the
// landing-page grid, so adding a new conversion is a single entry here plus,
// if it needs a new decode strategy, a handler in ./engine.ts.
//
// Kinds shipping today:
//  - "image"     canvas / libheif-WASM
//  - "data"      pure-JS CSV/JSON/YAML/XML parsing
//  - "pdf"       PDF <-> image FORMAT conversions (pdf-lib + pdf.js)
//  - "operation" PDF TOOLS that aren't a from->to conversion (merge / split /
//                rotate / compress). Modelled as their own kind so they don't
//                get forced into the "X to Y" shape, but they still live in the
//                same registry array and reuse routing, SEO, hreflang, the
//                landing grid and the widget shell.
//  - "audio"     audio conversions + audio extraction (FFmpeg.wasm) — grouped
//                under "Audio" on the landing (by OUTPUT family).
//  - "video"     video conversions + video->GIF (FFmpeg.wasm) — "Video" group.
// Adding a family = new `kind` here + a branch in ./engine.ts / ./pdf.ts /
// ./media.ts, and (only if the UI differs) a branch in <ConverterApp>.
// Routing/SEO don't change. This is the final block — the converter is complete.

export type ConversionKind =
  | "image"
  | "data"
  | "pdf"
  | "operation"
  | "audio"
  | "video";

// How an image source is turned into something the canvas can draw.
//  - "canvas": the browser can decode it natively (PNG/JPG/WebP).
//  - "heic":  decode with the libheif WASM (libheif-js) first, then canvas.
export type DecodeStrategy = "canvas" | "heic";

// The text data formats the "data" kind can parse and emit.
export type DataFormat = "csv" | "json" | "yaml" | "xml";

// PDF FORMAT conversions (kind "pdf").
//  - "images-to-pdf": combine N images into one PDF, in order.
//  - "pdf-to-images": render each page to an image (one PDF -> N images).
export type PdfDirection = "images-to-pdf" | "pdf-to-images";

// PDF TOOLS (kind "operation").
export type PdfOperation = "merge" | "split" | "rotate" | "compress";

export type Lang = "en" | "es";

export interface LocalisedCopy {
  /** <title> — targets the exact search query. */
  title: string;
  /** meta description. */
  description: string;
  /** H1 — the exact keyword. */
  h1: string;
  /** One-sentence intro shown under the H1. */
  intro: string;
  /** Short label used on the landing-page card. */
  card: string;
}

export interface Conversion {
  /** URL slug and stable id, e.g. "png-to-jpg". */
  id: string;
  kind: ConversionKind;

  /**
   * Display labels for a from->to conversion, e.g. "PNG" -> "JPG". Operations
   * (merge/split/rotate/compress) aren't conversions, so they leave these out.
   */
  from?: string;
  to?: string;

  /** `accept` attribute for the file input. */
  accept: string;
  /** Lower-case extensions accepted as input (no dot). */
  sourceExts: string[];
  /** MIME types accepted as input. */
  sourceMimes: string[];

  /** Output MIME type for the produced Blob. */
  targetMime: string;
  /** Output file extension (no dot). */
  targetExt: string;

  /** Image kind only: how to decode the source pixels. */
  decode?: DecodeStrategy;
  /** Lossy target (JPG/WebP) -> expose a quality control. Omitted = false. */
  lossy?: boolean;

  /** Data kind only: the parse -> serialize formats. */
  data?: { from: DataFormat; to: DataFormat };

  /** PDF format-conversion kind only ("pdf"). */
  pdf?: {
    direction: PdfDirection;
    /** For "pdf-to-images": the image MIME each page is rendered to. */
    imageFormat?: "image/jpeg" | "image/png";
  };

  /** Operation kind only ("operation"): which PDF tool this page is. */
  op?: PdfOperation;
  /** Whether the widget accepts multiple files (image->pdf, merge). */
  multi?: boolean;

  /** ids of 2-3 sibling conversions to cross-link. */
  related: string[];

  copy: Record<Lang, LocalisedCopy>;
}

/** True for PDF-tool entries (merge/split/rotate/compress). */
export function isOperation(c: Conversion): boolean {
  return c.kind === "operation";
}

/** The little mono chip shown on cards/breadcrumbs. */
export function chipLabel(c: Conversion): string {
  if (c.from && c.to) return `${c.from} → ${c.to}`;
  return c.to ?? c.from ?? c.id;
}

const PNG_MIME = "image/png";
const JPG_MIME = "image/jpeg";
const WEBP_MIME = "image/webp";

export const conversions: Conversion[] = [
  {
    id: "png-to-jpg",
    kind: "image",
    from: "PNG",
    to: "JPG",
    accept: ".png,image/png",
    sourceExts: ["png"],
    sourceMimes: [PNG_MIME],
    targetMime: JPG_MIME,
    targetExt: "jpg",
    decode: "canvas",
    lossy: true,
    related: ["jpg-to-png", "png-to-webp", "heic-to-jpg"],
    copy: {
      en: {
        title: "PNG to JPG Converter — Free, Private, In Your Browser",
        description:
          "Convert PNG to JPG for free. Batch conversion runs 100% in your browser — your images are never uploaded to a server.",
        h1: "PNG to JPG converter",
        intro:
          "Turn PNG images into JPGs right here. Fast, free, and completely private — nothing ever leaves your device.",
        card: "Convert PNG images to JPG",
      },
      es: {
        title: "Convertir PNG a JPG — Gratis, Privado y en tu Navegador",
        description:
          "Convierte PNG a JPG gratis. La conversión por lotes se ejecuta 100% en tu navegador: tus imágenes nunca se suben a ningún servidor.",
        h1: "Convertir PNG a JPG",
        intro:
          "Pasa tus imágenes PNG a JPG aquí mismo. Rápido, gratis y totalmente privado: nada sale de tu dispositivo.",
        card: "Convierte imágenes PNG a JPG",
      },
    },
  },
  {
    id: "jpg-to-png",
    kind: "image",
    from: "JPG",
    to: "PNG",
    accept: ".jpg,.jpeg,image/jpeg",
    sourceExts: ["jpg", "jpeg"],
    sourceMimes: [JPG_MIME],
    targetMime: PNG_MIME,
    targetExt: "png",
    decode: "canvas",
    lossy: false,
    related: ["png-to-jpg", "jpg-to-webp", "webp-to-png"],
    copy: {
      en: {
        title: "JPG to PNG Converter — Free, Private, In Your Browser",
        description:
          "Convert JPG to PNG for free. Batch conversion runs 100% in your browser — your photos are never uploaded to a server.",
        h1: "JPG to PNG converter",
        intro:
          "Turn JPG photos into lossless PNGs right here. Fast, free, and completely private — nothing ever leaves your device.",
        card: "Convert JPG photos to PNG",
      },
      es: {
        title: "Convertir JPG a PNG — Gratis, Privado y en tu Navegador",
        description:
          "Convierte JPG a PNG gratis. La conversión por lotes se ejecuta 100% en tu navegador: tus fotos nunca se suben a ningún servidor.",
        h1: "Convertir JPG a PNG",
        intro:
          "Pasa tus fotos JPG a PNG sin pérdida aquí mismo. Rápido, gratis y totalmente privado: nada sale de tu dispositivo.",
        card: "Convierte fotos JPG a PNG",
      },
    },
  },
  {
    id: "png-to-webp",
    kind: "image",
    from: "PNG",
    to: "WebP",
    accept: ".png,image/png",
    sourceExts: ["png"],
    sourceMimes: [PNG_MIME],
    targetMime: WEBP_MIME,
    targetExt: "webp",
    decode: "canvas",
    lossy: true,
    related: ["webp-to-png", "png-to-jpg", "jpg-to-webp"],
    copy: {
      en: {
        title: "PNG to WebP Converter — Free, Private, In Your Browser",
        description:
          "Convert PNG to WebP for free and shrink your images. Batch conversion runs 100% in your browser — nothing is ever uploaded.",
        h1: "PNG to WebP converter",
        intro:
          "Compress PNG images to modern WebP right here. Fast, free, and completely private — nothing ever leaves your device.",
        card: "Convert PNG images to WebP",
      },
      es: {
        title: "Convertir PNG a WebP — Gratis, Privado y en tu Navegador",
        description:
          "Convierte PNG a WebP gratis y reduce el peso de tus imágenes. La conversión por lotes se ejecuta 100% en tu navegador: nada se sube.",
        h1: "Convertir PNG a WebP",
        intro:
          "Comprime tus imágenes PNG al moderno formato WebP aquí mismo. Rápido, gratis y totalmente privado: nada sale de tu dispositivo.",
        card: "Convierte imágenes PNG a WebP",
      },
    },
  },
  {
    id: "webp-to-png",
    kind: "image",
    from: "WebP",
    to: "PNG",
    accept: ".webp,image/webp",
    sourceExts: ["webp"],
    sourceMimes: [WEBP_MIME],
    targetMime: PNG_MIME,
    targetExt: "png",
    decode: "canvas",
    lossy: false,
    related: ["png-to-webp", "webp-to-jpg", "jpg-to-png"],
    copy: {
      en: {
        title: "WebP to PNG Converter — Free, Private, In Your Browser",
        description:
          "Convert WebP to PNG for free. Batch conversion runs 100% in your browser — your images are never uploaded to a server.",
        h1: "WebP to PNG converter",
        intro:
          "Turn WebP images into widely-supported PNGs right here. Fast, free, and completely private — nothing ever leaves your device.",
        card: "Convert WebP images to PNG",
      },
      es: {
        title: "Convertir WebP a PNG — Gratis, Privado y en tu Navegador",
        description:
          "Convierte WebP a PNG gratis. La conversión por lotes se ejecuta 100% en tu navegador: tus imágenes nunca se suben a ningún servidor.",
        h1: "Convertir WebP a PNG",
        intro:
          "Pasa tus imágenes WebP a PNG, compatible con todo, aquí mismo. Rápido, gratis y totalmente privado: nada sale de tu dispositivo.",
        card: "Convierte imágenes WebP a PNG",
      },
    },
  },
  {
    id: "jpg-to-webp",
    kind: "image",
    from: "JPG",
    to: "WebP",
    accept: ".jpg,.jpeg,image/jpeg",
    sourceExts: ["jpg", "jpeg"],
    sourceMimes: [JPG_MIME],
    targetMime: WEBP_MIME,
    targetExt: "webp",
    decode: "canvas",
    lossy: true,
    related: ["webp-to-jpg", "jpg-to-png", "png-to-webp"],
    copy: {
      en: {
        title: "JPG to WebP Converter — Free, Private, In Your Browser",
        description:
          "Convert JPG to WebP for free and shrink your photos. Batch conversion runs 100% in your browser — nothing is ever uploaded.",
        h1: "JPG to WebP converter",
        intro:
          "Compress JPG photos to modern WebP right here. Fast, free, and completely private — nothing ever leaves your device.",
        card: "Convert JPG photos to WebP",
      },
      es: {
        title: "Convertir JPG a WebP — Gratis, Privado y en tu Navegador",
        description:
          "Convierte JPG a WebP gratis y reduce el peso de tus fotos. La conversión por lotes se ejecuta 100% en tu navegador: nada se sube.",
        h1: "Convertir JPG a WebP",
        intro:
          "Comprime tus fotos JPG al moderno formato WebP aquí mismo. Rápido, gratis y totalmente privado: nada sale de tu dispositivo.",
        card: "Convierte fotos JPG a WebP",
      },
    },
  },
  {
    id: "webp-to-jpg",
    kind: "image",
    from: "WebP",
    to: "JPG",
    accept: ".webp,image/webp",
    sourceExts: ["webp"],
    sourceMimes: [WEBP_MIME],
    targetMime: JPG_MIME,
    targetExt: "jpg",
    decode: "canvas",
    lossy: true,
    related: ["jpg-to-webp", "webp-to-png", "png-to-jpg"],
    copy: {
      en: {
        title: "WebP to JPG Converter — Free, Private, In Your Browser",
        description:
          "Convert WebP to JPG for free. Batch conversion runs 100% in your browser — your images are never uploaded to a server.",
        h1: "WebP to JPG converter",
        intro:
          "Turn WebP images into universally-supported JPGs right here. Fast, free, and completely private — nothing ever leaves your device.",
        card: "Convert WebP images to JPG",
      },
      es: {
        title: "Convertir WebP a JPG — Gratis, Privado y en tu Navegador",
        description:
          "Convierte WebP a JPG gratis. La conversión por lotes se ejecuta 100% en tu navegador: tus imágenes nunca se suben a ningún servidor.",
        h1: "Convertir WebP a JPG",
        intro:
          "Pasa tus imágenes WebP a JPG, compatible con todo, aquí mismo. Rápido, gratis y totalmente privado: nada sale de tu dispositivo.",
        card: "Convierte imágenes WebP a JPG",
      },
    },
  },
  {
    id: "heic-to-jpg",
    kind: "image",
    from: "HEIC",
    to: "JPG",
    accept: ".heic,.heif,image/heic,image/heif",
    sourceExts: ["heic", "heif"],
    sourceMimes: ["image/heic", "image/heif"],
    targetMime: JPG_MIME,
    targetExt: "jpg",
    decode: "heic",
    lossy: true,
    related: ["heic-to-png", "png-to-jpg", "webp-to-jpg"],
    copy: {
      en: {
        title: "HEIC to JPG Converter — Free, Private, In Your Browser",
        description:
          "Convert HEIC (iPhone photos) to JPG for free. Batch conversion runs 100% in your browser — your photos are never uploaded.",
        h1: "Convert HEIC to JPG",
        intro:
          "Turn Apple HEIC photos into universally-supported JPGs right here. Fast, free, and completely private — nothing ever leaves your device.",
        card: "Convert iPhone HEIC photos to JPG",
      },
      es: {
        title: "Convertir HEIC a JPG — Gratis, Privado y en tu Navegador",
        description:
          "Convierte HEIC (fotos de iPhone) a JPG gratis. La conversión por lotes se ejecuta 100% en tu navegador: tus fotos nunca se suben.",
        h1: "Convertir HEIC a JPG",
        intro:
          "Pasa las fotos HEIC de Apple a JPG, compatible con todo, aquí mismo. Rápido, gratis y totalmente privado: nada sale de tu dispositivo.",
        card: "Convierte fotos HEIC de iPhone a JPG",
      },
    },
  },
  {
    id: "heic-to-png",
    kind: "image",
    from: "HEIC",
    to: "PNG",
    accept: ".heic,.heif,image/heic,image/heif",
    sourceExts: ["heic", "heif"],
    sourceMimes: ["image/heic", "image/heif"],
    targetMime: PNG_MIME,
    targetExt: "png",
    decode: "heic",
    lossy: false,
    related: ["heic-to-jpg", "png-to-jpg", "webp-to-png"],
    copy: {
      en: {
        title: "HEIC to PNG Converter — Free, Private, In Your Browser",
        description:
          "Convert HEIC (iPhone photos) to PNG for free. Batch conversion runs 100% in your browser — your photos are never uploaded.",
        h1: "Convert HEIC to PNG",
        intro:
          "Turn Apple HEIC photos into lossless PNGs right here. Fast, free, and completely private — nothing ever leaves your device.",
        card: "Convert iPhone HEIC photos to PNG",
      },
      es: {
        title: "Convertir HEIC a PNG — Gratis, Privado y en tu Navegador",
        description:
          "Convierte HEIC (fotos de iPhone) a PNG gratis. La conversión por lotes se ejecuta 100% en tu navegador: tus fotos nunca se suben.",
        h1: "Convertir HEIC a PNG",
        intro:
          "Pasa las fotos HEIC de Apple a PNG sin pérdida aquí mismo. Rápido, gratis y totalmente privado: nada sale de tu dispositivo.",
        card: "Convierte fotos HEIC de iPhone a PNG",
      },
    },
  },

  // --- Data formats (pure-JS parsing; see ./data.ts) ----------------------

  {
    id: "csv-to-json",
    kind: "data",
    from: "CSV",
    to: "JSON",
    accept: ".csv,text/csv",
    sourceExts: ["csv"],
    sourceMimes: ["text/csv"],
    targetMime: "application/json",
    targetExt: "json",
    lossy: false,
    data: { from: "csv", to: "json" },
    related: ["json-to-csv", "csv-to-yaml", "csv-to-xml"],
    copy: {
      en: {
        title: "CSV to JSON Converter — Free, Private, In Your Browser",
        description:
          "Convert CSV to JSON online for free. Paste or drop your file — it's parsed 100% in your browser and never uploaded.",
        h1: "CSV to JSON converter",
        intro:
          "Turn CSV rows into a clean JSON array. Paste your data or drop a file — everything runs on your device, nothing is uploaded.",
        card: "Turn CSV rows into a JSON array",
      },
      es: {
        title: "Convertir CSV a JSON — Gratis, Privado y en tu Navegador",
        description:
          "Convierte CSV a JSON gratis. Pega o suelta tu archivo: se procesa 100% en tu navegador y nunca se sube.",
        h1: "Convertir CSV a JSON",
        intro:
          "Pasa las filas de un CSV a un array JSON limpio. Pega tus datos o suelta un archivo: todo se ejecuta en tu dispositivo, nada se sube.",
        card: "Pasa filas CSV a un array JSON",
      },
    },
  },
  {
    id: "json-to-csv",
    kind: "data",
    from: "JSON",
    to: "CSV",
    accept: ".json,application/json",
    sourceExts: ["json"],
    sourceMimes: ["application/json"],
    targetMime: "text/csv",
    targetExt: "csv",
    lossy: false,
    data: { from: "json", to: "csv" },
    related: ["csv-to-json", "json-to-yaml", "json-to-xml"],
    copy: {
      en: {
        title: "JSON to CSV Converter — Free, Private, In Your Browser",
        description:
          "Convert JSON to CSV online for free. Paste or drop a JSON array — it's converted 100% in your browser and never uploaded.",
        h1: "JSON to CSV converter",
        intro:
          "Flatten a JSON array of objects into a spreadsheet-ready CSV. Paste your data or drop a file — nothing ever leaves your device.",
        card: "Flatten a JSON array into CSV",
      },
      es: {
        title: "Convertir JSON a CSV — Gratis, Privado y en tu Navegador",
        description:
          "Convierte JSON a CSV gratis. Pega o suelta un array JSON: se convierte 100% en tu navegador y nunca se sube.",
        h1: "Convertir JSON a CSV",
        intro:
          "Convierte un array JSON de objetos en un CSV listo para hoja de cálculo. Pega tus datos o suelta un archivo: nada sale de tu dispositivo.",
        card: "Convierte un array JSON en CSV",
      },
    },
  },
  {
    id: "json-to-yaml",
    kind: "data",
    from: "JSON",
    to: "YAML",
    accept: ".json,application/json",
    sourceExts: ["json"],
    sourceMimes: ["application/json"],
    targetMime: "text/yaml",
    targetExt: "yaml",
    lossy: false,
    data: { from: "json", to: "yaml" },
    related: ["yaml-to-json", "json-to-csv", "json-to-xml"],
    copy: {
      en: {
        title: "JSON to YAML Converter — Free, Private, In Your Browser",
        description:
          "Convert JSON to YAML online for free. Paste or drop your JSON — it's converted 100% in your browser and never uploaded.",
        h1: "JSON to YAML converter",
        intro:
          "Turn JSON into readable YAML for configs and pipelines. Paste your data or drop a file — everything runs on your device.",
        card: "Turn JSON into readable YAML",
      },
      es: {
        title: "Convertir JSON a YAML — Gratis, Privado y en tu Navegador",
        description:
          "Convierte JSON a YAML gratis. Pega o suelta tu JSON: se convierte 100% en tu navegador y nunca se sube.",
        h1: "Convertir JSON a YAML",
        intro:
          "Pasa JSON a un YAML legible para configuraciones y pipelines. Pega tus datos o suelta un archivo: todo se ejecuta en tu dispositivo.",
        card: "Pasa JSON a un YAML legible",
      },
    },
  },
  {
    id: "yaml-to-json",
    kind: "data",
    from: "YAML",
    to: "JSON",
    accept: ".yaml,.yml,text/yaml,application/x-yaml",
    sourceExts: ["yaml", "yml"],
    sourceMimes: ["text/yaml", "application/x-yaml"],
    targetMime: "application/json",
    targetExt: "json",
    lossy: false,
    data: { from: "yaml", to: "json" },
    related: ["json-to-yaml", "yaml-to-csv", "xml-to-json"],
    copy: {
      en: {
        title: "YAML to JSON Converter — Free, Private, In Your Browser",
        description:
          "Convert YAML to JSON online for free. Paste or drop your YAML — it's parsed 100% in your browser and never uploaded.",
        h1: "YAML to JSON converter",
        intro:
          "Turn YAML configs into JSON. Paste your data or drop a file — broken indentation is reported clearly, and nothing is uploaded.",
        card: "Turn YAML configs into JSON",
      },
      es: {
        title: "Convertir YAML a JSON — Gratis, Privado y en tu Navegador",
        description:
          "Convierte YAML a JSON gratis. Pega o suelta tu YAML: se procesa 100% en tu navegador y nunca se sube.",
        h1: "Convertir YAML a JSON",
        intro:
          "Pasa configuraciones YAML a JSON. Pega tus datos o suelta un archivo: la indentación incorrecta se avisa con claridad y nada se sube.",
        card: "Pasa configuraciones YAML a JSON",
      },
    },
  },
  {
    id: "csv-to-xml",
    kind: "data",
    from: "CSV",
    to: "XML",
    accept: ".csv,text/csv",
    sourceExts: ["csv"],
    sourceMimes: ["text/csv"],
    targetMime: "application/xml",
    targetExt: "xml",
    lossy: false,
    data: { from: "csv", to: "xml" },
    related: ["xml-to-csv", "csv-to-json", "csv-to-yaml"],
    copy: {
      en: {
        title: "CSV to XML Converter — Free, Private, In Your Browser",
        description:
          "Convert CSV to XML online for free. Paste or drop your file — it's converted 100% in your browser and never uploaded.",
        h1: "CSV to XML converter",
        intro:
          "Turn CSV rows into structured XML records. Paste your data or drop a file — everything runs on your device, nothing is uploaded.",
        card: "Turn CSV rows into XML records",
      },
      es: {
        title: "Convertir CSV a XML — Gratis, Privado y en tu Navegador",
        description:
          "Convierte CSV a XML gratis. Pega o suelta tu archivo: se convierte 100% en tu navegador y nunca se sube.",
        h1: "Convertir CSV a XML",
        intro:
          "Pasa las filas de un CSV a registros XML estructurados. Pega tus datos o suelta un archivo: todo se ejecuta en tu dispositivo, nada se sube.",
        card: "Pasa filas CSV a registros XML",
      },
    },
  },
  {
    id: "xml-to-csv",
    kind: "data",
    from: "XML",
    to: "CSV",
    accept: ".xml,application/xml,text/xml",
    sourceExts: ["xml"],
    sourceMimes: ["application/xml", "text/xml"],
    targetMime: "text/csv",
    targetExt: "csv",
    lossy: false,
    data: { from: "xml", to: "csv" },
    related: ["csv-to-xml", "xml-to-json", "yaml-to-csv"],
    copy: {
      en: {
        title: "XML to CSV Converter — Free, Private, In Your Browser",
        description:
          "Convert XML to CSV online for free. Paste or drop your XML — it's converted 100% in your browser and never uploaded.",
        h1: "XML to CSV converter",
        intro:
          "Flatten repeating XML records into a spreadsheet-ready CSV. Paste your data or drop a file — nothing ever leaves your device.",
        card: "Flatten XML records into CSV",
      },
      es: {
        title: "Convertir XML a CSV — Gratis, Privado y en tu Navegador",
        description:
          "Convierte XML a CSV gratis. Pega o suelta tu XML: se convierte 100% en tu navegador y nunca se sube.",
        h1: "Convertir XML a CSV",
        intro:
          "Convierte registros XML repetidos en un CSV listo para hoja de cálculo. Pega tus datos o suelta un archivo: nada sale de tu dispositivo.",
        card: "Convierte registros XML en CSV",
      },
    },
  },
  {
    id: "json-to-xml",
    kind: "data",
    from: "JSON",
    to: "XML",
    accept: ".json,application/json",
    sourceExts: ["json"],
    sourceMimes: ["application/json"],
    targetMime: "application/xml",
    targetExt: "xml",
    lossy: false,
    data: { from: "json", to: "xml" },
    related: ["xml-to-json", "json-to-csv", "json-to-yaml"],
    copy: {
      en: {
        title: "JSON to XML Converter — Free, Private, In Your Browser",
        description:
          "Convert JSON to XML online for free. Paste or drop your JSON — it's converted 100% in your browser and never uploaded.",
        h1: "JSON to XML converter",
        intro:
          "Turn JSON into structured XML. Paste your data or drop a file — everything runs on your device, and nothing is uploaded.",
        card: "Turn JSON into structured XML",
      },
      es: {
        title: "Convertir JSON a XML — Gratis, Privado y en tu Navegador",
        description:
          "Convierte JSON a XML gratis. Pega o suelta tu JSON: se convierte 100% en tu navegador y nunca se sube.",
        h1: "Convertir JSON a XML",
        intro:
          "Pasa JSON a XML estructurado. Pega tus datos o suelta un archivo: todo se ejecuta en tu dispositivo y nada se sube.",
        card: "Pasa JSON a XML estructurado",
      },
    },
  },
  {
    id: "xml-to-json",
    kind: "data",
    from: "XML",
    to: "JSON",
    accept: ".xml,application/xml,text/xml",
    sourceExts: ["xml"],
    sourceMimes: ["application/xml", "text/xml"],
    targetMime: "application/json",
    targetExt: "json",
    lossy: false,
    data: { from: "xml", to: "json" },
    related: ["json-to-xml", "xml-to-csv", "yaml-to-json"],
    copy: {
      en: {
        title: "XML to JSON Converter — Free, Private, In Your Browser",
        description:
          "Convert XML to JSON online for free. Paste or drop your XML — it's parsed 100% in your browser and never uploaded.",
        h1: "XML to JSON converter",
        intro:
          "Turn XML into JSON your code can use. Paste your data or drop a file — malformed XML is reported clearly, and nothing is uploaded.",
        card: "Turn XML into usable JSON",
      },
      es: {
        title: "Convertir XML a JSON — Gratis, Privado y en tu Navegador",
        description:
          "Convierte XML a JSON gratis. Pega o suelta tu XML: se procesa 100% en tu navegador y nunca se sube.",
        h1: "Convertir XML a JSON",
        intro:
          "Pasa XML a JSON que tu código pueda usar. Pega tus datos o suelta un archivo: el XML mal formado se avisa con claridad y nada se sube.",
        card: "Pasa XML a JSON utilizable",
      },
    },
  },
  {
    id: "yaml-to-csv",
    kind: "data",
    from: "YAML",
    to: "CSV",
    accept: ".yaml,.yml,text/yaml,application/x-yaml",
    sourceExts: ["yaml", "yml"],
    sourceMimes: ["text/yaml", "application/x-yaml"],
    targetMime: "text/csv",
    targetExt: "csv",
    lossy: false,
    data: { from: "yaml", to: "csv" },
    related: ["csv-to-yaml", "yaml-to-json", "xml-to-csv"],
    copy: {
      en: {
        title: "YAML to CSV Converter — Free, Private, In Your Browser",
        description:
          "Convert YAML to CSV online for free. Paste or drop your YAML — it's converted 100% in your browser and never uploaded.",
        h1: "YAML to CSV converter",
        intro:
          "Turn a YAML list of records into a spreadsheet-ready CSV. Paste your data or drop a file — nothing ever leaves your device.",
        card: "Turn a YAML list into CSV",
      },
      es: {
        title: "Convertir YAML a CSV — Gratis, Privado y en tu Navegador",
        description:
          "Convierte YAML a CSV gratis. Pega o suelta tu YAML: se convierte 100% en tu navegador y nunca se sube.",
        h1: "Convertir YAML a CSV",
        intro:
          "Convierte una lista YAML de registros en un CSV listo para hoja de cálculo. Pega tus datos o suelta un archivo: nada sale de tu dispositivo.",
        card: "Convierte una lista YAML en CSV",
      },
    },
  },
  {
    id: "csv-to-yaml",
    kind: "data",
    from: "CSV",
    to: "YAML",
    accept: ".csv,text/csv",
    sourceExts: ["csv"],
    sourceMimes: ["text/csv"],
    targetMime: "text/yaml",
    targetExt: "yaml",
    lossy: false,
    data: { from: "csv", to: "yaml" },
    related: ["yaml-to-csv", "csv-to-json", "csv-to-xml"],
    copy: {
      en: {
        title: "CSV to YAML Converter — Free, Private, In Your Browser",
        description:
          "Convert CSV to YAML online for free. Paste or drop your file — it's converted 100% in your browser and never uploaded.",
        h1: "CSV to YAML converter",
        intro:
          "Turn CSV rows into a readable YAML list. Paste your data or drop a file — everything runs on your device, nothing is uploaded.",
        card: "Turn CSV rows into a YAML list",
      },
      es: {
        title: "Convertir CSV a YAML — Gratis, Privado y en tu Navegador",
        description:
          "Convierte CSV a YAML gratis. Pega o suelta tu archivo: se convierte 100% en tu navegador y nunca se sube.",
        h1: "Convertir CSV a YAML",
        intro:
          "Pasa las filas de un CSV a una lista YAML legible. Pega tus datos o suelta un archivo: todo se ejecuta en tu dispositivo, nada se sube.",
        card: "Pasa filas CSV a una lista YAML",
      },
    },
  },

  // --- PDF format conversions (kind "pdf"; see ./pdf.ts) -------------------

  {
    id: "jpg-to-pdf",
    kind: "pdf",
    from: "JPG",
    to: "PDF",
    accept: ".jpg,.jpeg,image/jpeg",
    sourceExts: ["jpg", "jpeg"],
    sourceMimes: ["image/jpeg"],
    targetMime: "application/pdf",
    targetExt: "pdf",
    pdf: { direction: "images-to-pdf" },
    multi: true,
    related: ["png-to-pdf", "pdf-to-jpg", "merge-pdf"],
    copy: {
      en: {
        title: "JPG to PDF Converter — Free, Private, In Your Browser",
        description:
          "Convert JPG to PDF for free. Combine several JPGs into one PDF, in order — 100% in your browser, nothing uploaded.",
        h1: "JPG to PDF converter",
        intro:
          "Combine one or many JPG images into a single PDF, in the order you choose. Fast, free and private — nothing ever leaves your device.",
        card: "Combine JPG images into one PDF",
      },
      es: {
        title: "Convertir JPG a PDF — Gratis, Privado y en tu Navegador",
        description:
          "Convierte JPG a PDF gratis. Combina varios JPG en un solo PDF, en orden — 100% en tu navegador, nada se sube.",
        h1: "Convertir JPG a PDF",
        intro:
          "Combina una o varias imágenes JPG en un único PDF, en el orden que elijas. Rápido, gratis y privado: nada sale de tu dispositivo.",
        card: "Combina imágenes JPG en un PDF",
      },
    },
  },
  {
    id: "png-to-pdf",
    kind: "pdf",
    from: "PNG",
    to: "PDF",
    accept: ".png,image/png",
    sourceExts: ["png"],
    sourceMimes: ["image/png"],
    targetMime: "application/pdf",
    targetExt: "pdf",
    pdf: { direction: "images-to-pdf" },
    multi: true,
    related: ["jpg-to-pdf", "pdf-to-png", "merge-pdf"],
    copy: {
      en: {
        title: "PNG to PDF Converter — Free, Private, In Your Browser",
        description:
          "Convert PNG to PDF for free. Combine several PNGs into one PDF, in order — 100% in your browser, nothing uploaded.",
        h1: "PNG to PDF converter",
        intro:
          "Combine one or many PNG images into a single PDF, in the order you choose. Fast, free and private — nothing ever leaves your device.",
        card: "Combine PNG images into one PDF",
      },
      es: {
        title: "Convertir PNG a PDF — Gratis, Privado y en tu Navegador",
        description:
          "Convierte PNG a PDF gratis. Combina varios PNG en un solo PDF, en orden — 100% en tu navegador, nada se sube.",
        h1: "Convertir PNG a PDF",
        intro:
          "Combina una o varias imágenes PNG en un único PDF, en el orden que elijas. Rápido, gratis y privado: nada sale de tu dispositivo.",
        card: "Combina imágenes PNG en un PDF",
      },
    },
  },
  {
    id: "pdf-to-jpg",
    kind: "pdf",
    from: "PDF",
    to: "JPG",
    accept: ".pdf,application/pdf",
    sourceExts: ["pdf"],
    sourceMimes: ["application/pdf"],
    targetMime: "image/jpeg",
    targetExt: "jpg",
    pdf: { direction: "pdf-to-images", imageFormat: "image/jpeg" },
    related: ["pdf-to-png", "jpg-to-pdf", "split-pdf"],
    copy: {
      en: {
        title: "PDF to JPG Converter — Free, Private, In Your Browser",
        description:
          "Convert PDF to JPG for free. Every page becomes a JPG image, downloaded individually — 100% in your browser, nothing uploaded.",
        h1: "PDF to JPG converter",
        intro:
          "Render each page of a PDF to a JPG image and download them individually. Fast, free and private — nothing ever leaves your device.",
        card: "Render PDF pages to JPG images",
      },
      es: {
        title: "Convertir PDF a JPG — Gratis, Privado y en tu Navegador",
        description:
          "Convierte PDF a JPG gratis. Cada página se convierte en una imagen JPG, descargable por separado — 100% en tu navegador, nada se sube.",
        h1: "Convertir PDF a JPG",
        intro:
          "Convierte cada página de un PDF en una imagen JPG y descárgalas por separado. Rápido, gratis y privado: nada sale de tu dispositivo.",
        card: "Convierte páginas PDF en imágenes JPG",
      },
    },
  },
  {
    id: "pdf-to-png",
    kind: "pdf",
    from: "PDF",
    to: "PNG",
    accept: ".pdf,application/pdf",
    sourceExts: ["pdf"],
    sourceMimes: ["application/pdf"],
    targetMime: "image/png",
    targetExt: "png",
    pdf: { direction: "pdf-to-images", imageFormat: "image/png" },
    related: ["pdf-to-jpg", "png-to-pdf", "split-pdf"],
    copy: {
      en: {
        title: "PDF to PNG Converter — Free, Private, In Your Browser",
        description:
          "Convert PDF to PNG for free. Every page becomes a lossless PNG image — 100% in your browser, nothing uploaded.",
        h1: "PDF to PNG converter",
        intro:
          "Render each page of a PDF to a lossless PNG image and download them individually. Fast, free and private — nothing ever leaves your device.",
        card: "Render PDF pages to PNG images",
      },
      es: {
        title: "Convertir PDF a PNG — Gratis, Privado y en tu Navegador",
        description:
          "Convierte PDF a PNG gratis. Cada página se convierte en una imagen PNG sin pérdida — 100% en tu navegador, nada se sube.",
        h1: "Convertir PDF a PNG",
        intro:
          "Convierte cada página de un PDF en una imagen PNG sin pérdida y descárgalas por separado. Rápido, gratis y privado: nada sale de tu dispositivo.",
        card: "Convierte páginas PDF en imágenes PNG",
      },
    },
  },

  // --- PDF tools (kind "operation"; see ./pdf.ts) -------------------------

  {
    id: "merge-pdf",
    kind: "operation",
    op: "merge",
    accept: ".pdf,application/pdf",
    sourceExts: ["pdf"],
    sourceMimes: ["application/pdf"],
    targetMime: "application/pdf",
    targetExt: "pdf",
    multi: true,
    related: ["split-pdf", "rotate-pdf", "jpg-to-pdf"],
    copy: {
      en: {
        title: "Merge PDF — Combine PDFs Free, Private, In Your Browser",
        description:
          "Merge PDF files into one for free. Reorder them, then combine — 100% in your browser, nothing uploaded.",
        h1: "Merge PDF",
        intro:
          "Combine several PDFs into a single document, in the order you choose. Fast, free and private — nothing ever leaves your device.",
        card: "Combine several PDFs into one",
      },
      es: {
        title: "Unir PDF — Combina PDFs Gratis y Privado en tu Navegador",
        description:
          "Une archivos PDF en uno solo gratis. Reordénalos y combínalos — 100% en tu navegador, nada se sube.",
        h1: "Unir PDF",
        intro:
          "Combina varios PDF en un único documento, en el orden que elijas. Rápido, gratis y privado: nada sale de tu dispositivo.",
        card: "Combina varios PDF en uno",
      },
    },
  },
  {
    id: "split-pdf",
    kind: "operation",
    op: "split",
    accept: ".pdf,application/pdf",
    sourceExts: ["pdf"],
    sourceMimes: ["application/pdf"],
    targetMime: "application/pdf",
    targetExt: "pdf",
    related: ["merge-pdf", "rotate-pdf", "pdf-to-jpg"],
    copy: {
      en: {
        title: "Split PDF — Extract Pages Free, Private, In Your Browser",
        description:
          "Split a PDF by page ranges into separate files for free. 100% in your browser — nothing is uploaded.",
        h1: "Split PDF",
        intro:
          "Extract page ranges (e.g. 1-3, 5, 8-10) from a PDF into separate files. Fast, free and private — nothing ever leaves your device.",
        card: "Extract page ranges into new PDFs",
      },
      es: {
        title: "Dividir PDF — Extrae Páginas Gratis y Privado en tu Navegador",
        description:
          "Divide un PDF por rangos de páginas en archivos separados, gratis. 100% en tu navegador: nada se sube.",
        h1: "Dividir PDF",
        intro:
          "Extrae rangos de páginas (p. ej. 1-3, 5, 8-10) de un PDF en archivos separados. Rápido, gratis y privado: nada sale de tu dispositivo.",
        card: "Extrae rangos de páginas en nuevos PDF",
      },
    },
  },
  {
    id: "rotate-pdf",
    kind: "operation",
    op: "rotate",
    accept: ".pdf,application/pdf",
    sourceExts: ["pdf"],
    sourceMimes: ["application/pdf"],
    targetMime: "application/pdf",
    targetExt: "pdf",
    related: ["merge-pdf", "split-pdf", "compress-pdf"],
    copy: {
      en: {
        title: "Rotate PDF — Turn Pages 90/180/270 Free, In Your Browser",
        description:
          "Rotate PDF pages 90, 180 or 270 degrees for free. All pages or selected ones — 100% in your browser, nothing uploaded.",
        h1: "Rotate PDF",
        intro:
          "Turn every page — or only the pages you pick — by 90°, 180° or 270°. Fast, free and private — nothing ever leaves your device.",
        card: "Rotate pages 90 / 180 / 270°",
      },
      es: {
        title: "Rotar PDF — Gira Páginas 90/180/270 Gratis en tu Navegador",
        description:
          "Rota páginas de PDF 90, 180 o 270 grados gratis. Todas o solo algunas — 100% en tu navegador, nada se sube.",
        h1: "Rotar PDF",
        intro:
          "Gira todas las páginas — o solo las que elijas — 90°, 180° o 270°. Rápido, gratis y privado: nada sale de tu dispositivo.",
        card: "Rota páginas 90 / 180 / 270°",
      },
    },
  },
  {
    id: "compress-pdf",
    kind: "operation",
    op: "compress",
    accept: ".pdf,application/pdf",
    sourceExts: ["pdf"],
    sourceMimes: ["application/pdf"],
    targetMime: "application/pdf",
    targetExt: "pdf",
    related: ["rotate-pdf", "merge-pdf", "pdf-to-jpg"],
    copy: {
      en: {
        title: "Compress PDF — Reduce PDF Size Free, In Your Browser",
        description:
          "Compress a PDF to reduce its file size, free and in your browser. Re-renders pages as images and strips metadata — nothing uploaded.",
        h1: "Compress PDF",
        intro:
          "Shrink a PDF by re-rendering each page as an image at a quality you choose and stripping metadata. Best for scanned or image-heavy PDFs; mostly-text files may not shrink much, and page text becomes non-selectable. All in your browser.",
        card: "Reduce a PDF's file size",
      },
      es: {
        title: "Comprimir PDF — Reduce el Tamaño Gratis en tu Navegador",
        description:
          "Comprime un PDF para reducir su tamaño, gratis y en tu navegador. Re-renderiza las páginas como imágenes y elimina metadatos — nada se sube.",
        h1: "Comprimir PDF",
        intro:
          "Reduce un PDF re-renderizando cada página como imagen con la calidad que elijas y eliminando metadatos. Ideal para PDF escaneados o con muchas imágenes; los de solo texto quizá no se reduzcan mucho y el texto deja de ser seleccionable. Todo en tu navegador.",
        card: "Reduce el tamaño de un PDF",
      },
    },
  },

  // --- Audio (FFmpeg.wasm; see ./media.ts) --------------------------------

  {
    id: "mp3-to-wav",
    kind: "audio",
    from: "MP3",
    to: "WAV",
    accept: ".mp3,audio/mpeg",
    sourceExts: ["mp3"],
    sourceMimes: ["audio/mpeg"],
    targetMime: "audio/wav",
    targetExt: "wav",
    related: ["wav-to-mp3", "m4a-to-mp3", "mp4-to-mp3"],
    copy: {
      en: {
        title: "MP3 to WAV Converter — Free, Private, In Your Browser",
        description:
          "Convert MP3 to WAV for free. Decoding runs 100% in your browser with FFmpeg — your audio is never uploaded.",
        h1: "MP3 to WAV converter",
        intro:
          "Turn MP3 audio into uncompressed WAV, entirely in your browser. Nothing is uploaded — the whole conversion happens on your device.",
        card: "Convert MP3 audio to WAV",
      },
      es: {
        title: "Convertir MP3 a WAV — Gratis, Privado y en tu Navegador",
        description:
          "Convierte MP3 a WAV gratis. La decodificación se ejecuta 100% en tu navegador con FFmpeg: tu audio nunca se sube.",
        h1: "Convertir MP3 a WAV",
        intro:
          "Pasa tu audio MP3 a WAV sin comprimir, por completo en tu navegador. Nada se sube: toda la conversión ocurre en tu dispositivo.",
        card: "Convierte audio MP3 a WAV",
      },
    },
  },
  {
    id: "wav-to-mp3",
    kind: "audio",
    from: "WAV",
    to: "MP3",
    accept: ".wav,audio/wav,audio/x-wav",
    sourceExts: ["wav"],
    sourceMimes: ["audio/wav", "audio/x-wav"],
    targetMime: "audio/mpeg",
    targetExt: "mp3",
    related: ["mp3-to-wav", "m4a-to-mp3", "flac-to-mp3"],
    copy: {
      en: {
        title: "WAV to MP3 Converter — Free, Private, In Your Browser",
        description:
          "Convert WAV to MP3 for free and shrink your audio. Runs 100% in your browser with FFmpeg — nothing is uploaded.",
        h1: "WAV to MP3 converter",
        intro:
          "Compress WAV audio to MP3 right here. Fast, free and private — the conversion runs on your device and nothing is uploaded.",
        card: "Compress WAV audio to MP3",
      },
      es: {
        title: "Convertir WAV a MP3 — Gratis, Privado y en tu Navegador",
        description:
          "Convierte WAV a MP3 gratis y reduce el peso de tu audio. Se ejecuta 100% en tu navegador con FFmpeg: nada se sube.",
        h1: "Convertir WAV a MP3",
        intro:
          "Comprime tu audio WAV a MP3 aquí mismo. Rápido, gratis y privado: la conversión se ejecuta en tu dispositivo y nada se sube.",
        card: "Comprime audio WAV a MP3",
      },
    },
  },
  {
    id: "m4a-to-mp3",
    kind: "audio",
    from: "M4A",
    to: "MP3",
    accept: ".m4a,audio/mp4,audio/x-m4a",
    sourceExts: ["m4a"],
    sourceMimes: ["audio/mp4", "audio/x-m4a"],
    targetMime: "audio/mpeg",
    targetExt: "mp3",
    related: ["wav-to-mp3", "m4a-to-wav", "ogg-to-mp3"],
    copy: {
      en: {
        title: "M4A to MP3 Converter — Free, Private, In Your Browser",
        description:
          "Convert M4A to MP3 for free. Runs 100% in your browser with FFmpeg — your audio is never uploaded to a server.",
        h1: "M4A to MP3 converter",
        intro:
          "Turn M4A (AAC) audio into universally-supported MP3, entirely in your browser. Nothing ever leaves your device.",
        card: "Convert M4A audio to MP3",
      },
      es: {
        title: "Convertir M4A a MP3 — Gratis, Privado y en tu Navegador",
        description:
          "Convierte M4A a MP3 gratis. Se ejecuta 100% en tu navegador con FFmpeg: tu audio nunca se sube a ningún servidor.",
        h1: "Convertir M4A a MP3",
        intro:
          "Pasa tu audio M4A (AAC) a MP3, compatible con todo, por completo en tu navegador. Nada sale de tu dispositivo.",
        card: "Convierte audio M4A a MP3",
      },
    },
  },
  {
    id: "flac-to-mp3",
    kind: "audio",
    from: "FLAC",
    to: "MP3",
    accept: ".flac,audio/flac,audio/x-flac",
    sourceExts: ["flac"],
    sourceMimes: ["audio/flac", "audio/x-flac"],
    targetMime: "audio/mpeg",
    targetExt: "mp3",
    related: ["wav-to-mp3", "m4a-to-mp3", "ogg-to-mp3"],
    copy: {
      en: {
        title: "FLAC to MP3 Converter — Free, Private, In Your Browser",
        description:
          "Convert FLAC to MP3 for free. Runs 100% in your browser with FFmpeg — your lossless audio is never uploaded.",
        h1: "FLAC to MP3 converter",
        intro:
          "Turn lossless FLAC into portable MP3, entirely in your browser. Fast, free and private — nothing is uploaded.",
        card: "Convert FLAC audio to MP3",
      },
      es: {
        title: "Convertir FLAC a MP3 — Gratis, Privado y en tu Navegador",
        description:
          "Convierte FLAC a MP3 gratis. Se ejecuta 100% en tu navegador con FFmpeg: tu audio sin pérdida nunca se sube.",
        h1: "Convertir FLAC a MP3",
        intro:
          "Pasa tu FLAC sin pérdida a un MP3 portátil, por completo en tu navegador. Rápido, gratis y privado: nada se sube.",
        card: "Convierte audio FLAC a MP3",
      },
    },
  },
  {
    id: "ogg-to-mp3",
    kind: "audio",
    from: "OGG",
    to: "MP3",
    accept: ".ogg,audio/ogg",
    sourceExts: ["ogg"],
    sourceMimes: ["audio/ogg"],
    targetMime: "audio/mpeg",
    targetExt: "mp3",
    related: ["m4a-to-mp3", "flac-to-mp3", "wav-to-mp3"],
    copy: {
      en: {
        title: "OGG to MP3 Converter — Free, Private, In Your Browser",
        description:
          "Convert OGG to MP3 for free. Runs 100% in your browser with FFmpeg — your audio is never uploaded.",
        h1: "OGG to MP3 converter",
        intro:
          "Turn OGG Vorbis audio into universally-supported MP3, entirely in your browser. Nothing ever leaves your device.",
        card: "Convert OGG audio to MP3",
      },
      es: {
        title: "Convertir OGG a MP3 — Gratis, Privado y en tu Navegador",
        description:
          "Convierte OGG a MP3 gratis. Se ejecuta 100% en tu navegador con FFmpeg: tu audio nunca se sube.",
        h1: "Convertir OGG a MP3",
        intro:
          "Pasa tu audio OGG Vorbis a MP3, compatible con todo, por completo en tu navegador. Nada sale de tu dispositivo.",
        card: "Convierte audio OGG a MP3",
      },
    },
  },
  {
    id: "m4a-to-wav",
    kind: "audio",
    from: "M4A",
    to: "WAV",
    accept: ".m4a,audio/mp4,audio/x-m4a",
    sourceExts: ["m4a"],
    sourceMimes: ["audio/mp4", "audio/x-m4a"],
    targetMime: "audio/wav",
    targetExt: "wav",
    related: ["m4a-to-mp3", "mp3-to-wav", "mp4-to-wav"],
    copy: {
      en: {
        title: "M4A to WAV Converter — Free, Private, In Your Browser",
        description:
          "Convert M4A to WAV for free. Runs 100% in your browser with FFmpeg — your audio is never uploaded.",
        h1: "M4A to WAV converter",
        intro:
          "Turn M4A (AAC) audio into uncompressed WAV, entirely in your browser. Nothing ever leaves your device.",
        card: "Convert M4A audio to WAV",
      },
      es: {
        title: "Convertir M4A a WAV — Gratis, Privado y en tu Navegador",
        description:
          "Convierte M4A a WAV gratis. Se ejecuta 100% en tu navegador con FFmpeg: tu audio nunca se sube.",
        h1: "Convertir M4A a WAV",
        intro:
          "Pasa tu audio M4A (AAC) a WAV sin comprimir, por completo en tu navegador. Nada sale de tu dispositivo.",
        card: "Convierte audio M4A a WAV",
      },
    },
  },
  {
    id: "mp4-to-mp3",
    kind: "audio",
    from: "MP4",
    to: "MP3",
    accept: ".mp4,video/mp4",
    sourceExts: ["mp4"],
    sourceMimes: ["video/mp4"],
    targetMime: "audio/mpeg",
    targetExt: "mp3",
    related: ["mp4-to-wav", "m4a-to-mp3", "mov-to-mp4"],
    copy: {
      en: {
        title: "MP4 to MP3 Converter — Extract Audio Free, In Your Browser",
        description:
          "Extract MP3 audio from an MP4 video for free. Runs 100% in your browser with FFmpeg — nothing is uploaded.",
        h1: "MP4 to MP3 converter",
        intro:
          "Pull the audio track out of an MP4 video as an MP3, entirely in your browser. Nothing is uploaded — it all runs on your device.",
        card: "Extract MP3 audio from MP4 video",
      },
      es: {
        title: "Convertir MP4 a MP3 — Extrae el Audio Gratis en tu Navegador",
        description:
          "Extrae el audio MP3 de un vídeo MP4 gratis. Se ejecuta 100% en tu navegador con FFmpeg: nada se sube.",
        h1: "Convertir MP4 a MP3",
        intro:
          "Saca la pista de audio de un vídeo MP4 como MP3, por completo en tu navegador. Nada se sube: todo se ejecuta en tu dispositivo.",
        card: "Extrae audio MP3 de un vídeo MP4",
      },
    },
  },
  {
    id: "mp4-to-wav",
    kind: "audio",
    from: "MP4",
    to: "WAV",
    accept: ".mp4,video/mp4",
    sourceExts: ["mp4"],
    sourceMimes: ["video/mp4"],
    targetMime: "audio/wav",
    targetExt: "wav",
    related: ["mp4-to-mp3", "m4a-to-wav", "mp3-to-wav"],
    copy: {
      en: {
        title: "MP4 to WAV Converter — Extract Audio Free, In Your Browser",
        description:
          "Extract WAV audio from an MP4 video for free. Runs 100% in your browser with FFmpeg — nothing is uploaded.",
        h1: "MP4 to WAV converter",
        intro:
          "Pull the audio track out of an MP4 video as an uncompressed WAV, entirely in your browser. Nothing ever leaves your device.",
        card: "Extract WAV audio from MP4 video",
      },
      es: {
        title: "Convertir MP4 a WAV — Extrae el Audio Gratis en tu Navegador",
        description:
          "Extrae el audio WAV de un vídeo MP4 gratis. Se ejecuta 100% en tu navegador con FFmpeg: nada se sube.",
        h1: "Convertir MP4 a WAV",
        intro:
          "Saca la pista de audio de un vídeo MP4 como WAV sin comprimir, por completo en tu navegador. Nada sale de tu dispositivo.",
        card: "Extrae audio WAV de un vídeo MP4",
      },
    },
  },

  // --- Video (FFmpeg.wasm; see ./media.ts) --------------------------------

  {
    id: "mov-to-mp4",
    kind: "video",
    from: "MOV",
    to: "MP4",
    accept: ".mov,video/quicktime",
    sourceExts: ["mov"],
    sourceMimes: ["video/quicktime"],
    targetMime: "video/mp4",
    targetExt: "mp4",
    related: ["mp4-to-webm", "mp4-to-gif", "mp4-to-mp3"],
    copy: {
      en: {
        title: "MOV to MP4 Converter — Free, Private, In Your Browser",
        description:
          "Convert MOV to MP4 for free. Runs 100% in your browser with FFmpeg — your video is never uploaded to a server.",
        h1: "MOV to MP4 converter",
        intro:
          "Turn an Apple QuickTime MOV into a widely-supported MP4, entirely in your browser. Nothing is uploaded — it all runs on your device.",
        card: "Convert QuickTime MOV to MP4",
      },
      es: {
        title: "Convertir MOV a MP4 — Gratis, Privado y en tu Navegador",
        description:
          "Convierte MOV a MP4 gratis. Se ejecuta 100% en tu navegador con FFmpeg: tu vídeo nunca se sube a ningún servidor.",
        h1: "Convertir MOV a MP4",
        intro:
          "Pasa un MOV de Apple QuickTime a un MP4 compatible con todo, por completo en tu navegador. Nada se sube: todo se ejecuta en tu dispositivo.",
        card: "Convierte MOV de QuickTime a MP4",
      },
    },
  },
  {
    id: "mp4-to-webm",
    kind: "video",
    from: "MP4",
    to: "WebM",
    accept: ".mp4,video/mp4",
    sourceExts: ["mp4"],
    sourceMimes: ["video/mp4"],
    targetMime: "video/webm",
    targetExt: "webm",
    related: ["webm-to-mp4", "mov-to-mp4", "mp4-to-gif"],
    copy: {
      en: {
        title: "MP4 to WebM Converter — Free, Private, In Your Browser",
        description:
          "Convert MP4 to WebM for free. Runs 100% in your browser with FFmpeg — your video is never uploaded.",
        h1: "MP4 to WebM converter",
        intro:
          "Turn an MP4 into an open WebM video, entirely in your browser. Nothing is uploaded — it all runs on your device.",
        card: "Convert MP4 video to WebM",
      },
      es: {
        title: "Convertir MP4 a WebM — Gratis, Privado y en tu Navegador",
        description:
          "Convierte MP4 a WebM gratis. Se ejecuta 100% en tu navegador con FFmpeg: tu vídeo nunca se sube.",
        h1: "Convertir MP4 a WebM",
        intro:
          "Pasa un MP4 a un vídeo WebM abierto, por completo en tu navegador. Nada se sube: todo se ejecuta en tu dispositivo.",
        card: "Convierte vídeo MP4 a WebM",
      },
    },
  },
  {
    id: "webm-to-mp4",
    kind: "video",
    from: "WebM",
    to: "MP4",
    accept: ".webm,video/webm",
    sourceExts: ["webm"],
    sourceMimes: ["video/webm"],
    targetMime: "video/mp4",
    targetExt: "mp4",
    related: ["mp4-to-webm", "mov-to-mp4", "mp4-to-mp3"],
    copy: {
      en: {
        title: "WebM to MP4 Converter — Free, Private, In Your Browser",
        description:
          "Convert WebM to MP4 for free. Runs 100% in your browser with FFmpeg — your video is never uploaded.",
        h1: "WebM to MP4 converter",
        intro:
          "Turn a WebM into a universally-supported MP4, entirely in your browser. Nothing is uploaded — it all runs on your device.",
        card: "Convert WebM video to MP4",
      },
      es: {
        title: "Convertir WebM a MP4 — Gratis, Privado y en tu Navegador",
        description:
          "Convierte WebM a MP4 gratis. Se ejecuta 100% en tu navegador con FFmpeg: tu vídeo nunca se sube.",
        h1: "Convertir WebM a MP4",
        intro:
          "Pasa un WebM a un MP4 compatible con todo, por completo en tu navegador. Nada se sube: todo se ejecuta en tu dispositivo.",
        card: "Convierte vídeo WebM a MP4",
      },
    },
  },
  {
    id: "mp4-to-gif",
    kind: "video",
    from: "MP4",
    to: "GIF",
    accept: ".mp4,video/mp4",
    sourceExts: ["mp4"],
    sourceMimes: ["video/mp4"],
    targetMime: "image/gif",
    targetExt: "gif",
    related: ["mov-to-mp4", "mp4-to-webm", "mp4-to-mp3"],
    copy: {
      en: {
        title: "MP4 to GIF Converter — Free, Private, In Your Browser",
        description:
          "Convert MP4 to an animated GIF for free. Runs 100% in your browser with FFmpeg — your video is never uploaded.",
        h1: "MP4 to GIF converter",
        intro:
          "Turn an MP4 clip into an animated GIF, with adjustable frame rate and width, entirely in your browser. Nothing is uploaded.",
        card: "Turn an MP4 clip into a GIF",
      },
      es: {
        title: "Convertir MP4 a GIF — Gratis, Privado y en tu Navegador",
        description:
          "Convierte MP4 en un GIF animado gratis. Se ejecuta 100% en tu navegador con FFmpeg: tu vídeo nunca se sube.",
        h1: "Convertir MP4 a GIF",
        intro:
          "Convierte un clip MP4 en un GIF animado, con fotogramas y ancho ajustables, por completo en tu navegador. Nada se sube.",
        card: "Convierte un clip MP4 en un GIF",
      },
    },
  },
];

export const conversionById: Record<string, Conversion> = Object.fromEntries(
  conversions.map((c) => [c.id, c])
);

export function getConversion(id: string): Conversion | undefined {
  return conversionById[id];
}
