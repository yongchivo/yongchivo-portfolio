// Browser-side helpers shared by the games: the play-money chip balance, card
// rendering, the bet selector and the win burst.
import { cardLabel, isRedSuit, rankLabel, SUITS, type Card } from "./logic";

const KEY = "yc-games-chips";
export const START_CHIPS = 1000;
// Fallback balance when localStorage is blocked (private windows, strict settings).
let memory = START_CHIPS;

export function getChips(): number {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== null && Number.isFinite(Number(raw))) return Number(raw);
  } catch {}
  return memory;
}

export function setChips(n: number) {
  memory = n;
  try {
    localStorage.setItem(KEY, String(n));
  } catch {}
  window.dispatchEvent(new CustomEvent("yc-chips", { detail: n }));
}

export const addChips = (delta: number) => setChips(getChips() + delta);

export const fmt = (n: number) => n.toLocaleString(document.documentElement.lang || "en");
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A playing card; null renders it face down. */
export function cardEl(card: Card | null): HTMLElement {
  const el = document.createElement("span");
  el.className = "pcard";
  el.dataset.c = card ? cardLabel(card) : "";
  if (!card) {
    el.classList.add("back");
    return el;
  }
  if (isRedSuit(card)) el.classList.add("red");
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", cardLabel(card));
  const rank = document.createElement("b");
  rank.textContent = rankLabel(card.r);
  const suit = document.createElement("span");
  suit.textContent = SUITS[card.s];
  el.append(rank, suit);
  return el;
}

/**
 * Makes `el` show `cards` (index `hidden` face down), touching only the cards
 * that changed so the ones already on the table don't re-animate.
 */
export function showCards(el: Element, cards: Card[], hidden = -1) {
  cards.forEach((card, i) => {
    const want = i === hidden ? "" : cardLabel(card);
    const current = el.children[i] as HTMLElement | undefined;
    if (current?.dataset.c === want) return;
    const next = cardEl(i === hidden ? null : card);
    if (current) current.replaceWith(next);
    else el.append(next);
  });
  while (el.children.length > cards.length) el.lastElementChild!.remove();
}

/** Wires the chip row inside `root`; returns a getter for the selected value. */
export function initBet(root: Element): () => number {
  const buttons = [...root.querySelectorAll<HTMLButtonElement>("[data-chip]")];
  let value = Number(buttons[0].dataset.chip);
  const select = (button: HTMLButtonElement) => {
    value = Number(button.dataset.chip);
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
  };
  buttons.forEach((b) => b.addEventListener("click", () => select(b)));
  select(buttons[0]);
  return () => value;
}

/** Confetti from the centre of `at`. Skipped when motion is reduced. */
export function burst(at: Element, count = 22) {
  if (reducedMotion()) return;
  const box = at.getBoundingClientRect();
  const colors = ["#d946ef", "#22d3ee", "#fbbf24", "#a855f7"];
  for (let i = 0; i < count; i++) {
    const bit = document.createElement("i");
    bit.className = "fx-bit";
    bit.style.cssText =
      `left:${box.left + box.width / 2}px;top:${box.top + box.height / 2}px;` +
      `--dx:${(Math.random() - 0.5) * 320}px;--dy:${-Math.random() * 240 - 40}px;` +
      `--rot:${Math.random() * 720 - 360}deg;background:${colors[i % colors.length]}`;
    bit.addEventListener("animationend", () => bit.remove());
    document.body.append(bit);
  }
}

/** Sets a result line and replays its pop-in animation. */
export function say(el: HTMLElement, text: string, tone: "win" | "lose" | "" = "") {
  el.textContent = text;
  el.className = `result ${tone}`;
  void el.offsetWidth; // restart the animation
  el.classList.add("pop");
}
