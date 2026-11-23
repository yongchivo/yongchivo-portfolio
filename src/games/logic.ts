// Pure rules for the /games section: no DOM, so `node src/games/logic.test.ts`
// can check them. Chips are play money — nothing here touches real payments.

export type Card = { r: number; s: number }; // r: 2..14 (11 J, 12 Q, 13 K, 14 A), s: 0..3

export const SUITS = ["♠", "♥", "♦", "♣"];
export const rankLabel = (r: number) => (r <= 10 ? String(r) : "JQKA"[r - 11]);
export const cardLabel = (c: Card) => rankLabel(c.r) + SUITS[c.s];
export const isRedSuit = (c: Card) => c.s === 1 || c.s === 2;

/** Uniform-enough integer in [0, n): the modulo bias over 2^32 is irrelevant here. */
export function randInt(n: number): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] % n;
}

/** A freshly shuffled 52-card deck (Fisher–Yates). */
export function newDeck(): Card[] {
  const deck: Card[] = [];
  for (let s = 0; s < 4; s++) for (let r = 2; r <= 14; r++) deck.push({ r, s });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// ---------- blackjack ----------

/** Best total for a hand; `soft` when an ace is still counted as 11. */
export function bjValue(hand: Card[]): { total: number; soft: boolean } {
  let total = 0;
  let aces = 0;
  for (const c of hand) {
    if (c.r === 14) {
      aces++;
      total += 11;
    } else total += Math.min(c.r, 10);
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return { total, soft: aces > 0 };
}

export const isBlackjack = (hand: Card[]) => hand.length === 2 && bjValue(hand).total === 21;

/**
 * What a finished hand returns per chip staked (stake included): 0 lose,
 * 1 push, 2 win, 2.5 natural blackjack.
 */
export function bjReturn(player: Card[], dealer: Card[]): number {
  const p = bjValue(player).total;
  const d = bjValue(dealer).total;
  if (p > 21) return 0;
  if (isBlackjack(player)) return isBlackjack(dealer) ? 1 : 2.5;
  if (isBlackjack(dealer)) return 0;
  if (d > 21 || p > d) return 2;
  return p === d ? 1 : 0;
}

// ---------- video poker (five-card draw, jacks or better) ----------

/** Paytable, best first: what one chip staked returns. */
export const PAYTABLE = [
  ["royal", 250],
  ["straightFlush", 50],
  ["four", 25],
  ["fullHouse", 9],
  ["flush", 6],
  ["straight", 4],
  ["three", 3],
  ["twoPair", 2],
  ["jacks", 1],
] as const;

export type PokerHand = (typeof PAYTABLE)[number][0];

/** The paying hand in five cards, or null when it pays nothing. */
export function pokerHand(hand: Card[]): PokerHand | null {
  const ranks = hand.map((c) => c.r).sort((a, b) => a - b);
  const counts = new Map<number, number>();
  for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1);
  const groups = [...counts.values()].sort((a, b) => b - a);

  const flush = hand.every((c) => c.s === hand[0].s);
  const distinct = counts.size === 5;
  // A-2-3-4-5 counts: sorted that reads 2,3,4,5,14.
  const wheel = distinct && ranks.join() === "2,3,4,5,14";
  const straight = distinct && (ranks[4] - ranks[0] === 4 || wheel);

  if (straight && flush) return ranks[0] === 10 ? "royal" : "straightFlush";
  if (groups[0] === 4) return "four";
  if (groups[0] === 3 && groups[1] === 2) return "fullHouse";
  if (flush) return "flush";
  if (straight) return "straight";
  if (groups[0] === 3) return "three";
  if (groups[0] === 2 && groups[1] === 2) return "twoPair";
  if (groups[0] === 2) {
    const pair = [...counts].find(([, n]) => n === 2)![0];
    return pair >= 11 ? "jacks" : null;
  }
  return null;
}

export const pokerPays = (hand: PokerHand | null) =>
  hand ? PAYTABLE.find(([name]) => name === hand)![1] : 0;

// ---------- roulette (European, single zero) ----------

/** Pocket order clockwise around a European wheel. */
export const WHEEL = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14,
  31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
export const pocketColor = (n: number) => (n === 0 ? "green" : RED.has(n) ? "red" : "black");

/**
 * What one chip on `spot` returns (stake included) when `n` comes up.
 * Spots: "n0".."n36", red, black, even, odd, low, high, d1, d2, d3.
 * Zero loses every outside bet.
 */
export function spotReturn(spot: string, n: number): number {
  if (spot[0] === "n") return Number(spot.slice(1)) === n ? 36 : 0;
  if (n === 0) return 0;
  switch (spot) {
    case "red":
    case "black":
      return pocketColor(n) === spot ? 2 : 0;
    case "even":
      return n % 2 === 0 ? 2 : 0;
    case "odd":
      return n % 2 === 1 ? 2 : 0;
    case "low":
      return n <= 18 ? 2 : 0;
    case "high":
      return n >= 19 ? 2 : 0;
    case "d1":
    case "d2":
    case "d3":
      return Math.ceil(n / 12) === Number(spot[1]) ? 3 : 0;
  }
  return 0;
}

/** Total chips returned for a table of bets ({ spot: stake }). */
export function rouletteReturn(bets: Record<string, number>, n: number): number {
  return Object.entries(bets).reduce((sum, [spot, stake]) => sum + stake * spotReturn(spot, n), 0);
}
