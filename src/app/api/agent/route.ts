import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { text, targetLang } = await req.json();

    // 1. TRADUCTION STRICTE (Gemini)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Le prompt qui interdit à l'IA de discuter
    const prompt = `Tu es un traducteur simultané. Traduis le texte suivant en ${targetLang}. Ne donne QUE la traduction. N'ajoute AUCUN commentaire, AUCUNE explication, AUCUN mot en plus. Texte: "${text}"`;
    
    const result = await model.generateContent(prompt);
    const translation = result.response.text().trim();

    // 2. VOIX NATURELLE (ElevenLabs)
    const voiceId = process.env.ELEVENLABS_VOICE_ID || "QaWvcRVDzoGrTmTauQpi";
    const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY as string,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: translation, model_id: "eleven_multilingual_v2" })
    });

    if (!elRes.ok) throw new Error("Erreur ElevenLabs");

    const audioBuffer = await elRes.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return NextResponse.json({ audio: base64Audio, translation });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
