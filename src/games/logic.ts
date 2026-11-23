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

// ---------- poker (Texas hold'em against the dealer) ----------

/** Hand categories, weakest first: the index is the category's strength. */
export const HANDS = [
  "high",
  "pair",
  "twoPair",
  "three",
  "straight",
  "flush",
  "fullHouse",
  "four",
  "straightFlush",
  "royal",
] as const;

export type HandName = (typeof HANDS)[number];

/**
 * Strength of exactly five cards as [category, ...tie-breakers], comparable
 * with compareScores(). Tie-breakers are the ranks, most significant first
 * (the trips before the pair in a full house, the pair before the kickers…).
 */
export function score5(hand: Card[]): number[] {
  const counts = new Map<number, number>();
  for (const c of hand) counts.set(c.r, (counts.get(c.r) ?? 0) + 1);
  // Ranks by how many there are, then by rank: [K, K, K, 9, 9] -> [13, 9].
  const ranks = [...counts.keys()].sort((x, y) => counts.get(y)! - counts.get(x)! || y - x);
  const groups = ranks.map((r) => counts.get(r)!);

  const flush = hand.every((c) => c.s === hand[0].s);
  const wheel = ranks.join() === "14,5,4,3,2"; // A-2-3-4-5: the ace plays low
  const straight = ranks.length === 5 && (ranks[0] - ranks[4] === 4 || wheel);
  const top = wheel ? 5 : ranks[0];

  const cat = (name: HandName) => HANDS.indexOf(name);
  if (straight && flush) return [cat(top === 14 ? "royal" : "straightFlush"), top];
  if (groups[0] === 4) return [cat("four"), ...ranks];
  if (groups[0] === 3 && groups[1] === 2) return [cat("fullHouse"), ...ranks];
  if (flush) return [cat("flush"), ...ranks];
  if (straight) return [cat("straight"), top];
  if (groups[0] === 3) return [cat("three"), ...ranks];
  if (groups[0] === 2 && groups[1] === 2) return [cat("twoPair"), ...ranks];
  if (groups[0] === 2) return [cat("pair"), ...ranks];
  return [cat("high"), ...ranks];
}

/** Positive when score `a` beats `b`, negative when it loses, 0 on a tie. */
export function compareScores(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff) return diff;
  }
  return 0;
}

/** The best five-card hand in five to seven cards (hole cards + board). */
export function bestHand(cards: Card[]): { name: HandName; score: number[]; cards: Card[] } {
  let best: { score: number[]; cards: Card[] } | null = null;
  // Every five-card subset, as bitmasks over the cards (at most 128 of them).
  for (let mask = 0; mask < 1 << cards.length; mask++) {
    const five = cards.filter((_, i) => mask & (1 << i));
    if (five.length !== 5) continue;
    const score = score5(five);
    if (!best || compareScores(score, best.score) > 0) best = { score, cards: five };
  }
  return { name: HANDS[best!.score[0]], ...best! };
}

// ---------- slot (5 x 5, pays anywhere, cascades, line-of-Y jackpot) ----------

export const SLOT_ROWS = 5;
export const SLOT_COLS = 5;
/** Fewest matching symbols anywhere on the grid that pay. */
export const SLOT_MIN = 7;
/** The cascade multiplier stops growing here. */
export const SLOT_MAX_MULT = 5;

/**
 * One entry per symbol, commonest first. `weight` is how often it lands;
 * `pays` is what one chip staked returns for SLOT_MIN, SLOT_MIN + 2 and
 * SLOT_MIN + 4 or more of it.
 * Tuned by simulation to return about 96% of what is staked over time
 * (roughly a quarter of that is the jackpot, about one spin in 2,000);
 * logic.test.ts fails if a change to this table moves it far from that.
 */
export const SLOT_SYMBOLS = [
  { weight: 15, pays: [0.2, 0.4, 1] },
  { weight: 15, pays: [0.2, 0.4, 1.5] },
  { weight: 14, pays: [0.2, 0.5, 2] },
  { weight: 14, pays: [0.3, 0.7, 3] },
  { weight: 13, pays: [0.3, 1, 4] },
  { weight: 12, pays: [0.5, 1.5, 8] },
  { weight: 10, pays: [1, 3, 15] },
] as const;

/** The brand Y: the last, rarest symbol. A straight line of them is the jackpot. */
export const SLOT_TOP = SLOT_SYMBOLS.length - 1;
/**
 * What one chip staked returns for each line of five Ys. A flat top prize:
 * the cascade multiplier does not apply to it.
 */
export const SLOT_JACKPOT = 500;

/** Every straight line of five on the 5x5 grid: rows, columns and both diagonals. */
const SLOT_LINES: number[][] = [];
for (let a = 0; a < 5; a++) {
  SLOT_LINES.push([0, 1, 2, 3, 4].map((b) => a * SLOT_COLS + b)); // row
  SLOT_LINES.push([0, 1, 2, 3, 4].map((b) => b * SLOT_COLS + a)); // column
}
SLOT_LINES.push([0, 1, 2, 3, 4].map((b) => b * SLOT_COLS + b));
SLOT_LINES.push([0, 1, 2, 3, 4].map((b) => b * SLOT_COLS + (4 - b)));

const SLOT_WEIGHT_SUM = SLOT_SYMBOLS.reduce((sum, symbol) => sum + symbol.weight, 0);

/** A random symbol id, by weight. */
export function slotSymbol(): number {
  let roll = randInt(SLOT_WEIGHT_SUM);
  return SLOT_SYMBOLS.findIndex((symbol) => (roll -= symbol.weight) < 0);
}

export interface SlotWin {
  symbol: number;
  /** Grid indexes (row * SLOT_COLS + col) of every matching symbol. */
  cells: number[];
  /** What one chip staked returns, before the cascade multiplier. */
  pays: number;
  /** A line of five Ys rather than a count of symbols. */
  jackpot?: true;
}

/**
 * Every symbol that appears SLOT_MIN times or more on the grid, plus one
 * jackpot win per straight line of five Ys.
 */
export function slotWins(grid: number[]): SlotWin[] {
  const wins: SlotWin[] = [];
  SLOT_SYMBOLS.forEach(({ pays }, symbol) => {
    const cells = grid.flatMap((id, i) => (id === symbol ? [i] : []));
    if (cells.length < SLOT_MIN) return;
    const tier = cells.length >= SLOT_MIN + 4 ? 2 : cells.length >= SLOT_MIN + 2 ? 1 : 0;
    wins.push({ symbol, cells, pays: pays[tier] });
  });
  for (const line of SLOT_LINES) {
    if (line.every((i) => grid[i] === SLOT_TOP)) wins.push({ symbol: SLOT_TOP, cells: line, pays: SLOT_JACKPOT, jackpot: true });
  }
  return wins;
}

/**
 * Removes the winning cells, lets what is above fall and fills the gaps from
 * the top. `fall` says how many rows each cell of the new grid dropped (0 for
 * cells that did not move), which is all the animation needs.
 */
export function slotDrop(grid: number[], removed: number[], next = slotSymbol): { grid: number[]; fall: number[] } {
  const gone = new Set(removed);
  const out = new Array<number>(grid.length);
  const fall = new Array<number>(grid.length).fill(0);
  for (let col = 0; col < SLOT_COLS; col++) {
    let row = SLOT_ROWS - 1; // next free row, filling from the bottom
    for (let from = SLOT_ROWS - 1; from >= 0; from--) {
      const i = from * SLOT_COLS + col;
      if (gone.has(i)) continue;
      out[row * SLOT_COLS + col] = grid[i];
      fall[row * SLOT_COLS + col] = row - from;
      row--;
    }
    // `row + 1` cells are missing: new ones fall in from above the grid.
    for (const missing = row + 1; row >= 0; row--) {
      out[row * SLOT_COLS + col] = next();
      fall[row * SLOT_COLS + col] = missing;
    }
  }
  return { grid: out, fall };
}

export interface SlotStep {
  grid: number[];
  /** Rows each cell fell to reach this grid. */
  fall: number[];
  wins: SlotWin[];
  /** Cascade multiplier applied to this step's wins. */
  mult: number;
}

/**
 * A whole spin: the opening grid, then one step per cascade until a grid has
 * no win. The last step never has wins.
 */
export function slotSpin(next = slotSymbol): SlotStep[] {
  let grid = Array.from({ length: SLOT_ROWS * SLOT_COLS }, next);
  let fall = new Array<number>(grid.length).fill(SLOT_ROWS);
  const steps: SlotStep[] = [];
  for (let mult = 1; ; mult = Math.min(mult + 1, SLOT_MAX_MULT)) {
    const wins = slotWins(grid);
    steps.push({ grid, fall, wins, mult });
    if (!wins.length) return steps;
    ({ grid, fall } = slotDrop(grid, wins.flatMap((win) => win.cells), next));
  }
}

/** What one chip staked returns for one step of a spin. */
export const slotStepReturn = (step: SlotStep) =>
  step.wins.reduce((sum, win) => sum + win.pays * (win.jackpot ? 1 : step.mult), 0);

/** What one chip staked returns over a whole spin. */
export const slotReturn = (steps: SlotStep[]) => steps.reduce((sum, step) => sum + slotStepReturn(step), 0);

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
 *
 * Inside bets are "n" plus the numbers covered, joined by "-": "n17" straight,
 * "n17-18" split, "n16-17-18" street, "n17-18-20-21" corner. They all return
 * 36 / numbers covered (36, 18, 12, 9), so one rule pays every one of them.
 *
 * Outside bets: red, black, even, odd, low, high, d1..d3 (dozens) and c1..c3
 * (columns: c1 is 1, 4, 7…). Zero loses every outside bet.
 */
export function spotReturn(spot: string, n: number): number {
  if (spot[0] === "n") {
    const covered = spot.slice(1).split("-").map(Number);
    return covered.includes(n) ? 36 / covered.length : 0;
  }
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
    case "c1":
    case "c2":
    case "c3":
      return ((n - 1) % 3) + 1 === Number(spot[1]) ? 3 : 0;
  }
  return 0;
}

/**
 * What has been coming up: the numbers seen at least twice (most frequent
 * first, at most five), and how many results fell in each dozen and column.
 * `history` is newest first, so ties go to the more recent number.
 */
export function rouletteStats(history: number[]): { hot: { n: number; count: number }[]; dozens: number[]; columns: number[] } {
  const counts = new Map<number, number>();
  const dozens = [0, 0, 0];
  const columns = [0, 0, 0];
  for (const n of history) {
    counts.set(n, (counts.get(n) ?? 0) + 1);
    if (n === 0) continue; // zero belongs to no dozen or column
    dozens[Math.ceil(n / 12) - 1]++;
    columns[(n - 1) % 3]++;
  }
  const hot = [...counts]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1]) // stable: equal counts keep newest-first order
    .slice(0, 5)
    .map(([n, count]) => ({ n, count }));
  return { hot, dozens, columns };
}

/** Total chips returned for a table of bets ({ spot: stake }). */
export function rouletteReturn(bets: Record<string, number>, n: number): number {
  return Object.entries(bets).reduce((sum, [spot, stake]) => sum + stake * spotReturn(spot, n), 0);
}
