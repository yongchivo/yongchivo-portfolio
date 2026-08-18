// Date parsing for temporal exports.
//
// Platform exports disagree about date order and never say which one they used.
// App Store Connect writes MM/DD/YYYY in its US-default reports and DD/MM/YYYY
// under other account locales, and the two are indistinguishable row by row —
// 05/06/2026 is either. So the order is inferred ONCE from the whole column: a
// first component above 12 can only be a day, a second component above 12 can
// only be a day, and whichever appears first settles it for every row.

export type DateOrder = "ymd" | "mdy" | "dmy" | "text";

const ISO = /^(\d{4})-(\d{1,2})-(\d{1,2})/;
const SLASHED = /^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/;

/**
 * Work out the order used by a column of date strings. Falls back to "mdy",
 * which is what App Store Connect emits by default, when every row is ambiguous.
 */
export function detectDateOrder(samples: string[]): DateOrder {
  let sawSlashed = false;

  for (const raw of samples) {
    const value = raw?.trim();
    if (!value) continue;
    if (ISO.test(value)) return "ymd";

    const parts = SLASHED.exec(value);
    if (!parts) continue;
    sawSlashed = true;
    const first = Number(parts[1]);
    const second = Number(parts[2]);
    // Only one of these can be the day when it exceeds 12.
    if (first > 12) return "dmy";
    if (second > 12) return "mdy";
  }

  if (sawSlashed) return "mdy";
  // Nothing numeric matched; let Date handle "Jan 1, 2026" style values.
  return "text";
}

/** Parse one cell using a previously detected order. Returns null if unusable. */
export function parseDate(raw: string | undefined, order: DateOrder): Date | null {
  const value = raw?.trim();
  if (!value) return null;

  const iso = ISO.exec(value);
  if (iso) {
    return valid(new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
  }

  const parts = SLASHED.exec(value);
  if (parts) {
    const a = Number(parts[1]);
    const b = Number(parts[2]);
    const year = Number(parts[3]);
    // An out-of-range month means the detected order is wrong for this row, so
    // fall back to the other reading rather than producing a bogus date.
    const [month, day] = order === "dmy" || a > 12 ? [b, a] : [a, b];
    return valid(new Date(year, month - 1, day));
  }

  if (order === "text") {
    const parsed = new Date(value);
    // Construct in local time so the weekday rollup doesn't drift a day.
    if (!Number.isNaN(parsed.getTime())) {
      return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    }
  }
  return null;
}

function valid(date: Date): Date | null {
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Stable ISO day key (local time), used as the row key for temporal presets. */
export function isoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
