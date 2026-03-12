import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'edge'; // Optimisation ultra-rapide Vercel

export async function POST(req: Request) {
  try {
    const { text, targetLang } = await req.json();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Prompt chirurgical pour éviter les discussions inutiles
    const prompt = `Translate exactly this to ${targetLang}. NO comments. NO explanations. Just the translation. Text: "${text}"`;
    
    const result = await model.generateContent(prompt);
    const translation = result.response.text().trim();

    const voiceId = process.env.ELEVENLABS_VOICE_ID || "QaWvcRVDzoGrTmTauQpi";
    
    const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        text: translation, 
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.4, similarity_boost: 0.8 } 
      })
    });

    const audioBuffer = await elRes.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    return NextResponse.json({ audio: base64Audio, translation });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}