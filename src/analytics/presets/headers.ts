// Header matching shared by the presets.
//
// Every platform localises its export headers to the account language and
// varies its punctuation, so columns are matched against alias lists in a
// normalised form rather than compared literally.

/** Lower-case, unaccented, whitespace-collapsed — the form aliases are held in. */
export function normaliseHeader(header: string): string {
  return header
    .replace(/^\uFEFF/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036F]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ");
}

/** The first header matching any alias, or null. Aliases are already normalised. */
export function findColumn(headers: string[], aliases: readonly string[]): string | null {
  for (const alias of aliases) {
    const hit = headers.find((h) => normaliseHeader(h) === alias);
    if (hit) return hit;
  }
  return null;
}

/**
 * Looser match for platforms that decorate their headers — App Store Connect
 * writes "Impressions (Unique Devices)" and "Total Downloads" for what the
 * alias list calls "impressions" and "downloads".
 */
export function findColumnLoose(headers: string[], aliases: readonly string[]): string | null {
  const exact = findColumn(headers, aliases);
  if (exact) return exact;
  for (const alias of aliases) {
    const hit = headers.find((h) => {
      const n = normaliseHeader(h);
      return n.startsWith(`${alias} `) || n.startsWith(`${alias}(`) || n === alias;
    });
    if (hit) return hit;
  }
  return null;
}
