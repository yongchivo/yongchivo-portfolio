// Audio + video conversion via FFmpeg.wasm — 100% client-side.
//
// Uses the SINGLE-THREADED @ffmpeg/core on purpose: it needs no SharedArrayBuffer,
// so the site needs NO COOP/COEP cross-origin-isolation headers (which would
// break the other converters' cross-origin cover images and the strict CSP).
// Slower than the multi-threaded core, but it keeps the rest of yongchivo.com
// and the CSP completely untouched — same trade as v4 pdf.js and libheif.
//
// Asset hosting (Cloudflare Pages caps a single static file at 25 MiB, and the
// wasm is ~32 MiB, so it can't be a Pages asset):
//   - ffmpeg-core.js  (111 KB glue) stays SAME-ORIGIN as a committed Pages asset
//     at /ffmpeg-core.js. The FFmpeg worker loads it with `import(coreURL)`,
//     which is a SCRIPT load — keeping it same-origin means script-src 'self'
//     covers it and no script-src change is needed.
//   - ffmpeg-core.wasm (~32 MiB) is served from our own Cloudflare R2 bucket on
//     assets.yongchivo.com. The core FETCHES it (connect-src), so the only CSP
//     change is adding https://assets.yongchivo.com to connect-src.
// We pass coreURL/wasmURL directly (NOT @ffmpeg/util toBlobURL, which would make
// a blob: script and violate CSP). No CDN, no blob:. Core glue audited clean
// (no eval / no new Function / no createObjectURL); wasm instantiation is
// covered by the existing 'wasm-unsafe-eval'. Single-threaded core -> no
// SharedArrayBuffer -> no COOP/COEP. Loaded on FIRST USE only.
//
// The committed /ffmpeg-core.js MUST stay the same @ffmpeg/core version as the
// wasm on R2 (currently 0.12.10) — refresh both together if you ever bump it.

import type { Conversion } from "./registry";
import type { ConversionResult } from "./engine";

const CORE_URL = "/ffmpeg-core.js";
const WASM_URL = "https://assets.yongchivo.com/ffmpeg-core.wasm";

type FFmpegInstance = import("@ffmpeg/ffmpeg").FFmpeg;

// One shared FFmpeg instance per page: the 32 MB core is loaded once, lazily.
let ffmpegPromise: Promise<FFmpegInstance> | undefined;
// convertMedia points this at its own progress callback for the current run.
let activeProgress: ((ratio: number) => void) | undefined;

async function getFFmpeg(): Promise<FFmpegInstance> {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const ffmpeg = new FFmpeg();
      ffmpeg.on("progress", ({ progress }: { progress: number }) => {
        if (activeProgress && Number.isFinite(progress)) {
          activeProgress(Math.max(0, Math.min(1, progress)));
        }
      });
      await ffmpeg.load({ coreURL: CORE_URL, wasmURL: WASM_URL });
      return ffmpeg;
    })();
  }
  return ffmpegPromise;
}

export interface MediaOptions {
  /** gif only: frames per second. */
  fps?: number;
  /** gif only: output width in px (height auto). */
  width?: number;
  /** Called with "loading" (first-time core download) then "running". */
  onStatus?: (phase: "loading" | "running") => void;
  /** Called with 0..1 while ffmpeg runs (may be absent for some inputs). */
  onProgress?: (ratio: number) => void;
}

/** Build the ffmpeg argument list from the target format. */
function buildArgs(
  conversion: Conversion,
  input: string,
  output: string,
  opts: MediaOptions
): string[] {
  switch (conversion.targetExt) {
    case "mp3":
      // -vn drops any video stream, so this also extracts audio from MP4.
      return ["-i", input, "-vn", "-c:a", "libmp3lame", "-q:a", "2", output];
    case "wav":
      return ["-i", input, "-vn", "-c:a", "pcm_s16le", output];
    case "mp4":
      // ultrafast keeps wasm transcode times sane; aac audio for wide support.
      return [
        "-i", input,
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "28",
        "-c:a", "aac", "-b:a", "128k",
        output,
      ];
    case "webm":
      // VP8/Vorbis is far faster than VP9/Opus under wasm.
      return ["-i", input, "-c:v", "libvpx", "-b:v", "1M", "-c:a", "libvorbis", output];
    case "gif": {
      const fps = opts.fps && opts.fps > 0 ? Math.round(opts.fps) : 12;
      const width = opts.width && opts.width > 0 ? Math.round(opts.width) : 480;
      return ["-i", input, "-vf", `fps=${fps},scale=${width}:-1:flags=lanczos`, output];
    }
    default:
      throw new Error(`No FFmpeg recipe for target .${conversion.targetExt}`);
  }
}

/** Convert one audio/video file. Throws a friendly message on failure. */
export async function convertMedia(
  file: File,
  conversion: Conversion,
  opts: MediaOptions = {}
): Promise<ConversionResult> {
  opts.onStatus?.("loading");
  const ffmpeg = await getFFmpeg();

  const inName = `input.${conversion.sourceExts[0]}`;
  const outName = `output.${conversion.targetExt}`;

  try {
    await ffmpeg.writeFile(inName, new Uint8Array(await file.arrayBuffer()));
  } catch {
    throw new Error("Couldn't read this file — it may be corrupted.");
  }

  opts.onStatus?.("running");
  activeProgress = opts.onProgress;
  try {
    await ffmpeg.exec(buildArgs(conversion, inName, outName, opts));
  } catch {
    // exec throws when ffmpeg aborts (e.g. a decoder ran out of memory).
    throw new Error(
      "The conversion failed — the file may be too large or use an unsupported codec."
    );
  } finally {
    activeProgress = undefined;
  }

  let data: Uint8Array;
  try {
    data = (await ffmpeg.readFile(outName)) as Uint8Array;
  } catch {
    // No output file -> ffmpeg couldn't handle the input.
    throw new Error(
      "This file couldn't be converted — it may use an unsupported codec or be corrupted."
    );
  } finally {
    // Free the in-memory files so repeat conversions don't accumulate.
    await ffmpeg.deleteFile(inName).catch(() => {});
    await ffmpeg.deleteFile(outName).catch(() => {});
  }

  if (!data || data.length === 0) {
    throw new Error(
      "The conversion produced an empty file — the input may use an unsupported codec."
    );
  }

  const blob = new Blob([data], { type: conversion.targetMime });
  const base = file.name.replace(/\.[^.]+$/, "");
  return { blob, filename: `${base}.${conversion.targetExt}` };
}
