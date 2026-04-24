import { NextRequest, NextResponse } from "next/server"

export const runtime    = "nodejs"
export const maxDuration = 60  // ElevenLabs cloning can take 20-40s for large audio files

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Missing ELEVENLABS_API_KEY" }, { status: 500 })

    const formData = await req.formData()
    const audio = formData.get("audio") as File | null

    if (!audio || audio.size === 0) {
      return NextResponse.json({ error: "Missing audio sample" }, { status: 400 })
    }

    if (audio.size < 50_000) {
      return NextResponse.json({ error: "Audio sample too short" }, { status: 422 })
    }

    const body = new FormData()
    body.append("name", `itg_${Date.now()}`)
    body.append("files", audio, "voice_sample.webm")
    body.append("description", "Instant Talk — auto voice clone")

    // 50s timeout — ElevenLabs cloning is slow for large samples; without a timeout
    // the Vercel function hangs until the platform kills it, returning an opaque 502.
    const controller = new AbortController()
    const timeoutId  = setTimeout(() => controller.abort(), 50_000)

    let res: Response
    try {
      res = await fetch("https://api.elevenlabs.io/v1/voices/add", {
        method: "POST",
        headers: { "xi-api-key": apiKey },
        body,
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!res.ok) {
      const err = await res.text().catch(() => "")
      console.error("[clone-voice]", res.status, err.slice(0, 200))
      // Return the real status so the client can distinguish quota (429) from server errors
      const clientStatus = res.status === 429 ? 429 : 502
      return NextResponse.json(
        { error: "ElevenLabs cloning failed", upstream: res.status },
        { status: clientStatus }
      )
    }

    const data = await res.json()
    return NextResponse.json({ voiceId: data.voice_id })
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "AbortError"
    console.error("[clone-voice]", isTimeout ? "timeout after 50s" : err)
    return NextResponse.json(
      { error: isTimeout ? "Voice cloning timed out" : "Server error" },
      { status: isTimeout ? 504 : 500 }
    )
  }
}
