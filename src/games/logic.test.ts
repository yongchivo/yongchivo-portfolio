// Run: node src/games/logic.test.ts
import assert from "node:assert/strict";
import { CARDS, PACK_GUARANTEE, PACK_SIZE, RARITIES, rollPack } from "./cards.ts";
import {
  bestHand,
  bjReturn,
  bjValue,
  cardLabel,
  compareScores,
  newDeck,
  pocketColor,
  rouletteReturn,
  rouletteStats,
  score5,
  SLOT_COLS,
  SLOT_JACKPOT,
  SLOT_ROWS,
  SLOT_TOP,
  slotDrop,
  slotReturn,
  slotSpin,
  slotStepReturn,
  slotWins,
  WHEEL,
  type Card,
} from "./logic.ts";

// "AS KH 10D" -> cards
const SUIT = { S: 0, H: 1, D: 2, C: 3 } as const;
const RANK: Record<string, number> = { J: 11, Q: 12, K: 13, A: 14 };
const h = (text: string): Card[] =>
  text.split(" ").map((t) => ({
    r: RANK[t.slice(0, -1)] ?? Number(t.slice(0, -1)),
    s: SUIT[t.slice(-1) as keyof typeof SUIT],
  }));

// deck
const deck = newDeck();
assert.equal(new Set(deck.map(cardLabel)).size, 52);

// blackjack totals
assert.deepEqual(bjValue(h("AS KH")), { total: 21, soft: true });
assert.deepEqual(bjValue(h("AS AH 9D")), { total: 21, soft: true });
assert.deepEqual(bjValue(h("AS 9H 5D")), { total: 15, soft: false });
assert.deepEqual(bjValue(h("KS QH 5D")), { total: 25, soft: false });

// blackjack results
assert.equal(bjReturn(h("AS KH"), h("10S 9H")), 2.5); // natural
assert.equal(bjReturn(h("AS KH"), h("AD QH")), 1); // both natural
assert.equal(bjReturn(h("7S 7H 7D"), h("AD QH")), 0); // 21 loses to a natural
assert.equal(bjReturn(h("KS QH 5D"), h("KD QC 6D")), 0); // player busts first
assert.equal(bjReturn(h("KS 8H"), h("KD 6C 9D")), 2); // dealer busts
assert.equal(bjReturn(h("KS 8H"), h("KD 8C")), 1); // push
assert.equal(bjReturn(h("KS 7H"), h("KD 8C")), 0);

// poker: categories
const name = (text: string) => bestHand(h(text)).name;
assert.equal(name("10S JS QS KS AS"), "royal");
assert.equal(name("9S 10S JS QS KS"), "straightFlush");
assert.equal(name("AS 2S 3S 4S 5S"), "straightFlush"); // wheel
assert.equal(name("9S 9H 9D 9C KS"), "four");
assert.equal(name("9S 9H 9D KC KS"), "fullHouse");
assert.equal(name("2S 9S 4S KS JS"), "flush");
assert.equal(name("AS 2H 3D 4C 5S"), "straight");
assert.equal(name("QS KH AD 2C 3S"), "high"); // no wrap-around
assert.equal(name("9S 9H 9D 2C KS"), "three");
assert.equal(name("9S 9H 2D 2C KS"), "twoPair");
assert.equal(name("10S 10H 2D 5C KS"), "pair");

// poker: who wins
const beats = (a: string, b: string) => compareScores(score5(h(a)), score5(h(b)));
assert.ok(beats("9S 9H 9D KC KS", "2S 9S 4S KS JS") > 0); // full house over flush
assert.ok(beats("AS AH 3D 5C 8S", "KS KH QD JC 10S") > 0); // higher pair
assert.ok(beats("AS AH KD 5C 8S", "AD AC QD JC 10S") > 0); // same pair, kicker decides
assert.ok(beats("2S 3H 4D 5C 6S", "AS 2H 3D 4C 5S") > 0); // six-high beats the wheel
assert.ok(beats("9S 9H 2D 2C KS", "8S 8H 7D 7C AS") > 0); // top pair decides two pair
assert.equal(beats("AS KH 9D 5C 3S", "AD KC 9H 5S 3D"), 0); // suits never break ties

// poker: best five of seven (hole cards + board)
const seven = bestHand(h("AS AH 7D 7C 7S KD 2C"));
assert.equal(seven.name, "fullHouse");
assert.equal(seven.cards.length, 5);
assert.deepEqual(seven.score.slice(1), [7, 14]); // sevens full of aces
assert.equal(bestHand(h("2S 3S 9S KS JS AH AD")).name, "flush"); // flush over the pair of aces

// slot: SLOT_MIN (7) or more of a symbol anywhere pays
const cells = SLOT_ROWS * SLOT_COLS;
assert.equal(cells, 25);
// Rows of 0 1 2 3 4, then symbol 5 dropped onto the first `count` cells.
const gridWith = (count: number, symbol = 5) => Array.from({ length: cells }, (_, i) => (i < count ? symbol : i % 5));
assert.deepEqual(slotWins(gridWith(6)), []);
assert.deepEqual(slotWins(gridWith(7)), [{ symbol: 5, cells: [0, 1, 2, 3, 4, 5, 6], pays: 0.5 }]);
assert.equal(slotWins(gridWith(9))[0].pays, 1.5);
assert.equal(slotWins(gridWith(11))[0].pays, 8);

// slot: a straight line of five Ys is the jackpot, whatever else is on the grid
const withY = (line: number[]) => Array.from({ length: cells }, (_, i) => (line.includes(i) ? SLOT_TOP : i % 5));
const jackpot = (line: number[]) => [{ symbol: SLOT_TOP, cells: line, pays: SLOT_JACKPOT, jackpot: true }];
assert.deepEqual(slotWins(withY([5, 6, 7, 8, 9])), jackpot([5, 6, 7, 8, 9])); // row
assert.deepEqual(slotWins(withY([2, 7, 12, 17, 22])), jackpot([2, 7, 12, 17, 22])); // column
assert.deepEqual(slotWins(withY([0, 6, 12, 18, 24])), jackpot([0, 6, 12, 18, 24])); // diagonal
assert.deepEqual(slotWins(withY([4, 8, 12, 16, 20])), jackpot([4, 8, 12, 16, 20])); // other diagonal
assert.deepEqual(slotWins(withY([5, 6, 7, 8, 14])), []); // five Ys, but not in a line
// The jackpot is flat: the cascade multiplier only applies to the counted wins.
assert.equal(slotStepReturn({ grid: [], fall: [], mult: 3, wins: [...jackpot([0, 1, 2, 3, 4]), { symbol: 5, cells: [], pays: 8 }] }), SLOT_JACKPOT + 24);

// slot: removed cells let the column fall and refill from the top
const before = Array.from({ length: cells }, (_, i) => i % 5); // every column is one symbol
const dropped = slotDrop(before, [20, 15], () => 6); // bottom two cells of column 0
assert.deepEqual([0, 5, 10, 15, 20].map((i) => dropped.grid[i]), [6, 6, 0, 0, 0]);
assert.deepEqual([0, 5, 10, 15, 20].map((i) => dropped.fall[i]), [2, 2, 2, 2, 2]);
assert.deepEqual([1, 6, 11, 16, 21].map((i) => dropped.fall[i]), [0, 0, 0, 0, 0]); // untouched column

// slot: a spin ends on a grid with no win, and the multiplier climbs per cascade
let chain = 0;
const spin = slotSpin(() => (chain++ < cells ? 5 : chain % 5)); // opens full of 5s, refills with junk
assert.equal(spin.length, 2);
assert.deepEqual(spin.map((step) => step.mult), [1, 2]);
assert.equal(spin.at(-1)!.wins.length, 0);
assert.equal(slotReturn(spin), 8);

// slot: the paytable keeps its long-run return in a sane band (tuned to ~96%;
// the band is wide because the rare jackpot swings a short run)
let paid = 0;
const SPINS = 100000;
for (let i = 0; i < SPINS; i++) paid += slotReturn(slotSpin());
assert.ok(paid / SPINS > 0.8 && paid / SPINS < 1.12, `slot returns ${(paid / SPINS).toFixed(3)} per chip`);

// roulette
assert.equal(WHEEL.length, 37);
assert.equal(new Set(WHEEL).size, 37);
assert.equal(WHEEL.filter((n) => pocketColor(n) === "red").length, 18);
assert.equal(pocketColor(0), "green");
assert.equal(rouletteReturn({ n17: 10 }, 17), 360);
assert.equal(rouletteReturn({ n17: 10, red: 10, odd: 10, low: 10, d2: 10 }, 17), 360 + 0 + 20 + 20 + 30);
assert.equal(rouletteReturn({ red: 10, even: 10, low: 10, d1: 10 }, 0), 0);
assert.equal(rouletteReturn({ n0: 5 }, 0), 180);
assert.equal(rouletteReturn({ black: 10, high: 10, d3: 10 }, 36), 0 + 20 + 30); // 36 is red
assert.equal(rouletteReturn({ "n17-18": 10 }, 18), 180); // split 17:1
assert.equal(rouletteReturn({ "n17-18": 10 }, 19), 0);
assert.equal(rouletteReturn({ "n16-17-18": 10 }, 16), 120); // street 11:1
assert.equal(rouletteReturn({ "n17-18-20-21": 10 }, 20), 90); // corner 8:1
assert.equal(rouletteReturn({ c2: 10 }, 17), 30); // 17 is in the 2, 5, 8… column
assert.equal(rouletteReturn({ c1: 10, c3: 10 }, 36), 30);
assert.equal(rouletteReturn({ c1: 10, "n1-2-3": 10 }, 0), 0);

// roulette: hot numbers and zones (history is newest first)
const stats = rouletteStats([17, 5, 17, 0, 32, 5, 17, 8, 36]);
assert.deepEqual(stats.hot, [{ n: 17, count: 3 }, { n: 5, count: 2 }]); // seen once is not hot
assert.deepEqual(stats.dozens, [3, 3, 2]); // 5 5 8 | 17 17 17 | 32 36; zero in none
assert.deepEqual(stats.columns, [0, 7, 1]); // none | 17 5 17 32 5 17 8 | 36
assert.deepEqual(rouletteStats([]), { hot: [], dozens: [0, 0, 0], columns: [0, 0, 0] });

// card packs: a complete, well-formed set and well-formed packs
assert.equal(CARDS.length, 30);
assert.equal(new Set(CARDS.map((c) => c.id)).size, 30);
assert.ok(RARITIES.every((_, tier) => CARDS.some((c) => c.rarity === tier))); // no empty tier to roll into
assert.equal(RARITIES.reduce((sum, tier) => sum + tier.weight, 0), 100);
const tierCount = [0, 0, 0, 0];
for (let i = 0; i < 4000; i++) {
  const pack = rollPack();
  assert.equal(pack.length, PACK_SIZE);
  assert.ok(pack.every((index) => CARDS[index]));
  assert.ok(CARDS[pack.at(-1)!].rarity >= PACK_GUARANTEE); // the last card is rare or better
  for (const index of pack.slice(0, -1)) tierCount[CARDS[index].rarity]++;
}
// Open slots follow the weights: commons dominate, legendaries are a rare treat.
assert.ok(tierCount[0] > tierCount[1] && tierCount[1] > tierCount[2] && tierCount[2] > tierCount[3]);
assert.ok(tierCount[3] > 0 && tierCount[3] < 16000 * 0.03);

console.log("games logic ok");
