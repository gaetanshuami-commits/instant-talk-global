import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, targetLang } = await req.json();

    const response = await fetch(`https://api.deepgram.com/v1/translate?to=${targetLang}`, {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();
    return NextResponse.json({ translation: data.results?.translation || "" });
  } catch {
    return NextResponse.json({ translation: "Error" }, { status: 500 });
  }
}
