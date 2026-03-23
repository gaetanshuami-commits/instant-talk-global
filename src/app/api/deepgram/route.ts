import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const audio = body?.audio;

    if (!audio || typeof audio !== "string" || audio.length < 1000) {
      return NextResponse.json({ transcript: "" });
    }

    if (!process.env.DEEPGRAM_API_KEY) {
      return NextResponse.json(
        { error: "Missing DEEPGRAM_API_KEY" },
        { status: 500 }
      );
    }

    const audioBuffer = Buffer.from(audio, "base64");

    if (!audioBuffer || audioBuffer.length < 1000) {
      return NextResponse.json({ transcript: "" });
    }

    const response = await fetch(
      "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=fr",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          "Content-Type": "audio/webm"
        },
        body: audioBuffer
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("DEEPGRAM_API_ERROR", data);
      return NextResponse.json({ transcript: "" });
    }

    const transcript =
      data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error("DEEPGRAM_ROUTE_ERROR", error);
    return NextResponse.json({ transcript: "" });
  }
}