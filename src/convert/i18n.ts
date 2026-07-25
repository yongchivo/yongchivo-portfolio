// UI strings for the converter, shared by every conversion page and the
// interactive controller. Page-level SEO copy lives in ./registry.ts; these
// are the labels for the widget chrome.

import type { Lang } from "./registry";

export interface ConverterStrings {
  dropTitle: string;
  dropHint: string;
  browse: string;
  noUploads: string;
  privacyNote: string;
  quality: string;
  converting: string;
  done: string;
  error: string;
  wrongType: string;
  download: string;
  downloadAll: string;
  clear: string;
  relatedTitle: string;
  landingTitle: string;
  landingIntro: string;
  landingNote: string;
  backToAll: string;
  // Data-converter widget + landing categories.
  catImage: string;
  catData: string;
  dataInputLabel: string;
  dataOutputLabel: string;
  dataDrop: string;
  pastePlaceholder: string;
  copy: string;
  copied: string;
  emptyOutput: string;
}

export const strings: Record<Lang, ConverterStrings> = {
  en: {
    dropTitle: "Drop files here",
    dropHint: "or click to choose — convert as many at once as you like",
    browse: "Choose files",
    noUploads: "100% in your browser — nothing is uploaded",
    privacyNote:
      "Your files are converted on your own device. They are never sent to a server, so nothing can be seen, stored, or leaked.",
    quality: "Quality",
    converting: "Converting…",
    done: "Ready",
    error: "Failed",
    wrongType: "Not a supported file for this converter — skipped",
    download: "Download",
    downloadAll: "Download all",
    clear: "Clear",
    relatedTitle: "Related conversions",
    landingTitle: "File Converter",
    landingIntro:
      "Free, private file conversion that runs entirely in your browser. Pick a conversion below — your files never leave your device.",
    landingNote: "Everything runs in your browser. No uploads, no sign-up, no limits.",
    backToAll: "All converters",
    catImage: "Image",
    catData: "Data",
    dataInputLabel: "Input",
    dataOutputLabel: "Output",
    dataDrop: "Drop a file or click to choose",
    pastePlaceholder: "…or paste your text here",
    copy: "Copy",
    copied: "Copied!",
    emptyOutput: "Your converted result will appear here.",
  },
  es: {
    dropTitle: "Suelta los archivos aquí",
    dropHint: "o haz clic para elegir — convierte todos los que quieras a la vez",
    browse: "Elegir archivos",
    noUploads: "100% en tu navegador — no se sube nada",
    privacyNote:
      "Tus archivos se convierten en tu propio dispositivo. Nunca se envían a un servidor, así que nada puede verse, guardarse ni filtrarse.",
    quality: "Calidad",
    converting: "Convirtiendo…",
    done: "Listo",
    error: "Error",
    wrongType: "No es un archivo compatible con este conversor — omitido",
    download: "Descargar",
    downloadAll: "Descargar todo",
    clear: "Limpiar",
    relatedTitle: "Conversiones relacionadas",
    landingTitle: "Conversor de Archivos",
    landingIntro:
      "Conversión de archivos gratis y privada que se ejecuta por completo en tu navegador. Elige una conversión abajo: tus archivos nunca salen de tu dispositivo.",
    landingNote:
      "Todo se ejecuta en tu navegador. Sin subidas, sin registro, sin límites.",
    backToAll: "Todos los conversores",
    catImage: "Imágenes",
    catData: "Datos",
    dataInputLabel: "Entrada",
    dataOutputLabel: "Resultado",
    dataDrop: "Suelta un archivo o haz clic para elegir",
    pastePlaceholder: "…o pega tu texto aquí",
    copy: "Copiar",
    copied: "¡Copiado!",
    emptyOutput: "Tu resultado convertido aparecerá aquí.",
  },
};
