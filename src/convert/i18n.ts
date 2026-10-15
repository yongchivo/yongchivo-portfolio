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
  // PDF widget + landing categories.
  catPdf: string;
  catPdfTools: string;
  // Word -> PDF (document kind).
  catDocument: string;
  docDrop: string;
  runSavePdf: string;
  docPrintHint: string;
  docRendering: string;
  docNotDocx: string;
  docLegacyDoc: string;
  /** {mb} is replaced with the size limit. */
  docTooLarge: string;
  docReadFailed: string;
  docPreviewLabel: string;
  pdfDropImages: string;
  pdfDropPdf: string;
  runCreatePdf: string;
  runConvert: string;
  runMerge: string;
  runSplit: string;
  runRotate: string;
  runCompress: string;
  working: string;
  resultsTitle: string;
  moveUp: string;
  moveDown: string;
  remove: string;
  pageSizeLabel: string;
  pageSizeFit: string;
  pageSizeLetter: string;
  orientationLabel: string;
  orientationAuto: string;
  orientationPortrait: string;
  orientationLandscape: string;
  marginLabel: string;
  marginNone: string;
  marginSmall: string;
  marginLarge: string;
  marginCustom: string;
  marginCustomLabel: string;
  imagesEmpty: string;
  /** {name} is replaced with the file name. */
  notAnImage: string;
  /** {name} / {mb} are replaced. */
  imageTooLarge: string;
  /** {max} is replaced with the image limit. */
  tooManyImages: string;
  // PDF errors (thrown as ConvertError from ./pdf).
  pdfPasswordRequired: string;
  pdfInvalid: string;
  rangesEmpty: string;
  /** {tok} is replaced with the offending range. */
  rangeUnreadable: string;
  /** {tok} / {count} are replaced. */
  rangeOutOfRange: string;
  /** {tok} is replaced with the offending page. */
  pageListUnreadable: string;
  /** {tok} / {count} are replaced. */
  pageOutOfRange: string;
  marginsTooLarge: string;
  addAtLeastOneImage: string;
  notSupportedImage: string;
  /** {name} is the file name, {why} the (already localised) reason. */
  fileError: string;
  addAtLeastTwoPdfs: string;
  splitLabel: string;
  splitPlaceholder: string;
  rotationLabel: string;
  rotatePagesLabel: string;
  rotatePagesPlaceholder: string;
  compressQualityHint: string;
  // Audio/video (FFmpeg) widget + landing categories.
  catAudio: string;
  catVideo: string;
  mediaDropAudio: string;
  mediaDropVideo: string;
  runConvertMedia: string;
  mediaLoading: string;
  mediaConverting: string;
  gifFpsLabel: string;
  gifWidthLabel: string;
  /** {mb} is replaced with the size limit. */
  mediaTooLarge: string;
  safariVideoNote: string;
  // Engine / media / data errors (thrown as ConvertError).
  heicDecodeFailed: string;
  heicNoImage: string;
  encodeFailed: string;
  mediaReadFailed: string;
  mediaConvertFailed: string;
  mediaNoOutput: string;
  mediaEmptyOutput: string;
  /** {format} is the data format, {detail} the parser's own (English) message. */
  invalidFormat: string;
  /** As invalidFormat, plus {row} (CSV row number). */
  invalidFormatRow: string;
  /** As invalidFormat, plus {line} (XML line number). */
  invalidFormatLine: string;
  /** {format} is the expected data format. */
  emptyInput: string;
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
    catPdf: "PDF",
    catPdfTools: "PDF tools",
    catDocument: "Documents",
    docDrop: "Drop a Word document (.docx) here, or click to choose",
    runSavePdf: "Save as PDF",
    docPrintHint:
      "Opens your browser's print dialog — choose \u201cSave as PDF\u201d as the destination. Fonts the document uses that aren't on this device are replaced with similar ones.",
    docRendering: "Preparing the preview…",
    docNotDocx: "That isn't a Word .docx document.",
    docLegacyDoc:
      "This is an old Word .doc file, which can't be read in the browser. Open it in Word or Pages, save it as .docx, and try again.",
    docTooLarge: "This document is over {mb} MB — too large to open in the browser.",
    docReadFailed: "Couldn't read this document. It may be damaged or password-protected.",
    docPreviewLabel: "Document preview",
    pdfDropImages: "Drop images here, or click to choose",
    pdfDropPdf: "Drop a PDF here, or click to choose",
    runCreatePdf: "Create PDF",
    runConvert: "Convert to images",
    runMerge: "Merge PDFs",
    runSplit: "Split PDF",
    runRotate: "Rotate PDF",
    runCompress: "Compress PDF",
    working: "Working…",
    resultsTitle: "Result",
    moveUp: "Move up",
    moveDown: "Move down",
    remove: "Remove",
    pageSizeLabel: "Page size",
    pageSizeFit: "Fit to image",
    pageSizeLetter: "Letter",
    orientationLabel: "Orientation",
    orientationAuto: "Auto (per image)",
    orientationPortrait: "Portrait",
    orientationLandscape: "Landscape",
    marginLabel: "Margins",
    marginNone: "None",
    marginSmall: "Small (10 mm)",
    marginLarge: "Large (20 mm)",
    marginCustom: "Custom",
    marginCustomLabel: "Margin (mm)",
    imagesEmpty: "No images yet — add one or more to build your PDF.",
    notAnImage: "\"{name}\" isn't a JPG, PNG, WebP or HEIC image — skipped",
    imageTooLarge: "\"{name}\" is over {mb} MB — skipped",
    tooManyImages: "Up to {max} images per PDF — extra files skipped",
    pdfPasswordRequired: "This PDF is password-protected. Remove the password and try again.",
    pdfInvalid: "This file isn't a valid PDF, or it's corrupted.",
    rangesEmpty: "Enter the page ranges to extract, e.g. 1-3, 5, 8-10",
    rangeUnreadable: "Couldn't read \"{tok}\" — use pages like 1-3, 5, 8-10",
    rangeOutOfRange: "\"{tok}\" is out of range — this PDF has {count} page(s)",
    pageListUnreadable: "Couldn't read \"{tok}\" — use pages like 1-3, 5",
    pageOutOfRange: "Page \"{tok}\" is out of range — this PDF has {count} page(s)",
    marginsTooLarge: "The margins are too large for this page size",
    addAtLeastOneImage: "Add at least one image",
    notSupportedImage: "not a JPG, PNG, WebP or HEIC image",
    fileError: "\"{name}\": {why}",
    addAtLeastTwoPdfs: "Add at least two PDFs to merge",
    splitLabel: "Pages to extract",
    splitPlaceholder: "e.g. 1-3, 5, 8-10",
    rotationLabel: "Rotation",
    rotatePagesLabel: "Pages (optional)",
    rotatePagesPlaceholder: "blank = all, or e.g. 1-3, 5",
    compressQualityHint: "Lower quality = smaller file",
    catAudio: "Audio",
    catVideo: "Video",
    mediaDropAudio: "Drop an audio file, or click to choose",
    mediaDropVideo: "Drop a video file, or click to choose",
    runConvertMedia: "Convert",
    mediaLoading: "Loading the converter — one-time ~32 MB download…",
    mediaConverting: "Converting… video can take a while",
    gifFpsLabel: "Frames per second",
    gifWidthLabel: "Width (px)",
    mediaTooLarge:
      "This file is too large for in-browser conversion (max {mb} MB). Try a shorter or smaller clip.",
    safariVideoNote:
      "Heads up: video conversion is memory-heavy and may fail on Safari for iPhone/iPad. For large files, use a desktop browser like Chrome or Firefox.",
    heicDecodeFailed:
      "Couldn't decode this HEIC. It may use a variant this in-browser tool doesn't support, be corrupted, or be too large. If it's an iPhone photo, try sharing/exporting it as JPEG and converting that.",
    heicNoImage: "No image found in this HEIC file.",
    encodeFailed: "This browser could not encode the image",
    mediaReadFailed: "Couldn't read this file — it may be corrupted.",
    mediaConvertFailed:
      "The conversion failed — the file may be too large or use an unsupported codec.",
    mediaNoOutput:
      "This file couldn't be converted — it may use an unsupported codec or be corrupted.",
    mediaEmptyOutput:
      "The conversion produced an empty file — the input may use an unsupported codec.",
    invalidFormat: "Invalid {format}: {detail}",
    invalidFormatRow: "Invalid {format}: {detail} (row {row})",
    invalidFormatLine: "Invalid {format}: {detail} (line {line})",
    emptyInput: "Nothing to convert — paste or drop some {format}",
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
    catPdf: "PDF",
    catPdfTools: "Herramientas PDF",
    catDocument: "Documentos",
    docDrop: "Suelta un documento Word (.docx), o haz clic para elegir",
    runSavePdf: "Guardar como PDF",
    docPrintHint:
      "Abre el diálogo de imprimir del navegador: elige \u00abGuardar como PDF\u00bb como destino. Las fuentes del documento que no estén en este dispositivo se sustituyen por otras parecidas.",
    docRendering: "Preparando la vista previa…",
    docNotDocx: "Eso no es un documento Word .docx.",
    docLegacyDoc:
      "Es un archivo .doc antiguo de Word, que no se puede leer en el navegador. Ábrelo en Word o Pages, guárdalo como .docx y vuelve a intentarlo.",
    docTooLarge: "Este documento supera los {mb} MB: es demasiado grande para abrirlo en el navegador.",
    docReadFailed: "No se pudo leer este documento. Puede estar dañado o protegido con contraseña.",
    docPreviewLabel: "Vista previa del documento",
    pdfDropImages: "Suelta imágenes aquí, o haz clic para elegir",
    pdfDropPdf: "Suelta un PDF aquí, o haz clic para elegir",
    runCreatePdf: "Crear PDF",
    runConvert: "Convertir a imágenes",
    runMerge: "Unir PDFs",
    runSplit: "Dividir PDF",
    runRotate: "Rotar PDF",
    runCompress: "Comprimir PDF",
    working: "Procesando…",
    resultsTitle: "Resultado",
    moveUp: "Subir",
    moveDown: "Bajar",
    remove: "Quitar",
    pageSizeLabel: "Tamaño de página",
    pageSizeFit: "Ajustar a la imagen",
    pageSizeLetter: "Carta",
    orientationLabel: "Orientación",
    orientationAuto: "Automática (según la imagen)",
    orientationPortrait: "Vertical",
    orientationLandscape: "Horizontal",
    marginLabel: "Márgenes",
    marginNone: "Ninguno",
    marginSmall: "Pequeño (10 mm)",
    marginLarge: "Grande (20 mm)",
    marginCustom: "Personalizado",
    marginCustomLabel: "Margen (mm)",
    imagesEmpty: "Aún no hay imágenes — añade una o varias para crear tu PDF.",
    notAnImage: "«{name}» no es una imagen JPG, PNG, WebP ni HEIC — omitido",
    imageTooLarge: "«{name}» supera los {mb} MB — omitido",
    tooManyImages: "Máximo {max} imágenes por PDF — se omiten las sobrantes",
    pdfPasswordRequired: "Este PDF está protegido con contraseña. Quítala e inténtalo de nuevo.",
    pdfInvalid: "Este archivo no es un PDF válido o está dañado.",
    rangesEmpty: "Indica los rangos de páginas a extraer, p. ej. 1-3, 5, 8-10",
    rangeUnreadable: "No se pudo leer «{tok}» — usa páginas como 1-3, 5, 8-10",
    rangeOutOfRange: "«{tok}» está fuera de rango — este PDF tiene {count} página(s)",
    pageListUnreadable: "No se pudo leer «{tok}» — usa páginas como 1-3, 5",
    pageOutOfRange: "La página «{tok}» está fuera de rango — este PDF tiene {count} página(s)",
    marginsTooLarge: "Los márgenes son demasiado grandes para este tamaño de página",
    addAtLeastOneImage: "Añade al menos una imagen",
    notSupportedImage: "no es una imagen JPG, PNG, WebP ni HEIC",
    fileError: "«{name}»: {why}",
    addAtLeastTwoPdfs: "Añade al menos dos PDFs para unir",
    splitLabel: "Páginas a extraer",
    splitPlaceholder: "p. ej. 1-3, 5, 8-10",
    rotationLabel: "Rotación",
    rotatePagesLabel: "Páginas (opcional)",
    rotatePagesPlaceholder: "vacío = todas, o p. ej. 1-3, 5",
    compressQualityHint: "Menor calidad = archivo más pequeño",
    catAudio: "Audio",
    catVideo: "Vídeo",
    mediaDropAudio: "Suelta un archivo de audio, o haz clic para elegir",
    mediaDropVideo: "Suelta un archivo de vídeo, o haz clic para elegir",
    runConvertMedia: "Convertir",
    mediaLoading: "Cargando el conversor — descarga única de ~32 MB…",
    mediaConverting: "Convirtiendo… el vídeo puede tardar un poco",
    gifFpsLabel: "Fotogramas por segundo",
    gifWidthLabel: "Ancho (px)",
    mediaTooLarge:
      "Este archivo es demasiado grande para convertir en el navegador (máx. {mb} MB). Prueba un clip más corto o pequeño.",
    safariVideoNote:
      "Aviso: la conversión de vídeo consume mucha memoria y puede fallar en Safari de iPhone/iPad. Para archivos grandes, usa un navegador de escritorio como Chrome o Firefox.",
    heicDecodeFailed:
      "No se pudo decodificar este HEIC. Puede usar una variante que esta herramienta del navegador no admite, estar dañado o ser demasiado grande. Si es una foto de iPhone, prueba a compartirla o exportarla como JPEG y convierte ese archivo.",
    heicNoImage: "No se encontró ninguna imagen en este archivo HEIC.",
    encodeFailed: "Este navegador no pudo codificar la imagen",
    mediaReadFailed: "No se pudo leer este archivo — puede estar dañado.",
    mediaConvertFailed:
      "La conversión falló — puede que el archivo sea demasiado grande o use un códec no compatible.",
    mediaNoOutput:
      "No se pudo convertir este archivo — puede que use un códec no compatible o esté dañado.",
    mediaEmptyOutput:
      "La conversión produjo un archivo vacío — puede que el original use un códec no compatible.",
    invalidFormat: "{format} no válido: {detail}",
    invalidFormatRow: "{format} no válido: {detail} (fila {row})",
    invalidFormatLine: "{format} no válido: {detail} (línea {line})",
    emptyInput: "Nada que convertir — pega o suelta contenido en {format}",
  },
};
