import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, targetLanguage } = await req.json();

    // 1. Traduction via Gemini 2.5 Flash
    const prompt = \Traduire le texte suivant en \ en gardant un ton naturel et fluide : "\"\;
    const geminiResp = await fetch(\https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=\\, {
      method: 'POST',
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const geminiData = await geminiResp.json();
    const translatedText = geminiData.candidates[0].content.parts[0].text;

    // 2. TTS via ElevenLabs (Clonage vocal)
    const ttsResp = await fetch(\https://api.elevenlabs.io/v1/text-to-speech/\\, {
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

    const audioBuffer = await ttsResp.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return NextResponse.json({ translatedText, audio: base64Audio });
  } catch (error) {
    return NextResponse.json({ error: "Erreur pipeline IA" }, { status: 500 });
  }
}
