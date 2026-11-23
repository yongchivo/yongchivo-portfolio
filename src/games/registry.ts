// The games on /games/, in hub order. Adding one = an entry here plus its
// component in GameDetail.astro.
import type { SiteLang } from "../i18n/site";

export type Lang = SiteLang;
export type GameId = "bubbles" | "blackjack" | "poker" | "roulette";

interface GameCopy {
  name: string;
  /** Hub card + page intro. */
  desc: string;
  /** <title> */
  title: string;
  /** Meta description. */
  description: string;
  how: string[];
}

export interface Game {
  id: GameId;
  tone: "cyan" | "magenta" | "purple" | "amber";
  /** 24x24 stroked icon body. */
  icon: string;
  /** Uses the shared play-money chip balance. */
  casino: boolean;
  copy: Record<Lang, GameCopy>;
}

export const games: Game[] = [
  {
    id: "bubbles",
    tone: "cyan",
    icon: '<circle cx="9" cy="14" r="5"/><circle cx="17" cy="7" r="3"/><circle cx="18.5" cy="16.5" r="1.5"/>',
    casino: false,
    copy: {
      en: {
        name: "Bubble Pop",
        desc: "Pop as many bubbles as you can in 30 seconds. Chain pops for a combo multiplier.",
        title: "Bubble Pop — Free Browser Game | Yongchivo",
        description:
          "A fast 30-second bubble popping game: chain pops to build a combo multiplier, catch the golden bubbles and beat your best score. Free, no sign-up.",
        how: [
          "Tap or click bubbles before they float away.",
          "Every 5 pops in a row raises your multiplier (up to ×5). A miss or an escaped bubble resets it.",
          "Golden bubbles are worth five times as much.",
        ],
      },
      es: {
        name: "Explota burbujas",
        desc: "Explota todas las burbujas que puedas en 30 segundos. Encadena para multiplicar.",
        title: "Explota burbujas — Juego gratis en el navegador | Yongchivo",
        description:
          "Un juego rápido de 30 segundos: encadena burbujas para subir el multiplicador, caza las doradas y supera tu récord. Gratis y sin registro.",
        how: [
          "Toca o haz clic en las burbujas antes de que se escapen.",
          "Cada 5 seguidas sube tu multiplicador (hasta ×5). Si fallas o se escapa una, vuelve a ×1.",
          "Las burbujas doradas valen cinco veces más.",
        ],
      },
    },
  },
  {
    id: "blackjack",
    tone: "magenta",
    icon: '<rect x="4" y="3" width="11" height="15" rx="2"/><path d="M9 21h9a2 2 0 0 0 2-2V8"/>',
    casino: true,
    copy: {
      en: {
        name: "Blackjack",
        desc: "Beat the dealer to 21. Hit, stand or double down — blackjack pays 3:2.",
        title: "Blackjack — Free Play-Money Game | Yongchivo",
        description:
          "Play blackjack against the dealer in your browser with play-money chips: hit, stand or double down. Blackjack pays 3:2. Free, no sign-up, no real money.",
        how: [
          "Pick a bet and deal. Get closer to 21 than the dealer without going over.",
          "Hit to take a card, stand to stop, or double your bet for exactly one more card.",
          "The dealer stands on 17. A win pays 1:1, a natural blackjack 3:2, a tie returns your bet.",
        ],
      },
      es: {
        name: "Blackjack",
        desc: "Gana al crupier acercándote a 21. Pide, plántate o dobla — el blackjack paga 3:2.",
        title: "Blackjack — Juego gratis con fichas ficticias | Yongchivo",
        description:
          "Juega al blackjack contra el crupier en tu navegador con fichas ficticias: pide, plántate o dobla. El blackjack paga 3:2. Gratis, sin registro y sin dinero real.",
        how: [
          "Elige apuesta y reparte. Acércate a 21 más que el crupier sin pasarte.",
          "Pide carta, plántate o dobla la apuesta a cambio de una única carta más.",
          "El crupier se planta con 17. Ganar paga 1:1, el blackjack natural 3:2 y el empate devuelve la apuesta.",
        ],
      },
    },
  },
  {
    id: "poker",
    tone: "purple",
    icon: '<path d="M12 3c3 4 7 6 7 10a3.5 3.5 0 0 1-7 1 3.5 3.5 0 0 1-7-1c0-4 4-6 7-10z"/><path d="M12 14v7M9 21h6"/>',
    casino: true,
    copy: {
      en: {
        name: "Video Poker",
        desc: "Five-card draw: hold the cards you like, redraw the rest. Jacks or better pays.",
        title: "Video Poker (Jacks or Better) — Free Play-Money Game | Yongchivo",
        description:
          "Five-card draw video poker in your browser with play-money chips: hold, draw and hit a pair of jacks or better — up to a royal flush at 250×. Free, no real money.",
        how: [
          "Pick a bet and deal five cards.",
          "Tap the cards you want to keep, then draw to replace the rest.",
          "A pair of jacks or better pays — the paytable shows what each hand returns.",
        ],
      },
      es: {
        name: "Vídeo póker",
        desc: "Póker de cinco cartas: guarda las que quieras y cambia el resto. Paga desde pareja de jotas.",
        title: "Vídeo póker (Jotas o mejor) — Juego gratis con fichas ficticias | Yongchivo",
        description:
          "Vídeo póker de cinco cartas en tu navegador con fichas ficticias: guarda, cambia y consigue pareja de jotas o mejor — hasta la escalera real a 250×. Gratis, sin dinero real.",
        how: [
          "Elige apuesta y reparte cinco cartas.",
          "Toca las cartas que quieras guardar y cambia el resto.",
          "Paga desde pareja de jotas — la tabla muestra cuánto devuelve cada mano.",
        ],
      },
    },
  },
  {
    id: "roulette",
    tone: "amber",
    icon: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>',
    casino: true,
    copy: {
      en: {
        name: "Roulette",
        desc: "European roulette, single zero. Bet on numbers, colours or dozens and spin.",
        title: "Roulette — Free Play-Money European Roulette | Yongchivo",
        description:
          "Spin a single-zero European roulette wheel in your browser with play-money chips: straight numbers at 35:1, red/black, odd/even and dozens. Free, no real money.",
        how: [
          "Pick a chip and tap the table to place bets — tap again to add more.",
          "Spin. A single number pays 35:1, a dozen 2:1, and red/black, odd/even and high/low pay 1:1.",
          "Zero loses every outside bet. Your bets stay on the table for the next spin.",
        ],
      },
      es: {
        name: "Ruleta",
        desc: "Ruleta europea de un solo cero. Apuesta a números, colores o docenas y gira.",
        title: "Ruleta — Ruleta europea gratis con fichas ficticias | Yongchivo",
        description:
          "Gira una ruleta europea de un solo cero en tu navegador con fichas ficticias: pleno a 35:1, rojo/negro, par/impar y docenas. Gratis, sin dinero real.",
        how: [
          "Elige una ficha y toca la mesa para apostar — toca otra vez para sumar más.",
          "Gira. Un pleno paga 35:1, una docena 2:1, y rojo/negro, par/impar y falta/pasa pagan 1:1.",
          "El cero hace perder todas las apuestas exteriores. Tus apuestas se quedan en la mesa para la siguiente tirada.",
        ],
      },
    },
  },
];

export const getGame = (id: string) => games.find((g) => g.id === id);
