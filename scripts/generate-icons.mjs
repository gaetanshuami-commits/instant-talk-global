/**
 * generate-icons.mjs
 * Generates all Android launcher icons for InstantTalk Global.
 * Run: node scripts/generate-icons.mjs
 */

import sharp from "sharp";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const RES = "android/app/src/main/res";

// ── SVG design ────────────────────────────────────────────────────────────────
// Adaptive layer: 108×108dp (the background and foreground layers).
// We generate at 4× = 432×432 for xxxhdpi, then scale down for others.

/** Background layer — deep gradient violet → indigo */
function makeBgSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 432 432">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#7c6bff"/>
      <stop offset="55%"  stop-color="#635bff"/>
      <stop offset="100%" stop-color="#3d2dc4"/>
    </linearGradient>
  </defs>
  <rect width="432" height="432" fill="url(#bg)"/>
</svg>`;
}

/**
 * Foreground layer — white globe + mic-wave mark.
 * Safe zone = center 72dp = center 288px of the 432px canvas.
 * Icon is drawn inside ~220px circle, centred at (216,216).
 */
function makeFgSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 432 432">
  <!-- Globe outline -->
  <circle cx="216" cy="216" r="108" fill="none" stroke="white" stroke-width="14" opacity="0.95"/>

  <!-- Equator -->
  <line x1="108" y1="216" x2="324" y2="216" stroke="white" stroke-width="10" opacity="0.7"/>

  <!-- Prime meridian -->
  <line x1="216" y1="108" x2="216" y2="324" stroke="white" stroke-width="10" opacity="0.7"/>

  <!-- Left longitude arc -->
  <path d="M216,108 Q168,216 216,324" fill="none" stroke="white" stroke-width="9" opacity="0.55"/>

  <!-- Right longitude arc -->
  <path d="M216,108 Q264,216 216,324" fill="none" stroke="white" stroke-width="9" opacity="0.55"/>

  <!-- Speech-wave arcs (bottom-right) — represent "talk" -->
  <path d="M284,264 Q316,216 284,168" fill="none" stroke="white" stroke-width="13" stroke-linecap="round" opacity="0.9"/>
  <path d="M304,280 Q348,216 304,152" fill="none" stroke="white" stroke-width="10" stroke-linecap="round" opacity="0.6"/>

  <!-- Centre dot — focal point -->
  <circle cx="216" cy="216" r="18" fill="white" opacity="0.95"/>
</svg>`;
}

/** Legacy square icon (background + icon merged, rounded feel) */
function makeLegacySvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 192 192">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#7c6bff"/>
      <stop offset="55%"  stop-color="#635bff"/>
      <stop offset="100%" stop-color="#3d2dc4"/>
    </linearGradient>
    <clipPath id="clip">
      <rect width="192" height="192" rx="42" ry="42"/>
    </clipPath>
  </defs>
  <rect width="192" height="192" rx="42" ry="42" fill="url(#bg)"/>

  <!-- Globe outline -->
  <circle cx="96" cy="96" r="52" fill="none" stroke="white" stroke-width="7" opacity="0.95" clip-path="url(#clip)"/>
  <line x1="44" y1="96" x2="148" y2="96" stroke="white" stroke-width="5" opacity="0.7"/>
  <line x1="96" y1="44" x2="96" y2="148" stroke="white" stroke-width="5" opacity="0.7"/>
  <path d="M96,44 Q72,96 96,148"  fill="none" stroke="white" stroke-width="4" opacity="0.55"/>
  <path d="M96,44 Q120,96 96,148" fill="none" stroke="white" stroke-width="4" opacity="0.55"/>

  <!-- Speech-wave arcs -->
  <path d="M128,118 Q144,96 128,74"  fill="none" stroke="white" stroke-width="6"  stroke-linecap="round" opacity="0.9"/>
  <path d="M138,128 Q158,96 138,64" fill="none" stroke="white" stroke-width="5"  stroke-linecap="round" opacity="0.6"/>

  <!-- Centre dot -->
  <circle cx="96" cy="96" r="9" fill="white" opacity="0.95"/>
</svg>`;
}

/** Legacy ROUND icon */
function makeLegacyRoundSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 192 192">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#7c6bff"/>
      <stop offset="55%"  stop-color="#635bff"/>
      <stop offset="100%" stop-color="#3d2dc4"/>
    </linearGradient>
    <clipPath id="round-clip">
      <circle cx="96" cy="96" r="96"/>
    </clipPath>
  </defs>
  <circle cx="96" cy="96" r="96" fill="url(#bg)"/>

  <!-- Globe outline -->
  <circle cx="96" cy="96" r="52" fill="none" stroke="white" stroke-width="7" opacity="0.95"/>
  <line x1="44" y1="96" x2="148" y2="96" stroke="white" stroke-width="5" opacity="0.7"/>
  <line x1="96" y1="44" x2="96" y2="148" stroke="white" stroke-width="5" opacity="0.7"/>
  <path d="M96,44 Q72,96 96,148"  fill="none" stroke="white" stroke-width="4" opacity="0.55"/>
  <path d="M96,44 Q120,96 96,148" fill="none" stroke="white" stroke-width="4" opacity="0.55"/>

  <!-- Speech-wave arcs -->
  <path d="M128,118 Q144,96 128,74"  fill="none" stroke="white" stroke-width="6"  stroke-linecap="round" opacity="0.9"/>
  <path d="M138,128 Q158,96 138,64" fill="none" stroke="white" stroke-width="5"  stroke-linecap="round" opacity="0.6"/>

  <!-- Centre dot -->
  <circle cx="96" cy="96" r="9" fill="white" opacity="0.95"/>
</svg>`;
}

// ── Size tables ───────────────────────────────────────────────────────────────

// Adaptive layers: background + foreground per density (108dp × scale)
const ADAPTIVE_SIZES = [
  { dir: "mipmap-ldpi",    px: 81  },
  { dir: "mipmap-mdpi",    px: 108 },
  { dir: "mipmap-hdpi",    px: 162 },
  { dir: "mipmap-xhdpi",   px: 216 },
  { dir: "mipmap-xxhdpi",  px: 324 },
  { dir: "mipmap-xxxhdpi", px: 432 },
];

// Legacy icons: ic_launcher + ic_launcher_round (48dp × scale)
const LEGACY_SIZES = [
  { dir: "mipmap-ldpi",    px: 36  },
  { dir: "mipmap-mdpi",    px: 48  },
  { dir: "mipmap-hdpi",    px: 72  },
  { dir: "mipmap-xhdpi",   px: 96  },
  { dir: "mipmap-xxhdpi",  px: 144 },
  { dir: "mipmap-xxxhdpi", px: 192 },
];

// ── Generate ──────────────────────────────────────────────────────────────────

async function svgToPng(svgString, outputPath, width, height) {
  await sharp(Buffer.from(svgString))
    .resize(width, height)
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
  console.log(`  ✓  ${outputPath}`);
}

async function main() {
  console.log("\n🎨  Generating InstantTalk Global launcher icons…\n");

  for (const { dir, px } of ADAPTIVE_SIZES) {
    const dirPath = join(RES, dir);
    await svgToPng(makeBgSvg(px), join(dirPath, "ic_launcher_background.png"), px, px);
    await svgToPng(makeFgSvg(px), join(dirPath, "ic_launcher_foreground.png"), px, px);
  }

  for (const { dir, px } of LEGACY_SIZES) {
    const dirPath = join(RES, dir);
    await svgToPng(makeLegacySvg(px), join(dirPath, "ic_launcher.png"), px, px);
    await svgToPng(makeLegacyRoundSvg(px), join(dirPath, "ic_launcher_round.png"), px, px);
  }

  console.log("\n✅  All icons generated.\n");
}

main().catch((err) => { console.error(err); process.exit(1); });
