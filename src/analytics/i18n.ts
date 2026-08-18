// UI strings for the analytics dashboard, shared by the widget markup and the
// browser-side controller. Per-preset SEO copy lives in ./presets/*.ts; these
// are the labels for the dashboard chrome.

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
  open: string;
  // Dropzone.
  dropHint: string;
  browse: string;
  noUploads: string;
  privacyNote: string;
  howToTitle: string;
  // File chips.
  loadedTitle: string;
  removeFile: string;
  clearAll: string;
  addSecond: string;
  swapPeriods: string;
  periodA: string;
  periodB: string;
  rowsLabel: (n: string) => string;
  // Errors.
  errUnrecognised: string;
  errEmpty: string;
  errBadCsv: string;
  errMismatch: string;
  errTooMany: string;
  errRead: string;
  // View 1 — summary.
  summaryTitle: string;
  totalClicks: string;
  totalImpressions: string;
  avgCtr: string;
  avgPosition: string;
  weightedNote: string;
  vsPrevious: string;
  // View 2 — table.
  tableTitle: (entityPlural: string) => string;
  searchPlaceholder: string;
  showing: (shown: string, total: string) => string;
  showMore: string;
  noMatches: string;
  statusNew: string;
  statusLost: string;
  sortBy: string;
  // View 3 — scatter.
  scatterTitle: string;
  scatterIntro: string;
  scatterX: string;
  scatterY: string;
  // View 4 — distribution.
  distTitle: string;
  distIntro: string;
  distY: string;
  distX: string;
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
    "Free analytics dashboard for your platform exports. Drop a Google Search Console CSV and get CTR-vs-position outliers, ranking distribution and period comparison — entirely in your browser.",
  backToAll: "All dashboards",
  comingSoon: "Coming soon",
  open: "Open",

  dropHint: "or click to choose a file — CSV only",
  browse: "Choose file",
  noUploads: "Nothing is uploaded",
  privacyNote:
    "Everything runs in your browser with JavaScript. Your export is parsed locally and never sent to a server.",
  howToTitle: "Where to get the file",

  loadedTitle: "Loaded",
  removeFile: "Remove",
  clearAll: "Clear all",
  addSecond: "Drop a second export from another date range to compare periods.",
  swapPeriods: "Swap periods",
  periodA: "Before",
  periodB: "After",
  rowsLabel: (n) => `${n} rows`,

  errUnrecognised:
    "That doesn't look like a Search Console Queries or Pages export. The header row needs a “Top queries” or “Top pages” column alongside Clicks and Impressions.",
  errEmpty: "That CSV parsed fine but had no data rows.",
  errBadCsv: "That file couldn't be read as CSV.",
  errMismatch:
    "Both files have to be the same kind of export — compare Queries with Queries, or Pages with Pages.",
  errTooMany: "Two files at a time. Remove one before adding another.",
  errRead: "That file couldn't be read.",

  summaryTitle: "Summary",
  totalClicks: "Total clicks",
  totalImpressions: "Total impressions",
  avgCtr: "Average CTR",
  avgPosition: "Average position",
  weightedNote: "CTR and position are impression-weighted, the same way Search Console averages them.",
  vsPrevious: "vs before",

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
    "Each dot is one row. High on the left is working. Low on the left is a ranking you're wasting — the title and description aren't earning the click. High on the right is an opportunity: people click it even buried, so it's worth pushing up.",
  scatterX: "Average position",
  scatterY: "CTR (%)",

  distTitle: "Position distribution",
  distIntro: "How many rows sit in each position band — where your content actually ranks.",
  distY: "Rows",
  distX: "Position range",

  chartUnavailable: "Charts couldn't load, but the table above has the same data.",
};

const es: AnalyticsStrings = {
  landingTitle: "Panel de Analítica — Lee tus Exportaciones | Yongchivo",
  landingH1: "Panel de analítica",
  landingIntro:
    "Sube las exportaciones de tus plataformas y mira lo que los paneles nativos no te enseñan — 100% en tu navegador, sin subir nada.",
  landingNote: "Tus archivos nunca salen de tu dispositivo",
  landingDescription:
    "Panel de analítica gratuito para las exportaciones de tus plataformas. Suelta un CSV de Google Search Console y obtén CTR frente a posición, distribución de posiciones y comparación entre periodos — todo en tu navegador.",
  backToAll: "Todos los paneles",
  comingSoon: "Próximamente",
  open: "Abrir",

  dropHint: "o haz clic para elegir un archivo — solo CSV",
  browse: "Elegir archivo",
  noUploads: "No se sube nada",
  privacyNote:
    "Todo se ejecuta en tu navegador con JavaScript. Tu exportación se procesa en local y nunca se envía a un servidor.",
  howToTitle: "Dónde conseguir el archivo",

  loadedTitle: "Cargado",
  removeFile: "Quitar",
  clearAll: "Limpiar todo",
  addSecond: "Suelta una segunda exportación de otro rango de fechas para comparar periodos.",
  swapPeriods: "Intercambiar periodos",
  periodA: "Antes",
  periodB: "Después",
  rowsLabel: (n) => `${n} filas`,

  errUnrecognised:
    "Esto no parece una exportación de Consultas o Páginas de Search Console. La fila de cabecera necesita una columna “Consultas principales” o “Páginas principales” junto a Clics e Impresiones.",
  errEmpty: "El CSV se ha leído bien, pero no tenía filas de datos.",
  errBadCsv: "No se ha podido leer ese archivo como CSV.",
  errMismatch:
    "Los dos archivos tienen que ser el mismo tipo de exportación — compara Consultas con Consultas, o Páginas con Páginas.",
  errTooMany: "Dos archivos a la vez. Quita uno antes de añadir otro.",
  errRead: "No se ha podido leer ese archivo.",

  summaryTitle: "Resumen",
  totalClicks: "Clics totales",
  totalImpressions: "Impresiones totales",
  avgCtr: "CTR medio",
  avgPosition: "Posición media",
  weightedNote:
    "El CTR y la posición se ponderan por impresiones, igual que los promedia Search Console.",
  vsPrevious: "frente a antes",

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
  scatterX: "Posición media",
  scatterY: "CTR (%)",

  distTitle: "Distribución de posiciones",
  distIntro:
    "Cuántas filas caen en cada franja de posición — dónde posiciona de verdad tu contenido.",
  distY: "Filas",
  distX: "Rango de posición",

  chartUnavailable: "Los gráficos no han podido cargarse, pero la tabla de arriba tiene los mismos datos.",
};

export const strings: Record<Lang, AnalyticsStrings> = { en, es };
