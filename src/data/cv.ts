// CV content, in one place.
//
// Single source of truth: consumed by BOTH the CV page (src/pages/cv.astro) and
// the PDF generator (scripts/generate-cv-pdf.mjs), so the web and PDF versions
// can never drift. After editing anything here, regenerate the PDF:
//
//   npm run cv:pdf
//
// Plain data only — no Astro or Node imports — so the .mjs generator can read it.

export interface CvEntry {
  title: string;
  subtitle: string;
  body: string;
}

export interface CvSkillGroup {
  name: string;
  items: string[];
}

/**
 * Date stamped into the generated PDF's metadata. Fixed rather than "now" so
 * regenerating unchanged content produces a byte-identical file — otherwise the
 * committed PDF shows up as modified in git after every run. Bump it when the
 * CV content below actually changes.
 */
export const lastUpdated = "2026-08-06";

/** Header details for the PDF. The web page gets these from the sidebar instead. */
export const contact = {
  name: "John Akhis Moreno",
  headline: "Cyber Security Student & Builder",
  email: "contact@yongchivo.com",
  website: "yongchivo.com",
  github: "github.com/yongchivo",
  linkedin: "linkedin.com/in/john-akhis-moreno-1935a8393",
};

export const profile =
  "Year 2 BSc (Hons) Cyber Security student at the University of Worcester (graduating 2027) who ships production software. Designed, built and released PHV Prep UK, a paid iOS exam-preparation app built solo in Flutter and Firebase with server-side purchase verification and API keys kept off the client, alongside a hub of six browser-based cyber security tools running on Cloudflare Workers. Practical experience across digital forensics, secure application design, mobile and web development, and custom Linux environments. Bilingual in Spanish and English. Holder of an SIA Door Supervisor licence, Emergency First Aid at Work certification and a full UK driving licence. Four years of customer-facing hospitality experience have built strong communication skills, reliability and the ability to stay calm under pressure, both independently and in fast-moving teams.";

export const education: CvEntry[] = [
  {
    title: "BSc (Hons) Cyber Security (Single Honours)",
    subtitle:
      "Sept 2024 – Jun 2027 (expected) at University of Worcester, Worcester, UK",
    body: "Year 2, B-grade average. Modules include Digital Forensics, Mobile Application Development, Web Technologies, networking and security fundamentals. Coursework focuses on practical investigation techniques, secure design and modern application development.",
  },
  {
    title: "BTEC Level 3 National Extended Diploma in Information Technology",
    subtitle: "2022 – 2024 at Sandwell College, Central Campus, Birmingham, UK",
    body: "Overall grade: MMP. Merit grades in IT Systems, Creating Systems to Manage Information, Mobile Apps Development, Software Testing, Programming, Using Social Media in Business and IT Project Management. Pass grades in Cyber Security and Incident Management, IT Service Delivery, Website Development, IT Technical Support, Computer Games Development and Digital Animation.",
  },
];

/** Shipped, self-directed work. Listed before the academic projects. */
export const projects: CvEntry[] = [
  {
    title: "PHV Prep UK — iOS Exam Preparation App",
    subtitle:
      "Flutter / Dart / Firebase / Anthropic API - Solo project, live on the App Store",
    body: "Designed, built and released a paid exam-preparation app for the Wolverhampton private hire vehicle (taxi badge) licensing test, covering 300+ practice questions, timed mock exams that mirror the real exam's pass logic, and an AI tutor for UK taxi law. Built solo with Flutter and Firebase (Auth, Firestore, Cloud Functions, europe-west2). Security-focused throughout: server-side StoreKit 2 purchase verification, the Anthropic API key held in Secret Manager and never shipped in the client, Firestore rules locking premium status to the backend, and content-safety controls on the AI feature. The Android build is in Google Play closed testing, with launch expected 18 August 2026.",
  },
  {
    title: "Yongchivo Tools — Cyber Security Micro-Tools",
    subtitle: "Astro / Tailwind / Cloudflare Workers - tools.yongchivo.com",
    body: "Built and launched a hub of six free, bilingual (English/Spanish) cyber security tools. Four run entirely client-side — password generator, password strength analyser, subnet calculator and a cyber-role quiz — with two backed by Cloudflare Workers: a security headers checker with strict SSRF-safe URL validation, and a breach checker built on the XposedOrNot API. Deployed with automatic builds from GitHub and its own A-grade security headers.",
  },
  {
    title: "File Converter — Private, In-Browser",
    subtitle: "JavaScript / WebAssembly / Astro - yongchivo.com/convert",
    body: "Built a privacy-first file converter that runs entirely in the browser, so no file is ever uploaded. Converts images (PNG, JPG, WebP, and HEIC via the libheif WebAssembly build) and data formats (CSV, JSON, YAML, XML) in every direction, with drag-and-drop, batch conversion and graceful handling of malformed input. Bilingual (EN/ES) on a single reusable conversion engine.",
  },
];

export const academicProjects: CvEntry[] = [
  {
    title: "BlackDogHunter — 2D Game",
    subtitle: "Unity / C# - Academic project, University of Worcester",
    body: "Designed and built a complete 2D game in Unity using C#, covering game mechanics, sprite animation, scene management and level design.",
  },
  {
    title: "University Kiosk Operating System",
    subtitle: "Linux / Ubuntu - Academic project, University of Worcester",
    body: "Built a locked-down kiosk OS based on Ubuntu, configuring auto-login, a restricted user environment and start-up scripts to deliver a reliable single-purpose public terminal.",
  },
  {
    title: "MyLocation — Mobile Application",
    subtitle:
      "Android / Java / Kotlin / Firebase - Academic project, University of Worcester",
    body: "Developed a location-aware mobile app backed by Google Firebase, including user authentication and real-time data storage to sync locations and events.",
  },
  {
    title: "E-Commerce Web Pages",
    subtitle: "HTML / CSS / JavaScript",
    body: "Designed and built responsive e-commerce front-end pages, including product layouts, navigation and interactive elements.",
  },
];

export const experience: CvEntry[] = [
  {
    title: "Bartender at Sabai Sabai",
    subtitle: "Apr 2024 – Mar 2026 in Birmingham, UK",
    body: "Prepared and served cocktails, coffees, spirits and beer to a high standard in a busy Thai-restaurant bar. Handled cash and card payments accurately, reconciled tills at end of shift, and carried out weekly beer-line cleaning, daily bar hygiene and stock checks to brewery and food-safety standards. Verified customer ID under Challenge 25 and applied responsible-service procedures.",
  },
  {
    title: "Bartender & Kitchen Porter at Tapas Revolution",
    subtitle: "2021 – 2023 in Birmingham, UK",
    body: "Bartender (~24 months) and Kitchen Porter (4 months). Served cocktails, wine, beer and spirits in a high-volume Spanish restaurant, switching between English and Spanish to support customers and team members. Took customer payments and operated the till during peak services. As Kitchen Porter, supported chefs with food preparation, dishwashing and kitchen hygiene.",
  },
];

export const certifications: string[] = [
  "SIA Door Supervisor Licence — Valid to 30 September 2028",
  "Highfield Level 2 Award for Door Supervisors in the Private Security Industry (RQF) — June 2025",
  "Highfield Level 3 Award in Emergency First Aid at Work (RQF) — May 2025 (valid 3 years)",
  "ACT Awareness e-Learning — Counter Terrorism Policing / NaCTSO, June 2025",
  "ACT Security e-Learning — Counter Terrorism Policing / SIA, June 2025",
  "Full UK Driving Licence",
];

export const skills: CvSkillGroup[] = [
  {
    name: "Security & Forensics",
    items: [
      "Digital Forensics",
      "Incident Response",
      "Security Operations",
      "Secure Application Design",
      "Web Security Headers (CSP / HSTS)",
      "SSRF Mitigation",
      "Secrets Management",
      "ACT Counter-Terrorism",
    ],
  },
  {
    name: "Development",
    items: [
      "Dart (Flutter)",
      "C# (Unity)",
      "Java / Kotlin (Android)",
      "JavaScript",
      "TypeScript",
      "WebAssembly",
      "HTML",
      "CSS",
      "Python (basics)",
    ],
  },
  {
    name: "Operating Systems & Tools",
    items: [
      "Linux (Ubuntu)",
      "Windows",
      "Git & GitHub",
      "Firebase",
      "Cloudflare Workers & Pages",
      "Astro",
      "Tailwind CSS",
      "Unity",
      "Microsoft Office",
    ],
  },
  {
    name: "Languages",
    items: ["Spanish — Native", "English — Fluent"],
  },
  {
    name: "Soft Skills",
    items: [
      "Customer service",
      "Cash handling",
      "Conflict de-escalation",
      "Teamwork",
      "Time management",
      "Bilingual communication",
    ],
  },
];
