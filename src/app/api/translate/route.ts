import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { text, targetLanguage } = await req.json();

    // 1. GEMINI STRICT : Plus de discussion, que de la traduction
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Clé GEMINI_API_KEY manquante");
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Tu es un simple algorithme de traduction automatique.
    Traduis exactement ce texte vers la langue : ${targetLanguage}.
    RÈGLE ABSOLUE : Renvoie UNIQUEMENT la traduction. Aucun commentaire, aucun mot en plus.
    Texte : "${text}"`;

    const result = await model.generateContent(prompt);
    const translatedText = result.response.text().trim();

    // 2. ELEVENLABS STRICT
    const elApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elApiKey) throw new Error("Clé ELEVENLABS_API_KEY manquante");

    const voiceId = process.env.ELEVENLABS_VOICE_ID || "QaWvcRVDzoGrTmTauQpi";
    
    const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': elApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: translatedText,
        model_id: "eleven_multilingual_v2"
      })
    });

    if (!elevenRes.ok) {
      const errData = await elevenRes.text();
      throw new Error(`Refus ElevenLabs : ${errData}`);
    }

    const audioBuffer = await elevenRes.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return NextResponse.json({ audio: base64Audio, translation: translatedText });
  } catch (error: any) {
    console.error("Erreur Backend Translate:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
