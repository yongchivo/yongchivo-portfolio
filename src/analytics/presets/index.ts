// Preset catalogue for the analytics dashboard.
//
// This drives page generation (only "live" presets get a route), the landing
// grid and the widget's parser lookup — so adding Play Console later is a new
// module next to ./app-store.ts plus one line in `presets`. Nothing else in the
// dashboard needs to change: the views a preset wants are declared on the
// preset itself.

import type { Preset } from "../types";
import { gsc } from "./gsc";
import { appStore } from "./app-store";

export const presets: Preset[] = [gsc, appStore];

export function getPreset(id: string): Preset | undefined {
  return presets.find((p) => p.id === id);
}

/** Only these get a page of their own. */
export const livePresets = (): Preset[] => presets.filter((p) => p.status === "live");

/** Presets holding a slot on the landing without a parser yet. */
export const soonPresets = (): Preset[] => presets.filter((p) => p.status === "soon");
