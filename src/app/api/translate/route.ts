import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

// Languages DeepL does NOT support — skip straight to Gemini for these
const DEEPL_UNSUPPORTED = new Set([
  "sw", "ln", "sw-KE",    // Swahili, Lingala
  "fil", "ms", "id",       // Filipino, Malay, Indonesian
  "th", "vi", "hi",        // Thai, Vietnamese, Hindi
])

// Map our UI lang codes to DeepL target codes
function toDeepLLang(lang: string): string {
  const code = lang.toUpperCase()
  if (code === "EN" || code === "EN-US") return "EN-US"
  if (code === "PT" || code === "PT-BR") return "PT-BR"
  if (code === "PT-PT") return "PT-PT"
  if (code === "ZH-HANS" || code === "ZH") return "ZH-HANS"
  if (code === "NO" || code === "NB") return "NB"  // Norwegian Bokmål
  return code
}

// Full language names for the Gemini prompt — more reliable than 2-letter codes
const LANG_NAMES: Record<string, string> = {
  fr: "French",           en: "English",          es: "Spanish",
  de: "German",           it: "Italian",           ru: "Russian",
  pl: "Polish",           nl: "Dutch",             pt: "Portuguese",
  ar: "Arabic",           ja: "Japanese",          ko: "Korean",
  hi: "Hindi",            tr: "Turkish",           zh: "Mandarin Chinese (Simplified)",
  "zh-Hans": "Mandarin Chinese (Simplified)",
  sw: "Swahili",          ro: "Romanian",          el: "Greek",
  sv: "Swedish",          hu: "Hungarian",         cs: "Czech",
  th: "Thai",             vi: "Vietnamese",        bg: "Bulgarian",
  da: "Danish",           fi: "Finnish",           sk: "Slovak",
  no: "Norwegian",        nb: "Norwegian",         ln: "Lingala",
}

// Wraps fetch with a hard timeout — prevents 30–60 s hangs when a provider is slow.
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 8000
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

// ── Gemini — primary translation engine (all 26+ languages) ──────────────────
async function translateWithGemini(text: string, targetLang: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error("Missing GEMINI_API_KEY")

  const langName = LANG_NAMES[targetLang.toLowerCase()] ?? targetLang
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`

  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `You are a professional translator. Translate the text below into ${langName}. Output ONLY the translated text — no commentary, no quotes, no explanation.\n\nText: ${text}`,
        }],
      }],
      generationConfig: { maxOutputTokens: 500, temperature: 0 },
    }),
  }, 4000)  // 4 s — suffisant pour une courte phrase

  if (!res.ok) {
    const err = await res.text().catch(() => "")
    throw new Error(`Gemini error ${res.status}: ${err.slice(0, 100)}`)
  }

  const data = await res.json()
  const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  if (!translated) throw new Error("Gemini returned empty translation")
  return translated
}

// ── DeepL — fast, high-quality for European languages ─────────────────────────
async function translateWithDeepL(text: string, targetLang: string): Promise<string> {
  const key = process.env.DEEPL_API_KEY
  if (!key) throw new Error("Missing DEEPL_API_KEY")

  const isFree = key.endsWith(":fx")
  const url    = isFree ? "https://api-free.deepl.com/v2/translate" : "https://api.deepl.com/v2/translate"

  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Authorization": `DeepL-Auth-Key ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text: [text], target_lang: toDeepLLang(targetLang) }),
  }, 3000)  // 3 s — DeepL est rapide, inutile d'attendre plus

  if (!res.ok) throw new Error(`DeepL error ${res.status}`)
  const data = await res.json()
  return data.translations[0].text
}

// ── Traduction d'une seule langue (fonction interne réutilisable) ─────────────
async function translateSingle(text: string, targetLang: string): Promise<string> {
  const normalized = targetLang.toLowerCase()
  if (DEEPL_UNSUPPORTED.has(normalized)) {
    return translateWithGemini(text, normalized)
  }
  try {
    return await translateWithDeepL(text, targetLang)
  } catch {
    return translateWithGemini(text, normalized)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // ── Mode batch : { text, targetLangs: string[] } ──────────────────────────
    // Toutes les langues sont traduites en parallèle côté serveur.
    // Retourne { translations: { fr: "...", en: "...", ... } }
    if (Array.isArray(body.targetLangs)) {
      const { text, targetLangs } = body as { text: string; targetLangs: string[] }
      if (!text || targetLangs.length === 0) {
        return NextResponse.json({ error: "missing_params" }, { status: 400 })
      }
      const results = await Promise.allSettled(
        targetLangs.map((lang) => translateSingle(text, lang))
      )
      const translations: Record<string, string> = {}
      results.forEach((r, i) => {
        translations[targetLangs[i]] = r.status === "fulfilled" ? r.value : text
      })
      return NextResponse.json({ translations })
    }

    // ── Mode simple (rétrocompatibilité) : { text, targetLang } ───────────────
    const { text, targetLang } = body as { text: string; targetLang: string }
    if (!text || !targetLang) {
      return NextResponse.json({ error: "missing_params" }, { status: 400 })
    }
    const translatedText = await translateSingle(text, targetLang)
    return NextResponse.json({ translatedText, provider: "auto" })

  } catch (err) {
    console.error("[translate]", err)
    return NextResponse.json({ error: "translation_failed" }, { status: 500 })
  }
}
