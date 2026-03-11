import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
  if (!key) return NextResponse.json({ error: "Missing Key" }, { status: 500 });
  return NextResponse.json({ key });
}
