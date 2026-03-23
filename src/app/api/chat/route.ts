import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const message = body?.message;
    const activeLanguage = body?.activeLanguage || "EN";

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY in environment variables" },
        { status: 500 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Missing message" },
        { status: 400 }
      );
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: `You are the premium AI assistant inside Instant Talk. Respond only in ${activeLanguage}. Be concise, useful, natural, and premium.`
        },
        {
          role: "user",
          content: String(message)
        }
      ]
    });

    return NextResponse.json({
      reply: completion.choices?.[0]?.message?.content || ""
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Chat request failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
