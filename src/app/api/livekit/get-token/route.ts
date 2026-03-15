import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

export async function GET(req: NextRequest) {
  try {
    const roomName = "instant-talk-test-room";
    // Identité unique pour permettre le test avec plusieurs navigateurs simultanés
    const participantName = "user_" + Math.floor(Math.random() * 10000);

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: "LIVEKIT_API_KEY ou LIVEKIT_API_SECRET manquant" }, { status: 500 });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
    });

    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });

    const token = await at.toJwt();

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Erreur génération token LiveKit:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
