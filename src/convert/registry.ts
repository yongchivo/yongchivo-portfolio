// Central catalogue of every conversion the tool offers.
//
// This drives BOTH the page generation (SEO copy, related links) and the
// landing-page grid, so adding a new conversion is a single entry here plus,
// if it needs a new decode strategy, a handler in ./engine.ts.
//
// Two kinds ship today: "image" (canvas / libheif-WASM) and "data" (pure-JS
// CSV/JSON/YAML/XML parsing). Later sessions will add documents (PDF) and
// audio: give those entries a new `kind`, teach `convertFile` in ./engine.ts
// how to handle it, and — if the widget needs a different shape — branch
// <ConverterApp> on the kind. Everything else here (routing, SEO, hreflang,
// related blocks, the category-grouped landing) keeps working unchanged.

export type ConversionKind = "image" | "data";

// How an image source is turned into something the canvas can draw.
//  - "canvas": the browser can decode it natively (PNG/JPG/WebP).
//  - "heic":  decode with the libheif WASM (libheif-js) first, then canvas.
export type DecodeStrategy = "canvas" | "heic";

// The text data formats the "data" kind can parse and emit.
export type DataFormat = "csv" | "json" | "yaml" | "xml";

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

  /** Display labels for the formats, e.g. "PNG" -> "JPG". */
  from: string;
  to: string;

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
  /** Lossy target (JPG/WebP) -> expose a quality control. Always false for data. */
  lossy: boolean;

  /** Data kind only: the parse -> serialize formats. */
  data?: { from: DataFormat; to: DataFormat };

  /** ids of 2-3 sibling conversions to cross-link. */
  related: string[];

  copy: Record<Lang, LocalisedCopy>;
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
];

export const conversionById: Record<string, Conversion> = Object.fromEntries(
  conversions.map((c) => [c.id, c])
);

export function getConversion(id: string): Conversion | undefined {
  return conversionById[id];
}
