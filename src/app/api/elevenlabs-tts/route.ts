import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { text, voiceId } = await req.json();

    const cleanText = String(text ?? "").trim();
    const resolvedVoiceId = String(voiceId || "EXAVITQu4vr4xnSDxMaL").trim();

    if (!cleanText) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: "Missing ELEVENLABS_API_KEY" }, { status: 500 });
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${resolvedVoiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg"
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.85,
            style: 0.35,
            use_speaker_boost: true
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("ELEVENLABS_ERROR", response.status, errorText);
      return NextResponse.json({ error: "TTS failed" }, { status: 500 });
    }

    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    console.error("TTS_ROUTE_ERROR", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}