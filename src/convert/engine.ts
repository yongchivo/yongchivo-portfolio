// The shared, client-side conversion engine.
//
// Everything here runs in the browser. No file ever touches a network — that
// privacy promise is the whole point of the tool, so keep it that way: never
// add a fetch/upload path to this module.
//
// Extensibility: `convertFile` dispatches on `conversion.kind`. Today the only
// kind is "image" (canvas-based, with a WASM decode step for HEIC). To add
// CSV/JSON, PDF or audio later, add a new kind in ./registry.ts and a matching
// branch here — the UI, routing and SEO layers don't need to change.

import type { Conversion } from "./registry";

export interface ConversionResult {
  blob: Blob;
  filename: string;
}

/** Swap a filename's extension, preserving the rest of the name. */
function withExtension(name: string, ext: string): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  return `${base}.${ext}`;
}

/** True if `file` is a plausible input for `conversion` (by extension or MIME). */
export function accepts(conversion: Conversion, file: File): boolean {
  const lower = file.name.toLowerCase();
  const byExt = conversion.sourceExts.some((ext) => lower.endsWith(`.${ext}`));
  const byMime =
    !!file.type && conversion.sourceMimes.includes(file.type.toLowerCase());
  return byExt || byMime;
}

/** A decoded image ready to be painted onto an output canvas. */
interface DecodedSource {
  width: number;
  height: number;
  drawTo(ctx: CanvasRenderingContext2D): void;
  dispose(): void;
}

/** Formats the browser can decode natively (PNG/JPG/WebP). */
async function decodeNative(file: Blob): Promise<DecodedSource> {
  const bitmap = await createImageBitmap(file);
  return {
    width: bitmap.width,
    height: bitmap.height,
    drawTo: (ctx) => ctx.drawImage(bitmap, 0, 0),
    dispose: () => bitmap.close?.(),
  };
}

/**
 * HEIC decoding via the libheif WebAssembly build. Loaded on demand, so the
 * ~1 MB decoder only ships to the two HEIC pages — every other converter stays
 * lightweight. The WASM binary is inlined into the bundle, so nothing is
 * fetched over the network: decoding stays fully offline and private.
 */
async function decodeHeic(file: Blob): Promise<DecodedSource> {
  const factory = (
    await import("libheif-js/libheif-wasm/libheif-bundle.mjs")
  ).default;
  const libheif = await factory();

  const bytes = new Uint8Array(await file.arrayBuffer());
  const decoder = new libheif.HeifDecoder();
  const images = decoder.decode(bytes);
  if (!images || images.length === 0) {
    throw new Error("No image found in this HEIC file");
  }

  const image = images[0];
  const width = image.get_width();
  const height = image.get_height();

  // libheif paints RGBA into an ImageData; render it to an offscreen canvas
  // that the shared encode step can then draw from.
  const source = document.createElement("canvas");
  source.width = width;
  source.height = height;
  const sctx = source.getContext("2d");
  if (!sctx) throw new Error("Canvas 2D context unavailable");
  const imageData = sctx.createImageData(width, height);

  await new Promise<void>((resolve, reject) => {
    image.display(imageData, (out: ImageData | null) =>
      out ? resolve() : reject(new Error("Could not decode this HEIC file"))
    );
  });
  sctx.putImageData(imageData, 0, 0);
  images.forEach((img: { free?: () => void }) => img.free?.());

  return {
    width,
    height,
    drawTo: (ctx) => ctx.drawImage(source, 0, 0),
    dispose: () => {},
  };
}

async function decodeSource(
  file: Blob,
  strategy: Conversion["decode"]
): Promise<DecodedSource> {
  return strategy === "heic" ? decodeHeic(file) : decodeNative(file);
}

async function convertImage(
  file: File,
  conversion: Conversion,
  quality: number
): Promise<ConversionResult> {
  const source = await decodeSource(file, conversion.decode);

  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  // JPG has no alpha channel: flatten transparency onto white so it doesn't
  // come out black.
  if (conversion.targetMime === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  source.drawTo(ctx);
  source.dispose();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) =>
        b ? resolve(b) : reject(new Error("This browser could not encode the image")),
      conversion.targetMime,
      conversion.lossy ? quality : undefined
    );
  });

  return { blob, filename: withExtension(file.name, conversion.targetExt) };
}

export interface ConvertOptions {
  /** 0–1, used only for lossy targets (JPG/WebP). Defaults to 0.92. */
  quality?: number;
}

/** Convert a single file according to a registry entry. */
export async function convertFile(
  file: File,
  conversion: Conversion,
  options: ConvertOptions = {}
): Promise<ConversionResult> {
  const quality = options.quality ?? 0.92;
  switch (conversion.kind) {
    case "image":
      return convertImage(file, conversion, quality);
    default:
      // Exhaustiveness guard: a new kind must add its branch above.
      throw new Error(`Unsupported conversion kind: ${(conversion as Conversion).kind}`);
  }
}
