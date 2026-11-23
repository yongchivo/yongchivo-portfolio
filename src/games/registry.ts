// The games on /games/, in hub order. Adding one = an entry here plus its
// component in GameDetail.astro.
import type { SiteLang } from "../i18n/site";

export type Lang = SiteLang;
export type GameId = "bubbles" | "blackjack" | "poker" | "roulette" | "slots" | "packs";
export type CategoryId = "arcade" | "casino" | "collect";
type Tone = "cyan" | "magenta" | "purple" | "amber" | "green" | "rose";

/**
 * The hub's menu, in display order. A category only shows up once a game uses
 * it, so new ones can be listed here ahead of time.
 */
export const categories: { id: CategoryId; tone: Tone; copy: Record<Lang, { name: string; intro: string }> }[] = [
  {
    id: "arcade",
    tone: "cyan",
    copy: {
      en: { name: "Arcade", intro: "Fast rounds against the clock. Your best score is saved in this browser." },
      es: { name: "Arcade", intro: "Partidas rápidas contra el reloj. Tu récord se guarda en este navegador." },
    },
  },
  {
    id: "casino",
    tone: "amber",
    copy: {
      en: { name: "Casino", intro: "One shared balance of play-money chips. No real money, no prizes." },
      es: { name: "Casino", intro: "Un saldo compartido de fichas ficticias. Sin dinero real ni premios." },
    },
  },
  {
    id: "collect",
    tone: "purple",
    copy: {
      en: { name: "Collection", intro: "Spend the chips you win on card packs and fill the album." },
      es: { name: "Colección", intro: "Gasta las fichas que ganes en sobres de cartas y completa el álbum." },
    },
  },
];

/** Games outside the arcade play with the shared play-money chip balance. */
export const usesChips = (game: Game) => game.category !== "arcade";

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
  /** Which section of the hub it sits in. */
  category: CategoryId;
  tone: Tone;
  /** 24x24 stroked icon body. */
  icon: string;
  copy: Record<Lang, GameCopy>;
}

export const games: Game[] = [
  {
    id: "bubbles",
    category: "arcade",
    tone: "cyan",
    icon: '<circle cx="9" cy="14" r="5"/><circle cx="17" cy="7" r="3"/><circle cx="18.5" cy="16.5" r="1.5"/>',
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
    category: "casino",
    tone: "magenta",
    icon: '<rect x="4" y="3" width="11" height="15" rx="2"/><path d="M9 21h9a2 2 0 0 0 2-2V8"/>',
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
    category: "casino",
    tone: "purple",
    icon: '<path d="M12 3c3 4 7 6 7 10a3.5 3.5 0 0 1-7 1 3.5 3.5 0 0 1-7-1c0-4 4-6 7-10z"/><path d="M12 14v7M9 21h6"/>',
    copy: {
      en: {
        name: "Texas Hold'em",
        desc: "Heads-up against the dealer: two cards each, five on the board. Call or fold after the flop.",
        title: "Texas Hold'em vs the Dealer — Free Play-Money Poker | Yongchivo",
        description:
          "Play Texas hold'em heads-up against the dealer in your browser with play-money chips: ante, see the flop, call or fold, best five cards win. Free, no real money.",
        how: [
          "Pick your ante and deal. You get two cards, the dealer gets two face down, and the flop (three shared cards) goes on the board.",
          "Call to stake twice your ante and see the last two cards, or fold and lose only the ante.",
          "The best five cards out of your two plus the five on the board win. A win pays 1:1 on everything you staked; a tie returns it.",
        ],
      },
      es: {
        name: "Texas Hold'em",
        desc: "Mano a mano contra el crupier: dos cartas cada uno y cinco en la mesa. Iguala o retírate tras el flop.",
        title: "Texas Hold'em contra el crupier — Póker gratis con fichas ficticias | Yongchivo",
        description:
          "Juega al Texas Hold'em mano a mano contra el crupier en tu navegador con fichas ficticias: apuesta inicial, flop, iguala o retírate, y gana la mejor mano de cinco cartas. Gratis, sin dinero real.",
        how: [
          "Elige tu apuesta inicial y reparte. Recibes dos cartas, el crupier dos boca abajo, y sale el flop (tres cartas comunes) en la mesa.",
          "Iguala para apostar el doble de la inicial y ver las dos últimas cartas, o retírate y pierde solo la inicial.",
          "Gana la mejor mano de cinco cartas entre tus dos y las cinco de la mesa. Ganar paga 1:1 sobre todo lo apostado; el empate lo devuelve.",
        ],
      },
    },
  },
  {
    id: "roulette",
    category: "casino",
    tone: "amber",
    icon: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>',
    copy: {
      en: {
        name: "Roulette",
        desc: "European roulette, single zero. Bet on numbers, splits, corners, columns or colours and spin.",
        title: "Roulette — Free Play-Money European Roulette | Yongchivo",
        description:
          "Spin a single-zero European roulette wheel in your browser with play-money chips: straight numbers at 35:1, splits, streets, corners, columns, dozens and red/black. Free, no real money.",
        how: [
          "Pick a chip and tap a number to bet on it — tap again to add more.",
          "Tap the dot on the edge between two numbers to split them (17:1), on the corner four share (8:1), or at the end of a row of three for the street (11:1).",
          "A column (the 2:1 boxes) or a dozen pays 2:1; red/black, odd/even and high/low pay 1:1. A single number pays 35:1.",
          "Zero loses every outside bet. Your bets stay on the table for the next spin.",
        ],
      },
      es: {
        name: "Ruleta",
        desc: "Ruleta europea de un solo cero. Apuesta a números, caballos, cuadros, columnas o colores y gira.",
        title: "Ruleta — Ruleta europea gratis con fichas ficticias | Yongchivo",
        description:
          "Gira una ruleta europea de un solo cero en tu navegador con fichas ficticias: pleno a 35:1, caballos, calles, cuadros, columnas, docenas y rojo/negro. Gratis, sin dinero real.",
        how: [
          "Elige una ficha y toca un número para apostarle — toca otra vez para sumar más.",
          "Toca el punto del borde entre dos números para el caballo (17:1), el de la esquina que comparten cuatro para el cuadro (8:1), o el del extremo de una fila de tres para la calle (11:1).",
          "Una columna (las casillas 2:1) o una docena paga 2:1; rojo/negro, par/impar y falta/pasa pagan 1:1. Un pleno paga 35:1.",
          "El cero hace perder todas las apuestas exteriores. Tus apuestas se quedan en la mesa para la siguiente tirada.",
        ],
      },
    },
  },
  {
    id: "slots",
    category: "casino",
    tone: "green",
    icon: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M9 5v14M15 5v14M5.5 12h1M11.5 12h1M17.5 12h1"/>',
    copy: {
      en: {
        name: "Cascade Slot",
        desc: "Five reels that spin down and stop one by one. Line up three or more on the centre payline — five Ys there is the jackpot.",
        title: "Cascade Slot — Free Play-Money Slot Game | Yongchivo",
        description:
          "A five-reel cascade slot in your browser with play-money chips: 3 or more in a row on the centre payline pay, as do 7 or more anywhere; winners pop, reels respin, and five Ys on the line hit the ×500 jackpot. Free, no real money.",
        how: [
          "Pick a bet and spin. The reels spin down and stop one by one, left to right.",
          "Two ways to win: 3 or more of the same symbol in a row on the marked centre line, starting from the left — or 7 or more of the same anywhere.",
          "Winning symbols pop and their reels spin again, which can win again; each cascade raises the multiplier by one, up to ×5. Five Yongchivo Ys on the centre line pay the top prize: ×500 your bet.",
        ],
      },
      es: {
        name: "Slot de cascadas",
        desc: "Cinco rodillos que giran hacia abajo y se paran uno a uno. Haz línea de tres o más en la línea central: cinco Y ahí es el premio máximo.",
        title: "Slot de cascadas — Tragaperras gratis con fichas ficticias | Yongchivo",
        description:
          "Un slot de cinco rodillos con cascadas en tu navegador y fichas ficticias: 3 o más iguales seguidos en la línea central dan premio, igual que 7 o más en cualquier sitio; los premios explotan, los rodillos vuelven a girar y cinco Y en la línea dan el premio máximo de ×500. Gratis, sin dinero real.",
        how: [
          "Elige apuesta y gira. Los rodillos giran hacia abajo y se van parando uno a uno, de izquierda a derecha.",
          "Dos formas de ganar: 3 o más símbolos iguales seguidos en la línea central marcada, empezando por la izquierda — o 7 o más iguales en cualquier sitio.",
          "Los símbolos premiados explotan y sus rodillos vuelven a girar, lo que puede premiar otra vez; cada cascada sube el multiplicador en uno, hasta ×5. Cinco Y de Yongchivo en la línea central dan el premio máximo: ×500 tu apuesta.",
        ],
      },
    },
  },
  {
    id: "packs",
    category: "collect",
    tone: "rose",
    icon: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M6 7.5h12M12 11l2.2 2.5L12 16l-2.2-2.5z"/>',
    copy: {
      en: {
        name: "Card Packs",
        desc: "Spend chips on packs of five cards and collect all 30 — from everyday Firewalls to the legendary Y.",
        title: "Card Packs — Collect 30 Cyber-Security Cards | Yongchivo",
        description:
          "Open card packs with play-money chips and collect 30 cyber-security cards across four rarities. Duplicates give chips back. Free, no real money and nothing to buy.",
        how: [
          "A pack costs 100 chips and holds five cards. The last one is always rare or better.",
          "New cards go into your album; a duplicate gives a few chips back instead (more for rarer cards).",
          "Earn chips in the casino games, or refill when you run out. Your album is saved in this browser.",
        ],
      },
      es: {
        name: "Sobres de cartas",
        desc: "Gasta fichas en sobres de cinco cartas y colecciona las 30: del Cortafuegos de cada día a la Y legendaria.",
        title: "Sobres de cartas — Colecciona 30 cartas de ciberseguridad | Yongchivo",
        description:
          "Abre sobres con fichas ficticias y colecciona 30 cartas de ciberseguridad de cuatro rarezas. Las repetidas devuelven fichas. Gratis, sin dinero real y sin nada que comprar.",
        how: [
          "Un sobre cuesta 100 fichas y trae cinco cartas. La última siempre es rara o mejor.",
          "Las cartas nuevas van a tu álbum; una repetida te devuelve unas fichas (más cuanto más rara).",
          "Consigue fichas en los juegos de casino, o recarga cuando te quedes sin ellas. Tu álbum se guarda en este navegador.",
        ],
      },
    },
  },
];

export const getGame = (id: string) => games.find((g) => g.id === id);
