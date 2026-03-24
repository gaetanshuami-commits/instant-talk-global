import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, hasServerAccess } from "@/lib/server-access";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const access = request.cookies.get(ACCESS_COOKIE)?.value;

  if (!hasServerAccess(access)) {
    return NextResponse.json(
      { error: "Access required" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const room = searchParams.get("room");

  if (!room) {
    return NextResponse.json(
      { error: 'Le paramètre "room" est requis' },
      { status: 400 }
    );
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Configuration serveur LiveKit manquante" },
      { status: 500 }
    );
  }

  const participantIdentity = `User_${Math.floor(Math.random() * 10000)}`;

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    name: participantIdentity,
  });

  at.addGrant({
    roomJoin: true,
    room,
    canPublish: true,
    canSubscribe: true,
  });

  return NextResponse.json({ token: await at.toJwt() });
}
