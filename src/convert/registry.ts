// Central catalogue of every conversion the tool offers.
//
// This drives BOTH the page generation (SEO copy, related links) and the
// landing-page grid, so adding a new conversion is a single entry here plus,
// if it needs a new decode strategy, a handler in ./engine.ts.
//
// This session ships image conversions only. Later sessions will add data
// (CSV/JSON), documents (PDF) and audio: give those entries a new `kind`
// ("data" | "document" | "audio") and teach `convertFile` in ./engine.ts how
// to handle that kind. Everything else here — routing, SEO, related blocks —
// keeps working unchanged.

export type ConversionKind = "image";

// How the source file is turned into something the canvas can draw.
//  - "canvas": the browser can decode it natively (PNG/JPG/WebP).
//  - "heic":  decode with the libheif WASM (libheif-js) first, then canvas.
export type DecodeStrategy = "canvas" | "heic";

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

  /** Output MIME type passed to canvas.toBlob(). */
  targetMime: string;
  /** Output file extension (no dot). */
  targetExt: string;

  decode: DecodeStrategy;
  /** Lossy target (JPG/WebP) -> expose a quality control. */
  lossy: boolean;

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
];

export const conversionById: Record<string, Conversion> = Object.fromEntries(
  conversions.map((c) => [c.id, c])
);

export function getConversion(id: string): Conversion | undefined {
  return conversionById[id];
}
