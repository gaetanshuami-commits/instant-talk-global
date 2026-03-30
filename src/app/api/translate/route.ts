import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { text, targetLang, sourceLang } = await req.json();

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const deeplKey = process.env.DEEPL_API_KEY;

    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
        });

        const prompt = `Translate this spoken sentence into ${targetLang}. Return only the translation, with no quotes and no markdown: ${text}`;

        const result = await model.generateContent(prompt);
        const translatedText = result.response.text().trim();

        if (translatedText) {
          return NextResponse.json({
            translatedText,
            provider: "gemini",
          });
        }
      } catch (error) {
        console.warn("Gemini failed, fallback to DeepL:", error);
      }
    }

    if (!deeplKey) {
      return NextResponse.json(
        { error: "No translation provider available" },
        { status: 500 }
      );
    }

    const params = new URLSearchParams();
    params.append("text", text);
    params.append("target_lang", String(targetLang).toUpperCase());

    if (sourceLang) {
      params.append("source_lang", String(sourceLang).toUpperCase());
    }

    const response = await fetch("https://api.deepl.com/v2/translate", {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${deeplKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      cache: "no-store",
    });

    const raw = await response.text();

    if (!response.ok) {
      throw new Error(raw);
    }

    const data = JSON.parse(raw);

    return NextResponse.json({
      translatedText: data?.translations?.[0]?.text ?? text,
      provider: "deepl",
      detectedSourceLang: data?.translations?.[0]?.detected_source_language ?? null,
    });
  } catch (error) {
    console.error("Translate error:", error);

    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}
