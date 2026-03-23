import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  text: z.string().min(1, "Text is required"),
  targetLang: z.string().min(2, "Target language is required"),
  sourceLang: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, targetLang, sourceLang } = bodySchema.parse(body);

    if (!process.env.DEEPL_API_KEY) {
      return NextResponse.json(
        { error: "Missing DEEPL_API_KEY in environment variables" },
        { status: 500 }
      );
    }

    const params = new URLSearchParams();
    params.append("text", text);
    params.append("target_lang", targetLang.toUpperCase());

    if (sourceLang) {
      params.append("source_lang", sourceLang.toUpperCase());
    }

    const response = await fetch("https://api.deepl.com/v2/translate", {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      cache: "no-store",
    });

    const raw = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "DeepL request failed",
          details: raw,
        },
        { status: 500 }
      );
    }

    const data = JSON.parse(raw);

    return NextResponse.json({
      translatedText: data?.translations?.[0]?.text ?? text,
      detectedSourceLang:
        data?.translations?.[0]?.detected_source_language ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Invalid request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}
