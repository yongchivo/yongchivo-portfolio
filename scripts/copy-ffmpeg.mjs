// Copies the self-hosted, single-threaded FFmpeg core (js + wasm) from the
// pinned @ffmpeg/core dependency into public/ffmpeg/ so it is served
// same-origin (satisfies connect-src/script-src 'self' — no CDN, no blob).
// Runs as predev/prebuild; the ~32 MB wasm is gitignored, not committed.
import { mkdirSync, copyFileSync, existsSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = resolve(root, "node_modules/@ffmpeg/core/dist/esm");
const dest = resolve(root, "public/ffmpeg");
const files = ["ffmpeg-core.js", "ffmpeg-core.wasm"];

mkdirSync(dest, { recursive: true });
for (const f of files) {
  const from = resolve(src, f);
  const to = resolve(dest, f);
  if (!existsSync(from)) {
    console.error(`[copy-ffmpeg] missing ${from} — is @ffmpeg/core installed?`);
    process.exit(1);
  }
  // Skip if already up to date (same size) to keep dev restarts fast.
  if (existsSync(to) && statSync(to).size === statSync(from).size) continue;
  copyFileSync(from, to);
  console.log(`[copy-ffmpeg] ${f} -> public/ffmpeg/`);
}
