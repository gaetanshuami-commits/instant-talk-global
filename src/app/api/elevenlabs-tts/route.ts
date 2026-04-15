import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

// Languages supported by eleven_flash_v2_5
// sw (Swahili), ln (Lingala), th (Thai) not supported → Azure TTS fallback
export const ELEVENLABS_SUPPORTED_LANGS = new Set([
  "en", "fr", "de", "es", "it", "pt", "nl", "ar", "ja", "ko",
  "hi", "tr", "zh", "ru", "pl", "sv", "no", "da", "fi",
  "cs", "sk", "hu", "ro", "bg", "el", "vi",
])

// Premium multilingual voices
const VOICE_FEMALE = process.env.ELEVENLABS_VOICE_ID ?? "EXAVITQu4vr4xnSDxMaL" // Sarah
const VOICE_MALE   = "TxGEqnHWrfWFTfGW9XjX"                                     // Josh

export async function POST(req: NextRequest) {
  try {
    const { text, voiceId, gender, lang } = await req.json()

    const cleanText = String(text ?? "").trim()
    if (!cleanText) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Missing ELEVENLABS_API_KEY" }, { status: 500 })
    }

    const resolvedVoiceId = voiceId ?? (gender === "male" ? VOICE_MALE : VOICE_FEMALE)
    // Explicit language_code improves accuracy and avoids auto-detection overhead.
    // Only pass if it's a supported language (undefined = auto-detect for others).
    const languageCode = lang && ELEVENLABS_SUPPORTED_LANGS.has(String(lang)) ? String(lang) : undefined

    // eleven_flash_v2_5: ElevenLabs' real-time model, ~75 ms generation latency
    // vs ~300-500 ms for eleven_multilingual_v2. Same voice IDs, same 32 languages
    // (Swahili/Lingala still fall back to Azure in voiceEngine). optimize_streaming_latency=4
    // + flash model = first audio bytes in ~75–120 ms after API call.
    // mp3_22050_32 keeps bandwidth minimal for low-latency delivery over Agora.
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${resolvedVoiceId}/stream` +
      `?optimize_streaming_latency=4&output_format=mp3_22050_32`,
      {
        method: "POST",
        headers: {
          "xi-api-key":   apiKey,
          "Content-Type": "application/json",
          Accept:         "audio/mpeg",
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: "eleven_flash_v2_5",
          // Explicit language_code skips EL's auto-detection (~15ms saved per call).
          // Omitted when undefined so EL falls back to auto-detect for edge cases.
          ...(languageCode ? { language_code: languageCode } : {}),
          voice_settings: {
            stability:         0.45,
            similarity_boost:  0.80,
            style:             0.05,  // near-zero style = fastest generation path
            use_speaker_boost: false, // speaker boost adds ~30 ms; off for real-time
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      console.error("[ElevenLabs TTS]", response.status, errorText)
      return NextResponse.json({ error: "TTS failed" }, { status: response.status })
    }

    // Pass the stream body directly to the client — first bytes arrive as soon
    // as ElevenLabs generates them, without waiting for the full audio file.
    return new NextResponse(response.body, {
      headers: {
        "Content-Type":  "audio/mpeg",
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("[ElevenLabs TTS] Error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
