import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/prisma"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  let channel: string | null = req.nextUrl.searchParams.get("channel")
  const sid = req.nextUrl.searchParams.get("sid") || ""

  if (!channel) {
    try { const body = await req.json(); channel = typeof body?.channel === "string" ? body.channel : null } catch {}
  }
  if (!channel) return NextResponse.json({ ok: false, reason: "missing_channel" }, { status: 200 })

  let customerRef: string | undefined
  if (channel === "demo-access") {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "guest"
    customerRef = `demo:${ip}`
  } else {
    customerRef = req.cookies.get("instanttalk_customer_ref")?.value
    if (!customerRef) return NextResponse.json({ ok: false, reason: "no_customer_ref" }, { status: 200 })
  }

  const slotKey = sid ? `${customerRef}:${sid}` : customerRef

  try {
    await pool.query(`DELETE FROM "RoomSlot" WHERE "channelName"=$1 AND "customerRef"=$2`, [channel, slotKey])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.warn("[room-leave] skipped:", (err as Error).message)
    return NextResponse.json({ ok: true })
  }
}
