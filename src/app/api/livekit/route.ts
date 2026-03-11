import { AccessToken } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const room = url.searchParams.get('room');
  const username = url.searchParams.get('username');

  if (!room || !username) {
    return NextResponse.json({ error: 'Nom de salle ou utilisateur manquant' }, { status: 400 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Clés LiveKit manquantes sur le serveur' }, { status: 500 });
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: username,
  });

  at.addGrant({ roomJoin: true, room: room });

  return NextResponse.json({ token: await at.toJwt() });
}
