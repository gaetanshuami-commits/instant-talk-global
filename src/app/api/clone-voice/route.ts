import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Missing ELEVENLABS_API_KEY" }, { status: 500 })

    const formData = await req.formData()
    const audio = formData.get("audio") as File | null

    if (!audio || audio.size === 0) {
      return NextResponse.json({ error: "Missing audio sample" }, { status: 400 })
    }

    // Minimum viable quality check — ElevenLabs needs at least ~100 KB for a clean clone
    if (audio.size < 50_000) {
      return NextResponse.json({ error: "Audio sample too short" }, { status: 422 })
    }

    const body = new FormData()
    body.append("name", `itg_${Date.now()}`)
    body.append("files", audio, "voice_sample.webm")
    body.append("description", "Instant Talk — auto voice clone")

    const res = await fetch("https://api.elevenlabs.io/v1/voices/add", {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body,
    })

    if (!res.ok) {
      const err = await res.text().catch(() => "")
      console.error("[clone-voice]", res.status, err.slice(0, 200))
      return NextResponse.json({ error: "ElevenLabs cloning failed", status: res.status }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json({ voiceId: data.voice_id })
  } catch (err) {
    console.error("[clone-voice]", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
