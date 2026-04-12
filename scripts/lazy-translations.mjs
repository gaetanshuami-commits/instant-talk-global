/**
 * Transforms translations.ts so that all 21 non-fr/en language mergeDeep calls
 * are lazy (executed only on first access) instead of running at module load time.
 *
 * Run: node scripts/lazy-translations.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, "../src/lib/i18n/translations.ts");

const LAZY_LANGS = [
  "es","de","it","pt","nl","zh","ja","ar",
  "ko","hi","tr","ru","pl","sv","el","cs","ro","hu","sw","th","vi",
];

const original = readFileSync(SRC, "utf8");
const lines = original.split("\n");

// ── Track start/end lines of each language block ──────────────────────────────
const blockMap = new Map(); // lang → { start, end }

for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(/^const (\w+) = mergeDeep\(en, \{$/);
  if (m && LAZY_LANGS.includes(m[1])) {
    blockMap.set(m[1], { start: i, end: -1 });
  }
}

for (const [lang, block] of blockMap.entries()) {
  for (let i = block.start + 1; i < lines.length; i++) {
    if (lines[i] === "});") {
      block.end = i;
      break;
    }
    if (/^const \w+ = mergeDeep\(en,/.test(lines[i]) && i !== block.start) break;
  }
  if (block.end === -1) {
    console.error(`Could not find closing }); for language: ${lang} (started line ${block.start + 1})`);
    process.exit(1);
  }
}

const startLines = new Set([...blockMap.values()].map((b) => b.start));
const endLines   = new Set([...blockMap.values()].map((b) => b.end));

// ── Find export block ─────────────────────────────────────────────────────────
let exportLineIdx = -1;
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].startsWith("export const translations = {")) {
    exportLineIdx = i;
    break;
  }
}
if (exportLineIdx === -1) {
  console.error("Could not find 'export const translations = {' line");
  process.exit(1);
}

// Find end of export block (first `};` at col 0 after exportLineIdx, or last line)
let exportEndIdx = -1;
for (let i = exportLineIdx + 1; i < lines.length; i++) {
  if (lines[i].trim() === "};") { exportEndIdx = i; break; }
}
if (exportEndIdx === -1) {
  // single-line or ends the file
  exportEndIdx = lines.length - 1;
}
console.log(`Export block: lines ${exportLineIdx + 1}–${exportEndIdx + 1}`);

// ── Lazy export block (TypeScript) ────────────────────────────────────────────
const lazyExport = `// ── Lazy translation cache ─────────────────────────────────────────────────
// fr and en are always available. The 21 other languages are merged with
// mergeDeep only on first access, removing 21 eager calls at module init.
const _transCache: Partial<Record<LanguageCode, typeof fr>> = {};

const _overrideFactories: Partial<Record<LanguageCode, () => Record<string, unknown>>> = {
  es: () => esOverrides, de: () => deOverrides, it: () => itOverrides,
  pt: () => ptOverrides, nl: () => nlOverrides, zh: () => zhOverrides,
  ja: () => jaOverrides, ar: () => arOverrides, ko: () => koOverrides,
  hi: () => hiOverrides, tr: () => trOverrides, ru: () => ruOverrides,
  pl: () => plOverrides, sv: () => svOverrides, el: () => elOverrides,
  cs: () => csOverrides, ro: () => roOverrides, hu: () => huOverrides,
  sw: () => swOverrides, th: () => thOverrides, vi: () => viOverrides,
};

function _getLang(lang: LanguageCode): typeof fr {
  if (lang === "fr") return fr;
  if (lang === "en") return en;
  if (_transCache[lang]) return _transCache[lang]!;
  const factory = _overrideFactories[lang];
  if (factory) {
    _transCache[lang] = mergeDeep(en, factory()) as typeof fr;
    return _transCache[lang]!;
  }
  return en;
}

export const translations = (() => {
  const obj = {} as Record<LanguageCode, typeof fr>;
  const langs: LanguageCode[] = [
    "fr","en","es","de","it","pt","nl","zh","ja","ar",
    "ko","hi","tr","ru","pl","sv","el","cs","ro","hu","sw","th","vi",
  ];
  for (const l of langs) {
    Object.defineProperty(obj, l, {
      get() { return _getLang(l); },
      enumerable: true,
      configurable: true,
    });
  }
  return obj;
})();`;

// ── Rebuild lines ─────────────────────────────────────────────────────────────
const langByStart = new Map([...blockMap.entries()].map(([lang, b]) => [b.start, lang]));
const out = [];
let i = 0;

while (i < lines.length) {
  if (i >= exportLineIdx && i <= exportEndIdx) {
    if (i === exportLineIdx) out.push(lazyExport);
    i++;
    continue;
  }

  if (startLines.has(i)) {
    const lang = langByStart.get(i);
    out.push(`const ${lang}Overrides = {`);
    i++;
    continue;
  }

  if (endLines.has(i)) {
    out.push("}");
    i++;
    continue;
  }

  out.push(lines[i]);
  i++;
}

writeFileSync(SRC, out.join("\n"), "utf8");
console.log(`Done. translations.ts updated — ${LAZY_LANGS.length} languages are now lazy.`);
