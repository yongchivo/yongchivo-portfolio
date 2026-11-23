// The collectible set behind /games/packs/: thirty cyber-security cards, how
// rare each tier is, and how a pack is rolled. No DOM here, so logic.test.ts
// can check it.
import { randInt } from "./logic.ts";

type Localized = { en: string; es: string };

/**
 * Rarity tiers, commonest first. `weight` is the chance out of 100 that a pack
 * slot rolls that tier; `refund` is the chips a duplicate gives back.
 */
export const RARITIES = [
  { name: { en: "Common", es: "Común" }, weight: 70, refund: 5 },
  { name: { en: "Rare", es: "Rara" }, weight: 23, refund: 20 },
  { name: { en: "Epic", es: "Épica" }, weight: 6, refund: 60 },
  { name: { en: "Legendary", es: "Legendaria" }, weight: 1, refund: 300 },
] as const;

export const PACK_COST = 100;
export const PACK_SIZE = 5;
/** The last card of every pack is at least this tier (rare). */
export const PACK_GUARANTEE = 1;

export interface CollectCard {
  /** Stable key for the saved collection: never rename or reuse one. */
  id: string;
  emoji: string;
  /** Index into RARITIES. */
  rarity: number;
  name: Localized;
  desc: Localized;
}

const card = (id: string, emoji: string, rarity: number, name: [string, string], desc: [string, string]): CollectCard => ({
  id,
  emoji,
  rarity,
  name: { en: name[0], es: name[1] },
  desc: { en: desc[0], es: desc[1] },
});

// Album order: by rarity, then roughly from everyday to exotic.
export const CARDS: CollectCard[] = [
  card("password", "🔑", 0, ["Password", "Contraseña"], ["Long beats clever. Never reuse one.", "Mejor larga que ingeniosa. Nunca la repitas."]),
  card("firewall", "🧱", 0, ["Firewall", "Cortafuegos"], ["Decides which traffic gets in or out.", "Decide qué tráfico entra y cuál sale."]),
  card("backup", "💾", 0, ["Backup", "Copia de seguridad"], ["The copy you are glad you made.", "La copia que te alegras de haber hecho."]),
  card("patch", "🩹", 0, ["Patch", "Parche"], ["An update that closes a known hole.", "Una actualización que cierra un fallo conocido."]),
  card("vpn", "🚇", 0, ["VPN", "VPN"], ["An encrypted tunnel across a network.", "Un túnel cifrado a través de una red."]),
  card("cookie", "🍪", 0, ["Cookie", "Cookie"], ["A small note a site leaves in your browser.", "Una notita que una web deja en tu navegador."]),
  card("spam", "📧", 0, ["Spam", "Spam"], ["Mail nobody asked for, sent to everybody.", "Correo que nadie pidió, enviado a todos."]),
  card("phishing", "🎣", 0, ["Phishing", "Phishing"], ["A fake message fishing for your login.", "Un mensaje falso que pesca tu contraseña."]),
  card("wifi", "📶", 0, ["Open Wi-Fi", "Wi-Fi abierta"], ["Free, convenient, and shared with strangers.", "Gratis, cómoda y compartida con desconocidos."]),
  card("hash", "🧮", 0, ["Hash", "Hash"], ["A one-way fingerprint of some data.", "Una huella de un dato que no se puede invertir."]),
  card("log", "📜", 0, ["Log", "Registro"], ["The record of what actually happened.", "El registro de lo que pasó de verdad."]),
  card("bug", "🐛", 0, ["Bug", "Bug"], ["A mistake in code, waiting to be found.", "Un error en el código, esperando a que lo encuentren."]),
  card("port", "🚪", 0, ["Port", "Puerto"], ["A numbered door into a machine.", "Una puerta numerada hacia una máquina."]),
  card("antivirus", "🧪", 0, ["Antivirus", "Antivirus"], ["Scans files for known bad patterns.", "Busca patrones maliciosos conocidos en los archivos."]),

  card("2fa", "📱", 1, ["Two-Factor", "Doble factor"], ["A second proof beyond the password.", "Una segunda prueba además de la contraseña."]),
  card("encryption", "🔐", 1, ["Encryption", "Cifrado"], ["Readable only with the right key.", "Solo se lee con la clave correcta."]),
  card("trojan", "🐴", 1, ["Trojan", "Troyano"], ["Malware dressed up as something useful.", "Malware disfrazado de algo útil."]),
  card("worm", "🪱", 1, ["Worm", "Gusano"], ["Malware that spreads without your help.", "Malware que se propaga sin tu ayuda."]),
  card("keylogger", "⌨️", 1, ["Keylogger", "Keylogger"], ["Quietly records every key you press.", "Registra en silencio cada tecla que pulsas."]),
  card("sandbox", "🏖️", 1, ["Sandbox", "Sandbox"], ["A sealed box to run untrusted code in.", "Una caja cerrada donde ejecutar código no fiable."]),
  card("honeypot", "🍯", 1, ["Honeypot", "Honeypot"], ["A decoy system built to be attacked.", "Un sistema señuelo hecho para que lo ataquen."]),
  card("botnet", "🕸️", 1, ["Botnet", "Botnet"], ["Hijacked machines obeying one master.", "Máquinas secuestradas que obedecen a un amo."]),
  card("pentester", "🕵️", 1, ["Pentester", "Pentester"], ["Breaks in, with permission, to report how.", "Entra, con permiso, para contar cómo lo hizo."]),

  card("ransomware", "💰", 2, ["Ransomware", "Ransomware"], ["Encrypts your files and demands payment.", "Cifra tus archivos y exige un rescate."]),
  card("rootkit", "🌱", 2, ["Rootkit", "Rootkit"], ["Hides deep and hides everything else.", "Se esconde a fondo y esconde todo lo demás."]),
  card("zero-day", "💣", 2, ["Zero-Day", "Zero-Day"], ["A flaw attacked before anyone can patch it.", "Un fallo atacado antes de que haya parche."]),
  card("red-team", "🚩", 2, ["Red Team", "Red Team"], ["Plays the attacker so the defence learns.", "Hace de atacante para que la defensa aprenda."]),
  card("blue-team", "🛡️", 2, ["Blue Team", "Blue Team"], ["Detects, responds and keeps the lights on.", "Detecta, responde y mantiene todo en pie."]),

  card("root", "👑", 3, ["Root Access", "Acceso root"], ["Full control. Handle with care.", "Control total. Úsalo con cuidado."]),
  card("yongchivo", "✨", 3, ["Yongchivo", "Yongchivo"], ["The Y itself. The rarest pull in the set.", "La Y en persona. La carta más rara del álbum."]),
];

/** A rarity tier at or above `min`, by weight. */
function rollRarity(min = 0): number {
  const tiers = RARITIES.map((tier, i) => ({ i, weight: tier.weight })).filter((tier) => tier.i >= min);
  let roll = randInt(tiers.reduce((sum, tier) => sum + tier.weight, 0));
  return tiers.find((tier) => (roll -= tier.weight) < 0)!.i;
}

/** One pack: PACK_SIZE indexes into CARDS, the last at least PACK_GUARANTEE. */
export function rollPack(): number[] {
  return Array.from({ length: PACK_SIZE }, (_, slot) => {
    const rarity = rollRarity(slot === PACK_SIZE - 1 ? PACK_GUARANTEE : 0);
    const pool = CARDS.flatMap((c, i) => (c.rarity === rarity ? [i] : []));
    return pool[randInt(pool.length)];
  });
}
