import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

type Params = { params: Promise<{ voiceId: string }> }

export async function DELETE(_req: NextRequest, ctx: Params) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Missing ELEVENLABS_API_KEY" }, { status: 500 })

    const { voiceId } = await ctx.params
    if (!voiceId) return NextResponse.json({ error: "Missing voiceId" }, { status: 400 })

    const res = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
      method: "DELETE",
      headers: { "xi-api-key": apiKey },
    })

    // 404 = already deleted — not an error from our perspective
    if (!res.ok && res.status !== 404) {
      return NextResponse.json({ error: "Delete failed", status: res.status }, { status: 502 })
    }

    return NextResponse.json({ deleted: true })
  } catch (err) {
    console.error("[clone-voice delete]", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
