// UI strings for the analytics dashboard chrome, shared by the widget markup,
// the controller and the view modules.
//
// Metric names are NOT here — they live on each preset's metric descriptors,
// because "Units" means something different per platform and only the preset
// knows what its own columns are called. These are the labels around them.

import type { Lang } from "./types";

export interface AnalyticsStrings {
  // Landing.
  landingTitle: string;
  landingH1: string;
  landingIntro: string;
  landingNote: string;
  landingDescription: string;
  backToAll: string;
  comingSoon: string;
  // Dropzone.
  dropHint: string;
  browse: string;
  noUploads: string;
  privacyNote: string;
  howToTitle: string;
  // File chips.
  removeFile: string;
  clearAll: string;
  addSecond: string;
  swapPeriods: string;
  periodA: string;
  periodB: string;
  rowsLabel: (n: string) => string;
  // Errors.
  errUnrecognised: (formats: string) => string;
  errEmpty: string;
  errBadCsv: string;
  errMismatch: string;
  errTooMany: string;
  errRead: string;
  // Summary.
  summaryTitle: string;
  weightedNote: string;
  vsPrevious: string;
  mixedCurrency: (codes: string) => string;
  perUnitProceeds: string;
  // Table.
  tableTitle: (entityPlural: string) => string;
  searchPlaceholder: string;
  showing: (shown: string, total: string) => string;
  showMore: string;
  noMatches: string;
  statusNew: string;
  statusLost: string;
  sortBy: string;
  // Scatter.
  scatterTitle: string;
  scatterIntro: string;
  // Position distribution.
  distTitle: string;
  distIntro: string;
  distY: string;
  distX: string;
  // Time series.
  timeTitle: string;
  timeIntro: string;
  timeWeekly: (days: string) => string;
  timeAligned: string;
  // Funnel.
  funnelTitle: string;
  funnelIntro: string;
  funnelDropOff: (pct: string) => string;
  funnelContinued: (pct: string) => string;
  funnelNote: string;
  // Weekday.
  weekdayTitle: string;
  weekdayIntro: string;
  weekdayAverage: (average: string, days: string) => string;
  // Source breakdown.
  sourceTitle: string;
  sourceIntro: string;
  otherSources: string;
  // Chart chrome.
  chartUnavailable: string;
}

const en: AnalyticsStrings = {
  landingTitle: "Analytics Dashboard — Read Your Platform Exports | Yongchivo",
  landingH1: "Analytics Dashboard",
  landingIntro:
    "Upload your platform exports and see what the native dashboards don't show you — 100% in your browser, nothing uploaded.",
  landingNote: "Your files never leave your device",
  landingDescription:
    "Free analytics dashboard for your platform exports. Drop a Google Search Console or App Store Connect CSV and get the views the native dashboards bury — entirely in your browser.",
  backToAll: "All dashboards",
  comingSoon: "Coming soon",

  dropHint: "or click to choose a file",
  browse: "Choose file",
  noUploads: "Nothing is uploaded",
  privacyNote:
    "Everything runs in your browser with JavaScript. Your export is parsed locally and never sent to a server.",
  howToTitle: "Where to get the file",

  removeFile: "Remove",
  clearAll: "Clear all",
  addSecond: "Drop a second export from another date range to compare periods.",
  swapPeriods: "Swap periods",
  periodA: "Before",
  periodB: "After",
  rowsLabel: (n) => `${n} rows`,

  errUnrecognised: (formats) =>
    `That file's header row doesn't match any export this dashboard reads. Expected one of: ${formats}.`,
  errEmpty: "That file parsed fine but had no data rows.",
  errBadCsv: "That file couldn't be read as CSV.",
  errMismatch:
    "Both files have to be the same kind of export — compare like with like, not one format against another.",
  errTooMany: "Two files at a time. Remove one before adding another.",
  errRead: "That file couldn't be read.",

  summaryTitle: "Summary",
  weightedNote:
    "CTR and position are impression-weighted, the same way Search Console averages them.",
  vsPrevious: "vs before",
  mixedCurrency: (codes) =>
    `This export mixes currencies (${codes}). Money totals add them together as-is, so treat them as indicative.`,
  perUnitProceeds:
    "This report lists Developer Proceeds per unit, so revenue is calculated as units × proceeds — Apple's own definition for this export.",

  tableTitle: (entityPlural) => `Top ${entityPlural.toLowerCase()}`,
  searchPlaceholder: "Filter…",
  showing: (shown, total) => `Showing ${shown} of ${total}`,
  showMore: "Show more",
  noMatches: "Nothing matches that filter.",
  statusNew: "new",
  statusLost: "lost",
  sortBy: "Sort by",

  scatterTitle: "CTR vs position",
  scatterIntro:
    "Each dot is one row. High on the left is working. Low on the left is a ranking you're wasting — the title and description aren't earning the click. High on the right is an opportunity: people click it even buried, so it's worth pushing higher.",

  distTitle: "Position distribution",
  distIntro: "How many rows sit in each position band — where your content actually ranks.",
  distY: "Rows",
  distX: "Position range",

  timeTitle: "Downloads & revenue over time",
  timeIntro:
    "Downloads on the left axis, proceeds on the right, each on its own scale so neither flattens the other.",
  timeWeekly: (days) =>
    `This range covers ${days} days, so points are grouped by week to stay readable.`,
  timeAligned:
    "The two periods cover different dates, so the earlier one is aligned to the start of its own range — first point against first point.",

  funnelTitle: "Conversion funnel",
  funnelIntro:
    "Where people fall out between seeing your app and installing it. This is the view App Store Connect makes hardest to read.",
  funnelDropOff: (pct) => `${pct} drop-off`,
  funnelContinued: (pct) => `· ${pct} continued`,
  funnelNote: "Bars are scaled against the first stage, so the narrowing is the real conversion.",

  weekdayTitle: "By day of the week",
  weekdayIntro:
    "Which days actually perform — useful for timing a promotion, a post or a price change.",
  weekdayAverage: (average, days) => `${average} per day, across ${days} of them`,

  sourceTitle: "Where downloads come from",
  sourceIntro: "Share by source — App Store search, browsing, web referrals and app referrals.",
  otherSources: "Other",

  chartUnavailable: "This chart couldn't load, but the figures around it are unaffected.",
};

const es: AnalyticsStrings = {
  landingTitle: "Panel de Analítica — Lee tus Exportaciones | Yongchivo",
  landingH1: "Panel de analítica",
  landingIntro:
    "Sube las exportaciones de tus plataformas y mira lo que los paneles nativos no te enseñan — 100% en tu navegador, sin subir nada.",
  landingNote: "Tus archivos nunca salen de tu dispositivo",
  landingDescription:
    "Panel de analítica gratuito para las exportaciones de tus plataformas. Suelta un CSV de Google Search Console o de App Store Connect y obtén las vistas que los paneles nativos esconden — todo en tu navegador.",
  backToAll: "Todos los paneles",
  comingSoon: "Próximamente",

  dropHint: "o haz clic para elegir un archivo",
  browse: "Elegir archivo",
  noUploads: "No se sube nada",
  privacyNote:
    "Todo se ejecuta en tu navegador con JavaScript. Tu exportación se procesa en local y nunca se envía a un servidor.",
  howToTitle: "Dónde conseguir el archivo",

  removeFile: "Quitar",
  clearAll: "Limpiar todo",
  addSecond: "Suelta una segunda exportación de otro rango de fechas para comparar periodos.",
  swapPeriods: "Intercambiar periodos",
  periodA: "Antes",
  periodB: "Después",
  rowsLabel: (n) => `${n} filas`,

  errUnrecognised: (formats) =>
    `La fila de cabecera de ese archivo no coincide con ninguna exportación que lea este panel. Se esperaba una de: ${formats}.`,
  errEmpty: "El archivo se ha leído bien, pero no tenía filas de datos.",
  errBadCsv: "No se ha podido leer ese archivo como CSV.",
  errMismatch:
    "Los dos archivos tienen que ser el mismo tipo de exportación — compara iguales con iguales, no un formato con otro.",
  errTooMany: "Dos archivos a la vez. Quita uno antes de añadir otro.",
  errRead: "No se ha podido leer ese archivo.",

  summaryTitle: "Resumen",
  weightedNote:
    "El CTR y la posición se ponderan por impresiones, igual que los promedia Search Console.",
  vsPrevious: "frente a antes",
  mixedCurrency: (codes) =>
    `Esta exportación mezcla monedas (${codes}). Los totales las suman tal cual, así que tómalos como orientativos.`,
  perUnitProceeds:
    "Este informe indica los ingresos del desarrollador por unidad, así que los ingresos se calculan como unidades × ingresos — la propia definición de Apple para esta exportación.",

  tableTitle: (entityPlural) => `${entityPlural} principales`,
  searchPlaceholder: "Filtrar…",
  showing: (shown, total) => `Mostrando ${shown} de ${total}`,
  showMore: "Mostrar más",
  noMatches: "Nada coincide con ese filtro.",
  statusNew: "nueva",
  statusLost: "perdida",
  sortBy: "Ordenar por",

  scatterTitle: "CTR frente a posición",
  scatterIntro:
    "Cada punto es una fila. Arriba a la izquierda funciona. Abajo a la izquierda es una posición desaprovechada — el título y la descripción no se están ganando el clic. Arriba a la derecha es una oportunidad: la gente hace clic aunque esté enterrada, así que merece la pena subirla.",

  distTitle: "Distribución de posiciones",
  distIntro:
    "Cuántas filas caen en cada franja de posición — dónde posiciona de verdad tu contenido.",
  distY: "Filas",
  distX: "Rango de posición",

  timeTitle: "Descargas e ingresos en el tiempo",
  timeIntro:
    "Descargas en el eje izquierdo, ingresos en el derecho, cada uno con su escala para que ninguno aplaste al otro.",
  timeWeekly: (days) =>
    `Este rango abarca ${days} días, así que los puntos se agrupan por semana para que se lean bien.`,
  timeAligned:
    "Los dos periodos cubren fechas distintas, así que el anterior se alinea al principio de su propio rango — primer punto contra primer punto.",

  funnelTitle: "Embudo de conversión",
  funnelIntro:
    "Dónde se pierde la gente entre ver tu app e instalarla. Esta es la vista que App Store Connect hace más difícil de leer.",
  funnelDropOff: (pct) => `${pct} de abandono`,
  funnelContinued: (pct) => `· ${pct} continuó`,
  funnelNote:
    "Las barras se escalan respecto a la primera etapa, así que el estrechamiento es la conversión real.",

  weekdayTitle: "Por día de la semana",
  weekdayIntro:
    "Qué días funcionan de verdad — útil para elegir cuándo lanzar una promoción, una publicación o un cambio de precio.",
  weekdayAverage: (average, days) => `${average} al día, sobre ${days} de ellos`,

  sourceTitle: "De dónde vienen las descargas",
  sourceIntro:
    "Reparto por origen — búsqueda en la App Store, navegación, referencias web y referencias de apps.",
  otherSources: "Otros",

  chartUnavailable: "Este gráfico no ha podido cargarse, pero las cifras de alrededor no se ven afectadas.",
};

export const strings: Record<Lang, AnalyticsStrings> = { en, es };
