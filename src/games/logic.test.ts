// Run: node src/games/logic.test.ts
import assert from "node:assert/strict";
import {
  bjReturn,
  bjValue,
  cardLabel,
  newDeck,
  pocketColor,
  pokerHand,
  rouletteReturn,
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

// poker hands
assert.equal(pokerHand(h("10S JS QS KS AS")), "royal");
assert.equal(pokerHand(h("9S 10S JS QS KS")), "straightFlush");
assert.equal(pokerHand(h("AS 2S 3S 4S 5S")), "straightFlush"); // wheel
assert.equal(pokerHand(h("9S 9H 9D 9C KS")), "four");
assert.equal(pokerHand(h("9S 9H 9D KC KS")), "fullHouse");
assert.equal(pokerHand(h("2S 9S 4S KS JS")), "flush");
assert.equal(pokerHand(h("AS 2H 3D 4C 5S")), "straight");
assert.equal(pokerHand(h("10S JH QD KC AS")), "straight");
assert.equal(pokerHand(h("QS KH AD 2C 3S")), null); // no wrap-around
assert.equal(pokerHand(h("9S 9H 9D 2C KS")), "three");
assert.equal(pokerHand(h("9S 9H 2D 2C KS")), "twoPair");
assert.equal(pokerHand(h("JS JH 2D 5C KS")), "jacks");
assert.equal(pokerHand(h("10S 10H 2D 5C KS")), null); // low pair pays nothing
assert.equal(pokerHand(h("2S 7H 9D JC KS")), null);

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

console.log("games logic ok");
