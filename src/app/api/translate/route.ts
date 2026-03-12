import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { text, targetLanguage } = await req.json();

    // 1. INITIALISATION DE GEMINI
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Clé Gemini manquante");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 2. LE PROMPT STRICT (Le secret pour empêcher l'IA de discuter)
    const prompt = `Tu es un traducteur instantané ultra-précis. 
    Ta seule mission est de traduire le texte suivant en langue: ${targetLanguage}. 
    REGLE ABSOLUE: Ne rajoute AUCUNE explication, AUCUN commentaire, AUCUNE ponctuation inutile. Ne réponds pas à la question, traduis-la uniquement.
    
    Texte à traduire : "${text}"`;

    const result = await model.generateContent(prompt);
    const translatedText = result.response.text().trim();

    // 3. SYNTHÈSE VOCALE ELEVENLABS (Avec ta voix)
    const voiceId = process.env.ELEVENLABS_VOICE_ID || "QaWvcRVDzoGrTmTauQpi";
    const elApiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!elApiKey) throw new Error("Clé ElevenLabs manquante");

    const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': elApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: translatedText,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!elevenRes.ok) throw new Error("Erreur ElevenLabs");

    const audioBuffer = await elevenRes.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return NextResponse.json({ audio: base64Audio, translation: translatedText });

  } catch (error: any) {
    console.error("Erreur API Translate:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
