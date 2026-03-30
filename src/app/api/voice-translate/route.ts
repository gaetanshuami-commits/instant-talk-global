import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

const LANGUAGE_LABELS: Record<string, string> = {
  FR: "French",
  EN: "English",
  ES: "Spanish",
  DE: "German",
  ZH: "Mandarin Chinese",
  AR: "Arabic",
  HI: "Hindi",
  PT: "Portuguese",
  RU: "Russian",
  JA: "Japanese",
  BN: "Bengali",
  IT: "Italian",
  NL: "Dutch",
  LB: "Luxembourgish",
  EL: "Greek",
  SV: "Swedish",
  NO: "Norwegian",
  DA: "Danish",
  FI: "Finnish",
  IS: "Icelandic",
  PL: "Polish",
  UK: "Ukrainian",
  CS: "Czech",
  SK: "Slovak",
  HU: "Hungarian",
  RO: "Romanian",
  BG: "Bulgarian",
  KO: "Korean",
  TR: "Turkish",
  HE: "Hebrew",
  LN: "Lingala",
  SW: "Swahili",
};

const DEEPL_SUPPORTED = new Set([
  "FR", "EN", "ES", "DE", "PT", "IT", "NL", "PL", "JA", "ZH", "RU"
]);

async function translateText(text: string, targetLang: string) {
  const geminiKey = process.env.GEMINI_API_KEY;
  const deeplKey = process.env.DEEPL_API_KEY;

  const targetLabel = LANGUAGE_LABELS[targetLang] ?? targetLang;

  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt =
        `Translate this spoken sentence naturally into ${targetLabel}. ` +
        `Return only the translation, no quotes, no markdown:\n${text}`;

      const result = await model.generateContent(prompt);
      const translatedText = result.response.text().trim();

      if (translatedText) {
        return {
          translatedText,
          provider: "gemini",
        };
      }
    } catch (error) {
      console.warn("[voice-translate] Gemini failed, fallback DeepL:", error);
    }
  }

  if (!deeplKey || !DEEPL_SUPPORTED.has(targetLang)) {
    throw new Error(`No fallback translation provider available for ${targetLang}`);
  }

  const params = new URLSearchParams();
  params.append("text", text);
  params.append("target_lang", targetLang);

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

  return {
    translatedText: data?.translations?.[0]?.text ?? text,
    provider: "deepl",
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audio = formData.get("audio");
    const targetLang = String(formData.get("targetLang") ?? "FR").toUpperCase();

    if (!(audio instanceof File)) {
      return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
    }

    if (!process.env.DEEPGRAM_API_KEY) {
      return NextResponse.json({ error: "Missing DEEPGRAM_API_KEY" }, { status: 500 });
    }

    const arrayBuffer = await audio.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("[voice-translate] audio received", {
      size: buffer.length,
      type: audio.type,
      targetLang,
    });

    const dgResponse = await fetch(
      "https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&punctuate=true&detect_language=true",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          "Content-Type": audio.type || "audio/webm",
        },
        body: buffer,
        cache: "no-store",
      }
    );

    const dgRaw = await dgResponse.text();

    if (!dgResponse.ok) {
      console.error("[voice-translate] deepgram failed:", dgRaw);
      return NextResponse.json(
        { error: "Deepgram transcription failed", details: dgRaw },
        { status: 500 }
      );
    }

    const dgData = JSON.parse(dgRaw);
    const transcript =
      dgData?.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim?.() ?? "";

    console.log("[voice-translate] transcript", transcript);

    if (!transcript) {
      return NextResponse.json({
        transcript: "",
        translatedText: "",
        provider: null,
      });
    }

    const translation = await translateText(transcript, targetLang);

    console.log("[voice-translate] translated", translation);

    return NextResponse.json({
      transcript,
      translatedText: translation.translatedText,
      provider: translation.provider,
    });
  } catch (error) {
    console.error("[voice-translate] route error:", error);

    return NextResponse.json(
      {
        error: "Voice translation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
