import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'Clé Deepgram manquante dans .env' }, { status: 500 });
  }
  // Pour le prototype, on renvoie la clé de l'environnement
  return NextResponse.json({ token: key });
}
