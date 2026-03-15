import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier audio fourni" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true", {
      method: "POST",
      headers: {
        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': file.type || 'audio/webm',
      },
      body: buffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur API Deepgram:", errorText);
      return NextResponse.json(
        { error: "Erreur Deepgram", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Erreur interne lors de la transcription:", error);
    return NextResponse.json(
      { error: "Échec de la transcription", details: String(error) },
      { status: 500 }
    );
  }
}
