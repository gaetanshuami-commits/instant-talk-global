import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30; // Vital pour Vercel (Plan Pro requis pour > 10s)
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { text, targetLanguage, voiceId } = await req.json();

    if (!text) return NextResponse.json({ error: "No text provided" }, { status: 400 });

    // 1. TRADUCTION : Gemini 1.5 Flash (Vitesse lumière)
    const prompt = `Translate the following text into ${targetLanguage}. 
                    Output ONLY the translation, maintain a natural oral tone: "${text}"`;
    
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    
    const geminiData = await geminiRes.json();
    const translatedText = geminiData.candidates[0].content.parts[0].text;

    // 2. CLONAGE VOCAL : ElevenLabs Multilingual v2
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId || process.env.ELEVENLABS_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: translatedText,
        model_id: "eleven_multilingual_v2",
        voice_settings: { 
          stability: 0.40, 
          similarity_boost: 0.80,
          style: 0.5,
          use_speaker_boost: true 
        }
      }),
    });

    if (!ttsRes.ok) throw new Error("ElevenLabs API Error");

    const audioBuffer = await ttsRes.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return NextResponse.json({ translatedText, audio: base64Audio });
  } catch (error) {
    console.error("Pipeline Error:", error);
    return NextResponse.json({ error: "Pipeline failed" }, { status: 500 });
  }
}