import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rawKey = process.env.DEEPGRAM_API_KEY || "";
    const apiKey = rawKey.replace(/^["']|["']$/g, '').trim();
    
    if (!apiKey) {
      console.error("Deepgram token error: Missing DEEPGRAM_API_KEY in .env");
      return NextResponse.json({ error: "Deepgram ephemeral token generation failed" }, { status: 500 });
    }

    const url = "https://api.deepgram.com/v1/auth/grant";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Token ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ttl_seconds: 120 })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Deepgram key generation failed (${response.status}):`, errorText);
      return NextResponse.json({ error: "Deepgram ephemeral token generation failed" }, { status: 500 });
    }

    const data = await response.json();
    if (!data.access_token) {
      console.error("Deepgram token error: No access_token in response body");
      return NextResponse.json({ error: "Deepgram ephemeral token generation failed" }, { status: 500 });
    }

    return NextResponse.json({ token: data.access_token });
  } catch (error) {
    console.error("Deepgram ephemeral token generation failed:", error);
    return NextResponse.json({ error: "Deepgram ephemeral token generation failed" }, { status: 500 });
  }
}
