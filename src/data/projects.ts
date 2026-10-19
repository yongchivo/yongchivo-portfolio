// Every project, in one place, in both languages.
//
// Drives the /projects list (cards + the featured project) AND the per-project
// detail pages at /projects/<slug> and /es/projects/<slug>. Projects that have
// their own hand-built page (UNO, PHV Prep UK) set `detailHref` instead of
// `body`, and don't get a generated page.
//
// ORDER: newest first. The first entry is featured at the top of /projects.
//
// Copy here only restates what's already published elsewhere on the site
// (the old projects page, src/data/cv.ts and the blog posts linked below).

export type SiteLang = "en" | "es";
type Localized<T> = Record<SiteLang, T>;

export type ProjectSection = "security" | "mobile" | "games";
export type ProjectStatus = "live" | "oss" | "coursework";

export interface ProjectLink {
  href: Localized<string>;
  label: Localized<string>;
  /** Opens another site (GitHub, tools.yongchivo.com) in a new tab. */
  external?: boolean;
}

export interface Project {
  slug: string;
  section: ProjectSection;
  status: ProjectStatus;
  /** Path under public/. */
  cover: string;
  title: Localized<string>;
  /** One or two sentences for the card. */
  summary: Localized<string>;
  /** Stack / context line under the title. */
  meta?: Localized<string>;
  /** Hand-built detail page; when set, no page is generated from `body`. */
  detailHref?: Localized<string>;
  /** Paragraphs for the generated detail page. */
  body?: Localized<string[]>;
  /** Optional titled bullet lists under the paragraphs. */
  highlights?: Localized<{ heading: string; items: string[] }[]>;
  /** Main button on the detail page (GitHub or the live site). */
  primary?: ProjectLink;
  /** Extra buttons, e.g. the blog post about the project. */
  secondary?: ProjectLink[];
}

const same = (href: string): Localized<string> => ({ en: href, es: href });
const github = (repo: string): ProjectLink => ({
  href: same(`https://github.com/yongchivo/${repo}`),
  label: { en: "View on GitHub", es: "Ver en GitHub" },
  external: true,
});
const post = (slug: string): ProjectLink => ({
  href: same(`/blog/${slug}/`),
  label: { en: "Read the write-up", es: "Leer el artículo (en inglés)" },
});

export const projects: Project[] = [
  {
    slug: "uno",
    section: "security",
    status: "oss",
    cover: "/uno-cover.webp",
    title: { en: "UNO — Secure AI Agent Orchestrator", es: "UNO — Orquestador seguro de agentes de IA" },
    summary: {
      en: "Coordinates several Claude Code agents on one project, treating every agent as an untrusted worker: isolated worktrees, least privilege and a deterministic gate that holds risky changes for my review.",
      es: "Coordina varios agentes de Claude Code en un mismo proyecto y trata a cada uno como un trabajador no confiable: worktrees aislados, mínimo privilegio y una compuerta determinista que retiene los cambios de riesgo para que yo los revise.",
    },
    meta: {
      en: "Python · Claude Code · Git · Application security",
      es: "Python · Claude Code · Git · Seguridad de aplicaciones",
    },
    detailHref: { en: "/projects/uno", es: "/es/projects/uno" },
  },
  {
    slug: "portfolio",
    section: "security",
    status: "live",
    cover: "/portfolio.webp",
    title: { en: "Personal Portfolio with Security Hardening", es: "Portfolio personal con hardening de seguridad" },
    summary: {
      en: "The site you are reading right now. Built with Astro, Tailwind and Cloudflare Pages, with continuous deployment from GitHub. Hardened HTTP security headers from grade D to A on securityheaders.com.",
      es: "La web que estás leyendo. Hecha con Astro, Tailwind y Cloudflare Pages, con despliegue continuo desde GitHub. Subí sus cabeceras de seguridad HTTP de una D a una A en securityheaders.com.",
    },
    meta: { en: "Astro · Tailwind CSS · Cloudflare Pages", es: "Astro · Tailwind CSS · Cloudflare Pages" },
    body: {
      en: [
        "The site you are reading right now. Built with Astro and Tailwind, deployed on Cloudflare Pages with continuous deployment from GitHub, in English and Spanish.",
        "When I first deployed it, securityheaders.com graded it D: only Referrer-Policy and X-Content-Type-Options were present, both set automatically by Cloudflare. I added the missing headers with a _headers file that Cloudflare Pages reads on every deploy — no dashboards, no clicks — and the site now scores A.",
      ],
      es: [
        "La web que estás leyendo. Hecha con Astro y Tailwind, desplegada en Cloudflare Pages con despliegue continuo desde GitHub, en inglés y en español.",
        "La primera vez que la desplegué, securityheaders.com le puso una D: solo tenía Referrer-Policy y X-Content-Type-Options, y las dos las ponía Cloudflare automáticamente. Añadí las cabeceras que faltaban con un archivo _headers que Cloudflare Pages lee en cada despliegue —sin paneles ni clics— y ahora la web saca una A.",
      ],
    },
    highlights: {
      en: [
        {
          heading: "What each header defends against",
          items: [
            "Strict-Transport-Security: HTTPS only, for a year, subdomains included — blocks downgrade attacks on the first plain-HTTP request.",
            "X-Frame-Options: DENY — nobody can load the site in an iframe, which shuts down clickjacking.",
            "X-Content-Type-Options: nosniff — the browser trusts the declared content type instead of guessing.",
            "Permissions-Policy — camera, microphone, geolocation, payment and USB switched off.",
            "Content-Security-Policy — scripts, styles and connections limited to the site itself and a short allow-list.",
          ],
        },
      ],
      es: [
        {
          heading: "De qué protege cada cabecera",
          items: [
            "Strict-Transport-Security: solo HTTPS, durante un año y también en los subdominios; bloquea los ataques de downgrade en la primera petición por HTTP.",
            "X-Frame-Options: DENY — nadie puede cargar la web dentro de un iframe, lo que corta el clickjacking.",
            "X-Content-Type-Options: nosniff — el navegador se fía del tipo de contenido declarado en lugar de adivinarlo.",
            "Permissions-Policy — cámara, micrófono, geolocalización, pagos y USB desactivados.",
            "Content-Security-Policy — scripts, estilos y conexiones limitados a la propia web y a una lista corta de excepciones.",
          ],
        },
      ],
    },
    primary: github("yongchivo-portfolio"),
    secondary: [post("from-d-to-a-securityheaders")],
  },
  {
    slug: "yongchivo-tools",
    section: "security",
    status: "live",
    cover: "/tools-cover.webp",
    title: { en: "Yongchivo Tools", es: "Yongchivo Tools" },
    summary: {
      en: "A hub of free, bilingual (EN/ES) cybersecurity micro-tools at tools.yongchivo.com — password, subnet, EXIF and PDF-metadata utilities that run in the browser, plus a Security Headers Checker and a Breach Checker on Cloudflare Workers.",
      es: "Un hub de micro-herramientas de ciberseguridad gratuitas y bilingües en tools.yongchivo.com: contraseñas, subredes, EXIF y metadatos de PDF en el navegador, más un verificador de cabeceras de seguridad y un comprobador de filtraciones en Cloudflare Workers.",
    },
    meta: { en: "Astro · Tailwind · Cloudflare Workers", es: "Astro · Tailwind · Cloudflare Workers" },
    body: {
      en: [
        "A hub of free cybersecurity micro-tools at tools.yongchivo.com, in English and Spanish (mirrored under /es/), built on Astro and Tailwind on Cloudflare Workers.",
        "Most of the tools run entirely in your browser, so nothing you type leaves your device. Two are the honest exception: the Security Headers Checker has to request the site you're checking, and the Breach Checker queries the XposedOrNot breach database. In both cases nothing is logged or stored — the data only exists in memory for that one request.",
      ],
      es: [
        "Un hub de micro-herramientas de ciberseguridad gratuitas en tools.yongchivo.com, en inglés y en español (en /es/), hecho con Astro y Tailwind sobre Cloudflare Workers.",
        "La mayoría de las herramientas funcionan por completo en tu navegador, así que nada de lo que escribes sale de tu dispositivo. Hay dos excepciones, y prefiero decirlo claro: el verificador de cabeceras tiene que hacer una petición a la web que compruebas, y el comprobador de filtraciones consulta la base de datos de XposedOrNot. En los dos casos no se registra ni se guarda nada: los datos solo existen en memoria durante esa petición.",
      ],
    },
    highlights: {
      en: [
        {
          heading: "Security work behind it",
          items: [
            "SSRF protection in the Security Headers Checker: private IP ranges, localhost, the cloud metadata address, non-HTTP schemes, embedded credentials and non-standard ports are blocked — and every redirect hop is re-validated.",
            "A real secret-management incident: an API key ended up saved as the name of a Cloudflare secret instead of its value. It was caught, rotated immediately and redone properly.",
            "The site graded itself: the first run of the headers checker against tools.yongchivo.com came back F. Fixed the same day with a _headers file — it now scores A.",
          ],
        },
      ],
      es: [
        {
          heading: "El trabajo de seguridad que hay detrás",
          items: [
            "Protección frente a SSRF en el verificador de cabeceras: se bloquean rangos de IP privados, localhost, la dirección de metadatos de la nube, esquemas que no son HTTP, credenciales en la URL y puertos no estándar, y se vuelve a validar cada salto de redirección.",
            "Un incidente real de gestión de secretos: una clave de API acabó guardada como el nombre de un secreto de Cloudflare en vez de como su valor. Se detectó, se rotó al momento y se rehízo bien.",
            "La web se evaluó a sí misma: la primera vez que pasé el verificador de cabeceras por tools.yongchivo.com salió una F. Lo arreglé ese mismo día con un archivo _headers y ahora saca una A.",
          ],
        },
      ],
    },
    primary: {
      href: { en: "https://tools.yongchivo.com", es: "https://tools.yongchivo.com/es" },
      label: { en: "Open Yongchivo Tools", es: "Abrir Yongchivo Tools" },
      external: true,
    },
    secondary: [post("yongchivo-tools-launch")],
  },
  {
    slug: "file-converter",
    section: "security",
    status: "live",
    cover: "/convert-cover.webp",
    title: { en: "File Converter — Private, In-Browser", es: "Conversor de archivos — Privado, en el navegador" },
    summary: {
      en: "Convert images (PNG, JPG, WebP, HEIC) and data formats (CSV, JSON, YAML, XML) entirely in your browser — nothing is ever uploaded. Bilingual (EN/ES), with a dedicated page per conversion.",
      es: "Convierte imágenes (PNG, JPG, WebP, HEIC) y formatos de datos (CSV, JSON, YAML, XML) por completo en tu navegador: nunca se sube nada. Bilingüe (EN/ES), con una página propia para cada conversión.",
    },
    meta: { en: "JavaScript · WebAssembly · Astro", es: "JavaScript · WebAssembly · Astro" },
    body: {
      en: [
        "A file converter where every conversion runs in your browser with WebAssembly. The file you pick never leaves your device: there's no upload, no server-side processing and nothing to log — because there's no server to upload to.",
        "Each conversion has its own page (/convert/png-to-jpg, /convert/heic-to-jpg…), in English and Spanish, and most pairs work in both directions.",
      ],
      es: [
        "Un conversor de archivos en el que cada conversión se hace en tu navegador con WebAssembly. El archivo que eliges nunca sale de tu dispositivo: no hay subida, ni procesamiento en un servidor, ni nada que registrar, porque no hay ningún servidor al que subirlo.",
        "Cada conversión tiene su propia página (/convert/png-to-jpg, /convert/heic-to-jpg…), en inglés y en español, y la mayoría de pares funcionan en los dos sentidos.",
      ],
    },
    highlights: {
      en: [
        {
          heading: "What it converts",
          items: [
            "Images — PNG, JPG and WebP in every direction, plus HEIC (decode-only, on purpose).",
            "Data — CSV, JSON, YAML and XML between each other.",
            "PDF — images to PDF and PDF to images, plus merge, split, rotate and compress.",
            "Audio and video — MP3, WAV, M4A, FLAC, OGG, MOV, MP4, WebM and GIF.",
          ],
        },
        {
          heading: "Decisions worth mentioning",
          items: [
            "HEIC with libheif-js instead of heic2any: heic2any needs 'unsafe-eval' in the CSP; libheif-js only needs 'wasm-unsafe-eval', so the strict policy stays intact. Its ~1.4 MB decoder only loads on the HEIC pages.",
            "PDF tools are their own kind of operation (many files in, one out) instead of being forced into the from → to model.",
            "Audio and video use single-threaded FFmpeg.wasm; its ~32 MB core is served from my own storage and only downloads the first time you convert audio or video.",
          ],
        },
      ],
      es: [
        {
          heading: "Qué convierte",
          items: [
            "Imágenes — PNG, JPG y WebP en todas las direcciones, más HEIC (solo lectura, a propósito).",
            "Datos — CSV, JSON, YAML y XML entre sí.",
            "PDF — de imágenes a PDF y de PDF a imágenes, además de unir, dividir, rotar y comprimir.",
            "Audio y vídeo — MP3, WAV, M4A, FLAC, OGG, MOV, MP4, WebM y GIF.",
          ],
        },
        {
          heading: "Decisiones que merece la pena contar",
          items: [
            "HEIC con libheif-js en lugar de heic2any: heic2any necesita 'unsafe-eval' en la CSP; libheif-js solo necesita 'wasm-unsafe-eval', así que la política estricta sigue intacta. Su decodificador de ~1,4 MB solo se carga en las páginas de HEIC.",
            "Las herramientas de PDF son un tipo de operación propio (muchos archivos entran, uno sale) en lugar de forzarlas en el modelo origen → destino.",
            "El audio y el vídeo usan FFmpeg.wasm de un solo hilo; su núcleo de ~32 MB se sirve desde mi propio almacenamiento y solo se descarga la primera vez que conviertes audio o vídeo.",
          ],
        },
      ],
    },
    primary: {
      href: { en: "/convert/", es: "/es/convert/" },
      label: { en: "Open the converter", es: "Abrir el conversor" },
    },
    secondary: [post("building-a-browser-file-converter")],
  },
  {
    slug: "analytics-dashboard",
    section: "security",
    status: "live",
    cover: "/analytics-cover.webp",
    title: { en: "Analytics Dashboard", es: "Panel de analítica" },
    summary: {
      en: "Drop in your Google Search Console, App Store Connect or Google Play Console CSV exports and see what their own dashboards don't show: CTR against position, conversion funnels and side-by-side date ranges. Runs entirely in the browser.",
      es: "Suelta tus exportaciones CSV de Google Search Console, App Store Connect o Google Play Console y mira lo que sus propios paneles no enseñan: CTR frente a posición, embudos de conversión y periodos lado a lado. Todo en el navegador.",
    },
    meta: { en: "TypeScript · Chart.js · Astro", es: "TypeScript · Chart.js · Astro" },
    body: {
      en: [
        "Upload your platform exports and see what the native dashboards don't show you — 100% in your browser, nothing uploaded. Your files never leave your device.",
      ],
      es: [
        "Sube las exportaciones de tus plataformas y mira lo que los paneles nativos no te enseñan: 100% en tu navegador, sin subir nada. Tus archivos nunca salen de tu dispositivo.",
      ],
    },
    highlights: {
      en: [
        {
          heading: "Dashboards",
          items: [
            "Google Search Console — a Queries or Pages export: summary totals, a sortable table, a CTR-vs-position scatter and a ranking distribution, plus two-file comparison.",
            "App Store Connect — a Sales and Trends or App Analytics export: downloads and proceeds over time, the conversion funnel, day-of-week performance and source breakdown.",
            "Google Play Console — an Installs, Store performance or Earnings report: installs and uninstalls over time, the store listing funnel, net earnings and day-of-week performance.",
          ],
        },
      ],
      es: [
        {
          heading: "Paneles",
          items: [
            "Google Search Console — una exportación de Consultas o Páginas: totales, tabla ordenable, dispersión CTR-posición y distribución de posiciones, más comparación de dos archivos.",
            "App Store Connect — una exportación de Ventas y tendencias o de Analíticas: descargas e ingresos en el tiempo, embudo de conversión, rendimiento por día de la semana y reparto por origen.",
            "Google Play Console — un informe de Instalaciones, Rendimiento de la ficha o Ingresos: instalaciones y desinstalaciones en el tiempo, embudo de la ficha, ingresos netos y rendimiento por día de la semana.",
          ],
        },
      ],
    },
    primary: {
      href: { en: "/analytics/", es: "/es/analytics/" },
      label: { en: "Open the dashboard", es: "Abrir el panel" },
    },
  },
  {
    slug: "phv-prep-uk",
    section: "mobile",
    status: "live",
    cover: "/phv-prep-uk.webp",
    title: { en: "PHV Prep UK — Taxi Badge Exam Prep App", es: "PHV Prep UK — App para el examen de taxi" },
    summary: {
      en: "Exam prep for West Midlands private hire (\"taxi badge\") licensing tests, on iOS and Android: 2,000+ practice questions, timed mock exams and an AI tutor for UK taxi law.",
      es: "Preparación para los exámenes de licencia de private hire («taxi badge») de West Midlands, en iOS y Android: más de 2.000 preguntas, simulacros cronometrados y un tutor de IA de la normativa del taxi en Reino Unido.",
    },
    meta: { en: "Flutter · Dart · Firebase", es: "Flutter · Dart · Firebase" },
    // English-only page; the Spanish site links to it too.
    detailHref: same("/phv-prep-uk"),
  },
  {
    slug: "mylocation",
    section: "mobile",
    status: "coursework",
    cover: "/mylocation.webp",
    title: { en: "MyLocation — Android App", es: "MyLocation — App Android" },
    summary: {
      en: "A location-aware Android app backed by Google Firebase, with user authentication and real-time data storage to sync locations and events across devices.",
      es: "Una app Android basada en la ubicación, con Google Firebase como backend: autenticación de usuarios y almacenamiento en tiempo real para sincronizar ubicaciones y eventos entre dispositivos.",
    },
    meta: {
      en: "Android · Java / Kotlin · Firebase — University of Worcester",
      es: "Android · Java / Kotlin · Firebase — University of Worcester",
    },
    body: {
      en: [
        "A location-aware Android app backed by Google Firebase, with user authentication and real-time data storage to sync locations and events across devices.",
        "Built in Java and Kotlin as part of the Mobile Application Development module at the University of Worcester.",
      ],
      es: [
        "Una app Android basada en la ubicación, con Google Firebase como backend: autenticación de usuarios y almacenamiento en tiempo real para sincronizar ubicaciones y eventos entre dispositivos.",
        "Hecha en Java y Kotlin para el módulo de Mobile Application Development de la University of Worcester.",
      ],
    },
    primary: github("MyLocation"),
  },
  {
    slug: "blackdoghunter",
    section: "games",
    status: "coursework",
    cover: "/blackdoghunter.webp",
    title: { en: "BlackDogHunter — 2D Game", es: "BlackDogHunter — Videojuego 2D" },
    summary: {
      en: "A complete 2D game built in Unity with C#, covering game mechanics, sprite animation, scene management and level design.",
      es: "Un videojuego 2D completo hecho en Unity con C#: mecánicas, animación de sprites, gestión de escenas y diseño de niveles.",
    },
    meta: { en: "Unity · C# — University of Worcester", es: "Unity · C# — University of Worcester" },
    body: {
      en: [
        "A complete 2D game built in Unity with C#, covering game mechanics, sprite animation, scene management and level design.",
        "Originally developed as a group academic project where the deliverable was a team report — the codebase itself was built from scratch by me.",
      ],
      es: [
        "Un videojuego 2D completo hecho en Unity con C#: mecánicas, animación de sprites, gestión de escenas y diseño de niveles.",
        "Empezó como un proyecto académico en grupo cuyo entregable era un informe de equipo; el código lo escribí yo desde cero.",
      ],
    },
    primary: github("Assignment_Platform_Game"),
  },
  {
    slug: "kiosk-os",
    section: "games",
    status: "coursework",
    cover: "/kiosk-os.webp",
    title: { en: "University Kiosk Operating System", es: "Sistema operativo de quiosco universitario" },
    summary: {
      en: "A locked-down kiosk OS based on Ubuntu, with auto-login, a restricted user environment and start-up scripts for a reliable single-purpose public terminal.",
      es: "Un sistema de quiosco bloqueado basado en Ubuntu, con inicio de sesión automático, entorno de usuario restringido y scripts de arranque para un terminal público fiable y de un solo uso.",
    },
    meta: { en: "Linux · Ubuntu — University of Worcester", es: "Linux · Ubuntu — University of Worcester" },
    body: {
      en: [
        "A locked-down kiosk OS based on Ubuntu, with auto-login, a restricted user environment and start-up scripts to deliver a reliable single-purpose public terminal.",
        "Built as part of the Operating Systems module to explore Linux administration, security policies and system hardening.",
      ],
      es: [
        "Un sistema de quiosco bloqueado basado en Ubuntu, con inicio de sesión automático, un entorno de usuario restringido y scripts de arranque para ofrecer un terminal público fiable y de un solo uso.",
        "Hecho para el módulo de Operating Systems, para practicar administración de Linux, políticas de seguridad y hardening del sistema.",
      ],
    },
    primary: github("UW_kiosk_setup"),
  },
];

/** Where a project's card links to: its own page, or the generated one. */
export function projectHref(project: Project, lang: SiteLang): string {
  if (project.detailHref) return project.detailHref[lang];
  return lang === "es" ? `/es/projects/${project.slug}` : `/projects/${project.slug}`;
}

/** Projects that get a generated detail page. */
export const generatedProjects = (): Project[] => projects.filter((p) => !p.detailHref && p.body);

export const statusLabel: Record<ProjectStatus, Localized<string>> = {
  live: { en: "Live", es: "En línea" },
  oss: { en: "Open source", es: "Código abierto" },
  coursework: { en: "Coursework", es: "Trabajo de clase" },
};

export const sectionInfo: Record<ProjectSection, { tone: "cyan" | "magenta" | "purple"; title: Localized<string>; short: Localized<string> }> = {
  security: {
    tone: "cyan",
    title: { en: "Cyber Security & Forensics", es: "Ciberseguridad e informática forense" },
    short: { en: "Security", es: "Seguridad" },
  },
  mobile: {
    tone: "magenta",
    title: { en: "Mobile & Web Development", es: "Desarrollo móvil y web" },
    short: { en: "Mobile & Web", es: "Móvil y web" },
  },
  games: {
    tone: "purple",
    title: { en: "Game Development & Systems", es: "Videojuegos y sistemas" },
    short: { en: "Games & Systems", es: "Juegos y sistemas" },
  },
};
