/**
 * Generate all app store assets from SVG source files.
 * Uses sharp (root node_modules) — no extra install required.
 *
 * Run from apps/mobile/:
 *   node scripts/generate-assets.mjs
 */

import { createRequire } from "module";
import { readFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require    = createRequire(import.meta.url);

// Sharp lives in root node_modules (used by Next.js image optimization)
const sharpPath = resolve(__dirname, "../../../node_modules/sharp");
const sharp = require(sharpPath);

const ASSETS = resolve(__dirname, "../assets");

async function svgToPng(svgFile, outFile, width, height) {
  const svg = readFileSync(resolve(ASSETS, svgFile));
  await sharp(svg)
    .resize(width, height, { fit: "fill" })
    .png({ compressionLevel: 9, palette: false })
    .toFile(resolve(ASSETS, outFile));
  console.log(`✓ ${outFile}  (${width}×${height})`);
}

async function main() {
  mkdirSync(ASSETS, { recursive: true });

  // ── App icon (with dark background, for iOS + Web) ──
  await svgToPng("icon.svg",    "icon.png",    1024, 1024);

  // ── Android adaptive icon foreground (transparent bg) ──
  await svgToPng("icon-fg.svg", "adaptive-icon.png", 1024, 1024);

  // ── Splash screen ──
  await svgToPng("splash.svg",  "splash.png",  1284, 2778);

  // ── Favicon (small, derive from icon) ──
  await svgToPng("icon.svg",    "favicon.png",   48,   48);

  // ── Notification icon (white logo, Android) ──
  // Simple: derive from foreground icon, tint to white
  const fgSvg = readFileSync(resolve(ASSETS, "icon-fg.svg"), "utf8");
  // Replace all color fills with white for a monochrome notification icon
  const whiteSvg = fgSvg
    .replace(/stop-color="#[^"]+"/g, 'stop-color="#ffffff"')
    .replace(/fill="url\([^)]+\)"/g, 'fill="#ffffff"')
    .replace(/fill="rgba\(255,255,255,[^)]+\)"/g, 'fill="rgba(255,255,255,0.9)"');

  const buf = Buffer.from(whiteSvg);
  await sharp(buf)
    .resize(96, 96, { fit: "fill" })
    .png()
    .toFile(resolve(ASSETS, "notification-icon.png"));
  console.log("✓ notification-icon.png  (96×96)");

  console.log("\nAll assets generated successfully.");
  console.log("Assets directory:", ASSETS);
}

main().catch((err) => {
  console.error("Error generating assets:", err.message);
  process.exit(1);
});
