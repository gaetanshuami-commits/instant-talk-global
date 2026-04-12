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
  })

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
  })

  if (!res.ok) throw new Error(`DeepL error ${res.status}`)
  const data = await res.json()
  return data.translations[0].text
}

export async function POST(req: NextRequest) {
  try {
    const { text, targetLang } = await req.json()
    if (!text || !targetLang) {
      return NextResponse.json({ error: "missing_params" }, { status: 400 })
    }

    const normalized = targetLang.toLowerCase()

    // Swahili, Lingala, Hindi, Thai, Vietnamese — not in DeepL → Gemini directly
    if (DEEPL_UNSUPPORTED.has(normalized)) {
      const translatedText = await translateWithGemini(text, normalized)
      return NextResponse.json({ translatedText, provider: "gemini" })
    }

    // For all other languages: try DeepL first (fast, high-quality for EU langs),
    // fall back to Gemini if DeepL fails (quota, invalid key, unsupported variant).
    try {
      const translatedText = await translateWithDeepL(text, targetLang)
      return NextResponse.json({ translatedText, provider: "deepl" })
    } catch {
      const translatedText = await translateWithGemini(text, normalized)
      return NextResponse.json({ translatedText, provider: "gemini-fallback" })
    }
  } catch (err) {
    console.error("[translate]", err)
    return NextResponse.json({ error: "translation_failed" }, { status: 500 })
  }
}
