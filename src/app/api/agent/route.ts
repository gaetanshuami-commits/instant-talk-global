import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { text, targetLang } = await req.json();

    // 1. VÉRIFICATION DES CLÉS
    if (!process.env.GEMINI_API_KEY) throw new Error("CRITIQUE: GEMINI_API_KEY est introuvable sur Vercel");
    if (!process.env.ELEVENLABS_API_KEY) throw new Error("CRITIQUE: ELEVENLABS_API_KEY est introuvable sur Vercel");

    // 2. ÉTAPE GEMINI (Traduction)
    let translation = "";
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Tu es un traducteur simultané. Traduis le texte suivant en ${targetLang}. Ne donne QUE la traduction. N'ajoute AUCUN commentaire. Texte: "${text}"`;
      
      const result = await model.generateContent(prompt);
      translation = result.response.text().trim();
    } catch (geminiErr: any) {
      throw new Error(`Crash GEMINI : ${geminiErr.message}`);
    }

    // 3. ÉTAPE ELEVENLABS (Voix)
    const voiceId = process.env.ELEVENLABS_VOICE_ID || "QaWvcRVDzoGrTmTauQpi";
    const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: translation, model_id: "eleven_multilingual_v2" })
    });

    if (!elRes.ok) {
      const elError = await elRes.text();
      throw new Error(`Crash ELEVENLABS (Code ${elRes.status}) : ${elError}`);
    }

    const audioBuffer = await elRes.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return NextResponse.json({ audio: base64Audio, translation });

  } catch (error: any) {
    // On renvoie l'erreur EXACTE pour la lire
    console.error("ERREUR FATALE AGENT:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}