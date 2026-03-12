import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { text, targetLang } = await req.json();
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const result = await model.generateContent(`Translate to ${targetLang}: "${text}". Only the translation.`);
    const translation = result.response.text().trim();

    const voiceId = process.env.ELEVENLABS_VOICE_ID || "QaWvcRVDzoGrTmTauQpi";
    const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: translation, model_id: "eleven_multilingual_v2" })
    });

    const audioBuffer = await elRes.arrayBuffer();
    // Utilisation de Buffer (Node.js) pour éviter les erreurs de build
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return NextResponse.json({ audio: base64Audio, translation });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}