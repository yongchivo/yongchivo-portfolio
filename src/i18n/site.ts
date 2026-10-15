// Site-wide UI strings (top bar, footer) and the EN <-> ES path map.
//
// Spanish pages live under /es/. Not every page has a Spanish twin yet (the blog
// and PHV Prep UK are English-only), so the language switch only points at a
// real counterpart and otherwise falls back to the other language's home page.

export type SiteLang = "en" | "es";

export const ui = {
  en: {
    nav: {
      tools: "Tools",
      projects: "Projects",
      who: "Who am I?",
      blog: "Blog",
    },
    navLabel: "Main",
    menu: "Menu",
    home: "Yongchivo — home",
    switchLabel: "Leer en español",
    switchShort: "ES",
    builtWith: "Built with",
    contact: "Contact",
    socials: "Social links",
  },
  es: {
    nav: {
      tools: "Herramientas",
      projects: "Proyectos",
      who: "¿Quién soy?",
      blog: "Blog (EN)",
    },
    navLabel: "Principal",
    menu: "Menú",
    home: "Yongchivo — inicio",
    switchLabel: "Read in English",
    switchShort: "EN",
    builtWith: "Hecho con",
    contact: "Contacto",
    socials: "Redes sociales",
  },
} as const;

/** Prefixes a path for the given language: localize("/cv", "es") -> "/es/cv". */
export function localize(path: string, lang: SiteLang): string {
  if (lang === "en") return path;
  return path === "/" ? "/es/" : `/es${path}`;
}

// Paths (without the /es prefix) that exist in BOTH languages.
const BILINGUAL = /^\/(?:|projects(?:\/[a-z0-9-]+)?|cv|tools|convert(?:\/.*)?|analytics(?:\/.*)?)\/?$/;

/**
 * The same page in the other language, or that language's home page when the
 * current page has no translation.
 */
export function alternatePath(pathname: string): string {
  const isEs = pathname === "/es" || pathname.startsWith("/es/");
  const base = isEs ? pathname.slice(3) || "/" : pathname;
  if (!BILINGUAL.test(base)) return isEs ? "/" : "/es/";
  return isEs ? base : localize(base, "es");
}
