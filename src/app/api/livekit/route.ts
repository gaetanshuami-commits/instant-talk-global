import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { room, username } = await req.json();
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) return NextResponse.json({ error: "Missing Env" }, { status: 500 });

  const at = new AccessToken(apiKey, apiSecret, { identity: username, ttl: "6h" });
  at.addGrant({ roomJoin: true, room: room, canPublish: true, canSubscribe: true });
  
  return NextResponse.json({ token: await at.toJwt() });
}
