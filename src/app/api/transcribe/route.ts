import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('audio') as Blob;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier audio reçu." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // On envoie l'audio à Deepgram
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=fr', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': file.type || 'audio/webm',
      },
      body: buffer,
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    const transcript = data.results?.channels[0]?.alternatives[0]?.transcript || "";

    return NextResponse.json({ transcript });
  } catch (error: any) {
    console.error("Erreur Deepgram:", error);
    return NextResponse.json({ error: error.message || "Erreur de transcription" }, { status: 500 });
  }
}