import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  const { text, sourceLang, targetLang } = await req.json();
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  
  const prompt = "Translate from " + sourceLang + " to " + targetLang + ". Return ONLY translation: " + text;
  const result = await model.generateContent(prompt);
  const translatedText = result.response.text().trim();

  const ttsRes = await fetch("https://api.elevenlabs.io/v1/text-to-speech/" + process.env.ELEVENLABS_VOICE_ID, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({ text: translatedText, model_id: "eleven_turbo_v2_5" }),
  });

  const audioBase64 = Buffer.from(await ttsRes.arrayBuffer()).toString("base64");
  return NextResponse.json({ translatedText, audioBase64 });
}
