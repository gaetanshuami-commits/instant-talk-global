import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

// LE SECRET DE LA VITESSE : On passe du moteur Node.js lourd au moteur Edge
export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { roomName, userId } = await req.json();

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Les identifiants LiveKit manquent dans le .env" },
        { status: 500 }
      );
    }

    if (!roomName || !userId) {
      return NextResponse.json(
        { error: "roomName et userId requis" },
        { status: 400 }
      );
    }

    // Création du ticket instantané
    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: userId,
    });

    at.addGrant({ roomJoin: true, room: roomName });

    const token = await at.toJwt();

    return NextResponse.json({ token });
  } catch (error) {
    console.error("LiveKit Edge Auth Error:", error);
    return NextResponse.json(
      { error: "Erreur de génération du token" },
      { status: 500 }
    );
  }
}
