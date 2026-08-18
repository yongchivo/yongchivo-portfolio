// Preset catalogue for the analytics dashboard.
//
// This drives page generation (only "live" presets get a route), the landing
// grid and the widget's parser lookup — so adding App Store Connect or Play
// Console later is a new module next to ./gsc.ts plus one line in `presets`.
// Nothing else in the dashboard needs to change.

import type { Lang, Preset, PresetCopy } from "../types";
import { gsc } from "./gsc";

/**
 * A platform that has a card on the landing but no parser yet. Kept in the same
 * list as the real presets so the landing renders one grid, and so promoting it
 * later is a swap rather than a move.
 */
interface ComingSoon {
  id: string;
  status: "soon";
  copy: Record<Lang, Pick<PresetCopy, "cardTitle" | "cardDesc">>;
}

export const comingSoon: ComingSoon[] = [
  {
    id: "app-store-connect",
    status: "soon",
    copy: {
      en: {
        cardTitle: "App Store Connect",
        cardDesc:
          "Impressions, product page views and conversion rate from an App Analytics export — coming next.",
      },
      es: {
        cardTitle: "App Store Connect",
        cardDesc:
          "Impresiones, visitas a la ficha y tasa de conversión desde una exportación de App Analytics — próximamente.",
      },
    },
  },
];

export const presets: Preset[] = [gsc];

export function getPreset(id: string): Preset | undefined {
  return presets.find((p) => p.id === id);
}

/** Only these get a page of their own. */
export const livePresets = (): Preset[] => presets.filter((p) => p.status === "live");
