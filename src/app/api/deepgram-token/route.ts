import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'Clé DEEPGRAM_API_KEY introuvable dans le serveur' }, { status: 500 });
  }
  return NextResponse.json({ token: key });
}
