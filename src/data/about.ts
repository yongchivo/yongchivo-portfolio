// "Who am I?" — the biography and brand copy for /cv and /es/cv.
// Written from John's own answers (Oct 2026). The CV itself still comes from
// src/data/cv.ts / cv-es.ts.

type Localized<T> = Record<"en" | "es", T>;

export const about = {
  title: { en: "Who am I?", es: "¿Quién soy?" },

  // First line of the biography. {name} is highlighted on the page.
  lead: {
    en: { before: "I'm ", name: "John Akhis Moreno", after: ", the person behind Yongchivo." },
    es: { before: "Soy ", name: "John Akhis Moreno", after: ", la persona detrás de Yongchivo." },
  },

  story: {
    en: [
      "I was born and raised in Málaga. In 2019 I had to repeat a year at school, and my dad — who was already living in the UK — suggested I come to Birmingham and give it a go. I wasn't sure at all: it was a huge change, and it was. But back then I was lost, and Birmingham turned me around. It helped me discover a lot of things, and above all, myself.",
      "I started at Sandwell College in West Bromwich in late October, with the year already under way, and stayed three years. I'd never pictured myself at university, but there I realised I could do it. Today I'm in the final year of a BSc in Cyber Security at the University of Worcester. Málaga is still home: my family is there, and it's a city — and Spain a country — I'll always love.",
    ],
    es: [
      "Nací y crecí en Málaga. En 2019 tenía que repetir curso, y mi padre, que ya vivía en el Reino Unido, me propuso venirme a Birmingham a probar. No lo tenía nada claro: era un cambio enorme, y lo fue. Pero en aquel momento estaba perdido, y Birmingham me cambió. Me ayudó a descubrir muchas cosas y, sobre todo, a mí mismo.",
      "Llegué al Sandwell College de West Bromwich a finales de octubre, con el curso ya empezado, y estuve allí tres años. Nunca me había imaginado en la universidad, pero allí me vi capaz. Hoy estoy en el último año del grado en Ciberseguridad de la University of Worcester. Málaga sigue siendo mi tierra: allí está mi familia, y es una ciudad maravillosa en un país enorme.",
    ],
  },

  journey: {
    en: [
      { place: "Málaga", note: "Where it all started" },
      { place: "Birmingham", note: "2019 — a fresh start" },
      { place: "Sandwell College", note: "Three years in West Bromwich" },
      { place: "University of Worcester", note: "BSc Cyber Security — final year" },
    ],
    es: [
      { place: "Málaga", note: "Donde empezó todo" },
      { place: "Birmingham", note: "2019 — un nuevo comienzo" },
      { place: "Sandwell College", note: "Tres años en West Bromwich" },
      { place: "University of Worcester", note: "Grado en Ciberseguridad — último año" },
    ],
  },

  name: {
    heading: { en: "Why “Yongchivo”?", es: "¿Por qué «Yongchivo»?" },
    text: {
      en: "It comes from “baby chivo” — the young goat, the young promise. The name was born in my streaming days, inspired by a song by Yonchimi and Ñengo Flow, and today it's the brand behind everything I build.",
      es: "Viene de «baby chivo»: la cabra joven, la joven promesa. El nombre nació en mi etapa de streamer, inspirado en una canción de Yonchimi y Ñengo Flow, y hoy es la marca detrás de todo lo que construyo.",
    },
  },

  tech: {
    heading: { en: "From the PlayStation to cyber security", es: "De la PlayStation a la ciberseguridad" },
    text: {
      en: [
        "It all started with a PlayStation 1. I grew up on True Crime and GTA: San Andreas on the PS2, Minecraft and Far Cry 4 on the PS3, Black Ops 3 and ARK on the PS4 and Cyberpunk on the PS5 — and from consoles I moved on to phones, tablets and computers, picking up image and video editing along the way.",
        "At college, of everything in computing, security was what hooked me: gathering information and evidence, understanding attacks and building the defences and countermeasures against them. That's why I chose to study Cyber Security.",
        "Away from the screen I work in security too: I'm an SIA-licensed Door Supervisor at Pavilon Security, at pubs, events and film premieres across the West Midlands.",
      ],
      es: [
        "Todo empezó con una PlayStation 1. Crecí con True Crime y GTA: San Andreas en la PS2, Minecraft y Far Cry 4 en la PS3, Black Ops 3 y ARK en la PS4 y Cyberpunk en la PS5. De las consolas pasé a los móviles, las tablets y los ordenadores, y por el camino me enganché a editar imagen y vídeo.",
        "En el college, de todo lo que abarca la informática, lo que más me atrapó fue la seguridad: recopilar información y pruebas, entender los ataques y construir las defensas y contramedidas. Por eso elegí estudiar Ciberseguridad.",
        "Fuera de la pantalla también trabajo en seguridad: soy Door Supervisor con licencia SIA en Pavilon Security, en pubs, fiestas y estrenos de cine de West Midlands.",
      ],
    },
  },

  services: {
    heading: { en: "What I can do for you", es: "Qué puedo hacer por ti" },
    intro: {
      en: "For small businesses, startups and individuals — in English or Spanish.",
      es: "Para pequeños negocios, startups y particulares, en español o en inglés.",
    },
    items: {
      en: [
        { icon: "phone", title: "Mobile apps", text: "iOS and Android, from idea to the stores." },
        { icon: "web", title: "Websites", text: "Fast, bilingual and secure from day one." },
        { icon: "tool", title: "Browser tools", text: "Small tools that run on your visitors' devices." },
        { icon: "shield", title: "Security audits", text: "A cyber security review of what you already have." },
        { icon: "check", title: "Web & app audits", text: "Your site or app reviewed: code, setup and weak spots." },
        { icon: "chat", title: "A second opinion", text: "A fresh point of view on your project or idea." },
      ],
      es: [
        { icon: "phone", title: "Apps móviles", text: "iOS y Android, de la idea a las tiendas." },
        { icon: "web", title: "Webs", text: "Rápidas, bilingües y seguras desde el primer día." },
        { icon: "tool", title: "Herramientas web", text: "Pequeñas herramientas que funcionan en el navegador." },
        { icon: "shield", title: "Auditorías de seguridad", text: "Una revisión de ciberseguridad de lo que ya tienes." },
        { icon: "check", title: "Auditorías de webs y apps", text: "Tu web o app revisada: código, configuración y puntos débiles." },
        { icon: "chat", title: "Una segunda opinión", text: "Un punto de vista nuevo sobre tu proyecto o tu idea." },
      ],
    },
    cta: { en: "Let's talk", es: "Hablemos" },
  },

  how: {
    heading: { en: "How I work", es: "Cómo trabajo" },
    items: {
      en: [
        "Methodical: I make a solid plan and follow it to the letter.",
        "Self-critical: at the end I look for the gaps in my own ideas, then improve or reinvent them.",
        "Security from the start, not as a patch at the end.",
        "Bilingual: Spanish and English, so your project can reach both markets.",
        "Close and direct: you talk to the person doing the work.",
      ],
      es: [
        "Metódico: hago un buen plan y lo ejecuto al pie de la letra.",
        "Autocrítico: al terminar busco los huecos en mis propias ideas para mejorarlas o reinventarlas.",
        "Seguridad desde el principio, no como un parche al final.",
        "Bilingüe: español e inglés, para que tu proyecto llegue a los dos mercados.",
        "Trato cercano y directo: hablas con quien hace el trabajo.",
      ],
    },
  },

  beyond: {
    heading: { en: "Beyond the code", es: "Más allá del código" },
    chips: {
      en: ["Gym & training", "Sport", "Podcasts", "Music", "Time with friends", "A good debate", "Video editing"],
      es: ["Gimnasio y ejercicio", "Deporte", "Podcasts", "Música", "Tiempo con amigos", "Un buen debate", "Edición de vídeo"],
    },
    text: {
      en: "Video editing is my art form: I don't play an instrument, sing or draw, but I can express myself through an edit.",
      es: "Editar vídeo es mi forma de arte: no toco instrumentos, ni canto ni dibujo, pero con un montaje me expreso.",
    },
  },

  next: {
    heading: { en: "Where I'm heading", es: "Hacia dónde voy" },
    text: {
      en: "I want to grow Yongchivo into a big brand: freelancing for small businesses, startups and individuals under the Yongchivo name, and one day leading a team to take on even bigger projects. Got an idea?",
      es: "Quiero que Yongchivo crezca hasta ser una gran marca: trabajar como freelance para pequeños negocios, startups y particulares bajo el nombre de Yongchivo, y algún día liderar un equipo para afrontar proyectos aún más grandes. ¿Tienes una idea?",
    },
  },

  cv: {
    heading: { en: "CV", es: "CV" },
    download: { en: "Download CV (PDF)", es: "Descargar CV (PDF, en inglés)" },
  },
} satisfies Record<string, unknown>;

export type AboutLang = keyof Localized<string>;
