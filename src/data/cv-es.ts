// Spanish version of the CV content, for /es/cv.
//
// Mirrors src/data/cv.ts entry by entry. That file stays the single source for
// the English page AND the PDF (scripts/generate-cv-pdf.mjs, English only), so
// when you change something there, update the matching entry here too.

import type { CvEntry, CvSkillGroup } from "./cv";

export const profile =
  "Estudiante de 2.º curso del BSc (Hons) en Ciberseguridad en la University of Worcester (graduación en 2027) que lleva software a producción. He diseñado, desarrollado y publicado PHV Prep UK, una app de pago de preparación de exámenes para iOS y Android hecha en solitario con Flutter y Firebase, con verificación de compras en el servidor y las claves de API fuera del cliente, junto con un hub de seis herramientas de ciberseguridad en el navegador que funcionan sobre Cloudflare Workers. Experiencia práctica en informática forense, diseño seguro de aplicaciones, desarrollo móvil y web, y entornos Linux a medida. Bilingüe en español e inglés. Titular de la licencia SIA Door Supervisor, del certificado de Emergency First Aid at Work y del carné de conducir británico. Cuatro años de hostelería de cara al público me han dado buenas dotes de comunicación, fiabilidad y capacidad para mantener la calma bajo presión, tanto trabajando por mi cuenta como en equipos con mucho ritmo.";

export const education: CvEntry[] = [
  {
    title: "BSc (Hons) Cyber Security (Single Honours)",
    subtitle: "Sept. 2024 – jun. 2027 (prevista), University of Worcester, Worcester, Reino Unido",
    body: "2.º curso, media de notable (B). Módulos como Digital Forensics, Mobile Application Development, Web Technologies y fundamentos de redes y seguridad. Los trabajos se centran en técnicas prácticas de investigación, diseño seguro y desarrollo de aplicaciones modernas.",
  },
  {
    title: "BTEC Level 3 National Extended Diploma in Information Technology",
    subtitle: "2022 – 2024, Sandwell College, Central Campus, Birmingham, Reino Unido",
    body: "Nota global: MMP. Merit en IT Systems, Creating Systems to Manage Information, Mobile Apps Development, Software Testing, Programming, Using Social Media in Business e IT Project Management. Pass en Cyber Security and Incident Management, IT Service Delivery, Website Development, IT Technical Support, Computer Games Development y Digital Animation.",
  },
];

export const projects: CvEntry[] = [
  {
    title: "PHV Prep UK — App de preparación del examen de taxi",
    subtitle:
      "Flutter / Dart / Firebase / Anthropic API - Proyecto en solitario, publicado en App Store y Google Play",
    body: "Diseñé, desarrollé y publiqué una app de pago para preparar los exámenes de licencia de vehículo de alquiler privado («taxi badge») de West Midlands (Wolverhampton, Birmingham, Solihull, Coventry, Tamworth, Sandwell, Dudley y Walsall), con más de 2.000 preguntas de práctica, simulacros cronometrados que replican la lógica de aprobado del examen real y un tutor de IA sobre la normativa del taxi en Reino Unido. Hecha en solitario con Flutter y Firebase (Auth, Firestore, Cloud Functions, europe-west2). Con la seguridad presente en todo momento: verificación de compras de StoreKit 2 en el servidor, la clave de la API de Anthropic guardada en Secret Manager y nunca incluida en el cliente, reglas de Firestore que dejan el estado premium en manos del backend y controles de seguridad del contenido en la función de IA. La versión de Android está en pruebas cerradas de Google Play, con lanzamiento previsto el 18 de agosto de 2026.",
  },
  {
    title: "Yongchivo Tools — Micro-herramientas de ciberseguridad",
    subtitle: "Astro / Tailwind / Cloudflare Workers - tools.yongchivo.com",
    body: "Desarrollé y lancé un hub de seis herramientas de ciberseguridad gratuitas y bilingües (inglés/español). Cuatro funcionan por completo en el cliente —generador de contraseñas, analizador de fortaleza de contraseñas, calculadora de subredes y un test de perfiles cyber— y dos se apoyan en Cloudflare Workers: un verificador de cabeceras de seguridad con validación de URL estricta y segura frente a SSRF, y un comprobador de filtraciones basado en la API de XposedOrNot. Desplegado con builds automáticos desde GitHub y con sus propias cabeceras de seguridad de nota A.",
  },
  {
    title: "Conversor de archivos — Privado, en el navegador",
    subtitle: "JavaScript / WebAssembly / Astro - yongchivo.com/convert",
    body: "Desarrollé un conversor de archivos centrado en la privacidad que funciona por completo en el navegador, así que nunca se sube ningún archivo. Convierte imágenes (PNG, JPG, WebP y HEIC mediante la versión WebAssembly de libheif) y formatos de datos (CSV, JSON, YAML, XML) en todas las direcciones, con arrastrar y soltar, conversión por lotes y un manejo cuidadoso de las entradas mal formadas. Bilingüe (EN/ES) sobre un único motor de conversión reutilizable.",
  },
];

export const academicProjects: CvEntry[] = [
  {
    title: "BlackDogHunter — Videojuego 2D",
    subtitle: "Unity / C# - Proyecto académico, University of Worcester",
    body: "Diseñé y desarrollé un videojuego 2D completo en Unity con C#: mecánicas, animación de sprites, gestión de escenas y diseño de niveles.",
  },
  {
    title: "Sistema operativo de quiosco universitario",
    subtitle: "Linux / Ubuntu - Proyecto académico, University of Worcester",
    body: "Construí un sistema de quiosco bloqueado basado en Ubuntu, configurando el inicio de sesión automático, un entorno de usuario restringido y scripts de arranque para ofrecer un terminal público fiable y de un solo uso.",
  },
  {
    title: "MyLocation — Aplicación móvil",
    subtitle: "Android / Java / Kotlin / Firebase - Proyecto académico, University of Worcester",
    body: "Desarrollé una app móvil basada en la ubicación con Google Firebase como backend, con autenticación de usuarios y almacenamiento en tiempo real para sincronizar ubicaciones y eventos.",
  },
  {
    title: "Páginas web de e-commerce",
    subtitle: "HTML / CSS / JavaScript",
    body: "Diseñé y desarrollé páginas front-end de e-commerce adaptables, con fichas de producto, navegación y elementos interactivos.",
  },
];

export const experience: CvEntry[] = [
  {
    title: "Bartender en Sabai Sabai",
    subtitle: "Abr. 2024 – mar. 2026, Birmingham, Reino Unido",
    body: "Preparé y serví cócteles, cafés, destilados y cerveza con un alto nivel en la barra de un restaurante tailandés con mucho movimiento. Cobré en efectivo y con tarjeta con precisión, cuadré la caja al final de cada turno y me encargué de la limpieza semanal de los tiradores de cerveza, la higiene diaria de la barra y el control de stock según los estándares de la cervecera y de seguridad alimentaria. Comprobé la identificación de los clientes según Challenge 25 y apliqué los procedimientos de servicio responsable.",
  },
  {
    title: "Bartender y friegaplatos en Tapas Revolution",
    subtitle: "2021 – 2023, Birmingham, Reino Unido",
    body: "Bartender (unos 24 meses) y friegaplatos (4 meses). Serví cócteles, vino, cerveza y destilados en un restaurante español de mucho volumen, alternando entre inglés y español para atender a clientes y compañeros. Cobré a los clientes y llevé la caja en los servicios de máxima afluencia. Como friegaplatos, ayudé a los cocineros con la preparación, el lavado y la higiene de la cocina.",
  },
];

export const certifications: string[] = [
  "Licencia SIA Door Supervisor — válida hasta el 30 de septiembre de 2028",
  "Highfield Level 2 Award for Door Supervisors in the Private Security Industry (RQF) — junio de 2025",
  "Highfield Level 3 Award in Emergency First Aid at Work (RQF) — mayo de 2025 (válido 3 años)",
  "ACT Awareness e-Learning — Counter Terrorism Policing / NaCTSO, junio de 2025",
  "ACT Security e-Learning — Counter Terrorism Policing / SIA, junio de 2025",
  "Carné de conducir británico (completo)",
];

export const skills: CvSkillGroup[] = [
  {
    name: "Seguridad e informática forense",
    items: [
      "Informática forense",
      "Respuesta a incidentes",
      "Operaciones de seguridad",
      "Diseño seguro de aplicaciones",
      "Cabeceras de seguridad web (CSP / HSTS)",
      "Mitigación de SSRF",
      "Gestión de secretos",
      "Formación antiterrorista ACT",
    ],
  },
  {
    name: "Desarrollo",
    items: [
      "Dart (Flutter)",
      "C# (Unity)",
      "Java / Kotlin (Android)",
      "JavaScript",
      "TypeScript",
      "WebAssembly",
      "HTML",
      "CSS",
      "Python (básico)",
    ],
  },
  {
    name: "Sistemas operativos y herramientas",
    items: [
      "Linux (Ubuntu)",
      "Windows",
      "Git y GitHub",
      "Firebase",
      "Cloudflare Workers y Pages",
      "Astro",
      "Tailwind CSS",
      "Unity",
      "Microsoft Office",
    ],
  },
  {
    name: "Idiomas",
    items: ["Español — nativo", "Inglés — fluido"],
  },
  {
    name: "Habilidades personales",
    items: [
      "Atención al cliente",
      "Manejo de efectivo",
      "Desescalada de conflictos",
      "Trabajo en equipo",
      "Gestión del tiempo",
      "Comunicación bilingüe",
    ],
  },
];
