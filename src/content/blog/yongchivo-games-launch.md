---
title: "YCGames: six browser games, play money only, no dependencies"
description: "I added a games section to yongchivo.com: bubble pop, blackjack, Texas hold'em, roulette, a cascade slot and collectible card packs, in English and Spanish. No canvas, no game engine, no new dependencies — just buttons, CSS animations and a file of rules I can test with one command."
pubDate: "Nov 23 2026"
heroImage: "/games-cover.webp"
tags: ["astro", "web-development", "javascript", "css", "learning-in-public"]
badge: "WEB DEVELOPMENT"
---

Everything on this site so far has been useful: security tools, a file converter, an analytics dashboard. This one isn't. **[YCGames](/games/)** — YC for Yongchivo — is a small corner of the site for a quick round of something.

## What's live

- **[Bubble Pop](/games/bubbles/)** — 30 seconds, pop everything. Five in a row raises your multiplier (up to ×5), a miss resets it, and golden bubbles are worth five times as much.
- **[Blackjack](/games/blackjack/)** — hit, stand or double down. The dealer stands on 17 and a natural pays 3:2.
- **[Texas Hold'em](/games/poker/)** — heads-up against the dealer: ante, see the flop, then call or fold. The winning five cards light up at the showdown.
- **[Roulette](/games/roulette/)** — European, single zero: straight numbers, splits, streets, corners, columns, dozens and the even-money bets.
- **[Cascade Slot](/games/slots/)** — five reels of five symbols that spin down and stop one by one. Three or more in a row on the centre payline pay, and so do seven or more anywhere; winners pop and their reels spin again with a climbing multiplier. Five Yongchivo Ys on the payline pay the ×500 jackpot.
- **[Card Packs](/games/packs/)** — spend chips on packs of five and collect 30 cyber-security cards across four rarities, from the everyday Firewall to the legendary Y. Duplicates give chips back.

All six are in English and Spanish (under `/es/games/`), free, and need no account.

## Play money, and only play money

The four casino games and the card packs share one balance of chips. You start with 1,000, and when you run out there's a refill button. That's the whole economy: the balance is a number in your browser's `localStorage`. There is no backend, no account, nothing to buy and nothing to win — and each page says so.

That was a decision, not a shortcut. I wanted the satisfying parts of these games — the card flip, the wheel slowing down, the number going up — without any of the parts that cost people money.

## How it's built

I built it with Astro, with Claude Code as my development hands, and **added no dependencies**.

**The rules are one file of pure functions.** Hand totals, poker hand ranking, roulette payouts, the slot's cascades and the shuffle live in a single module with no DOM in it. That means the check is one command — `node src/games/logic.test.ts` — with plain `assert` calls and no test framework. It covers the cases that are easy to get wrong: an ace that has to drop from 11 to 1, the A-2-3-4-5 straight losing to a six-high one, a kicker deciding between two equal pairs, zero losing every outside bet.

**The shuffle uses `crypto.getRandomValues`.** Nothing rides on it with play money, but it's the same number of lines as `Math.random()` and it's the habit I'd rather have.

**Bubble Pop has no canvas and no frame loop.** Every bubble is a real `<button>` rising on a CSS animation. A timer spawns them, a click pops them, and the `animationend` event tells the game one got away. Because they're buttons, the game works from the keyboard too.

**The roulette wheel is a static SVG.** Astro draws all 37 pockets at build time from the wheel's pocket order; the script's only job is to rotate it so the winning pocket stops under the pointer. The betting table is one set of buttons that CSS grid lays out as three columns on a phone and the classic 12×3 on a wide screen, using two custom properties per number. Splits, streets and corners are small buttons sitting on the edge or corner the numbers share, and they all pay by one rule: 36 divided by the numbers covered.

**The slot is decided before it moves.** One function plays the whole spin — the opening grid and every cascade after it — and returns the steps; the page only animates them. That made the paytable something I could tune: I simulated several hundred thousand spins per paytable until it returned about 94% of what's staked — roughly a quarter of that from the payline, which hits about one spin in 24, with the jackpot around one in 18,000 — and the test file fails if a later change drifts far from that. The reels are plain DOM too: each one is a strip of symbols slid down with the Web Animations API, and the backdrop is a landscape I drew as SVG, so there is no image to license.

**The hub is a menu, not a page I maintain.** Games and their categories are entries in a registry. The hub, the pages in both languages, the "more games" links and the sitemap all come from it — a new game is one entry and one component.

## The parts I kept honest

- **The roulette's "hot numbers" are labelled for what they are.** The table shows which numbers and zones have come up most in your last 100 spins, next to a line saying every spin is independent of the ones before. It's a history, not a prediction.
- **Reduced motion is respected.** Confetti, card deals and the wheel spin are skipped if your system asks for less motion. Bubble Pop is the exception, since the motion *is* the game — and you start it yourself.
- **The security headers didn't move.** No third-party code and nothing loaded from another origin, so the Content Security Policy is exactly what it was.
- **What isn't there:** sound, splitting or insurance in blackjack, and other players at the poker table — it's you against the dealer.

Go [lose some imaginary chips](/games/).
