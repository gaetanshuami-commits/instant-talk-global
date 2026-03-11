import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, targetLanguage } = await req.json();

    // 1. Traduction via Gemini 1.5 Flash (API v1beta avec la bonne syntaxe)
    const prompt = `Traduire le texte suivant en ${targetLanguage} en gardant un ton naturel et fluide : "${text}"`;
    
    // CORRECTION : L'URL exacte pour Google AI Studio
    const geminiResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents: [{ parts: [{ text: prompt }] }] 
      })
    });

    const geminiData = await geminiResp.json();
    
    // Si Gemini renvoie une erreur (clé invalide, modèle introuvable, etc.)
    if (!geminiData.candidates || geminiData.error) {
       console.error("Réponse API Gemini:", geminiData);
       throw new Error("Erreur API Gemini: " + (geminiData.error?.message || JSON.stringify(geminiData)));
    }
    
    const translatedText = geminiData.candidates[0].content.parts[0].text;

    // 2. TTS via ElevenLabs (Clonage vocal)
    const ttsResp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`, {
      method: 'POST',
      headers: { 
        'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        text: translatedText,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.8 }
      })
    });

    if (!ttsResp.ok) {
        const errText = await ttsResp.text();
        throw new Error(`Erreur ElevenLabs: ${ttsResp.status} - ${errText}`);
    }

    const audioBuffer = await ttsResp.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return NextResponse.json({ translatedText, audio: base64Audio });
  } catch (error: any) {
    console.error("Erreur Pipeline:", error);
    return NextResponse.json({ error: error.message || "Erreur pipeline IA" }, { status: 500 });
  }
}