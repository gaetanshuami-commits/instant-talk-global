import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

/**
 * Called by clients when they leave a room (Quitter button or page unload).
 * Deletes the RoomSlot immediately so the seat is freed for the next participant.
 * Uses the customerRef cookie set at subscription time.
 *
 * Channel resolution order:
 *   1. URL query param ?channel=... (sendBeacon — no body needed)
 *   2. JSON body { channel } (fetch keepalive fallback)
 *
 * This avoids the ReadableStream double-consumption bug: req.json() consumes
 * the stream even on a throw, making a subsequent req.text() return empty.
 */
export async function POST(req: NextRequest) {
  // 1. URL param (sendBeacon path — no body)
  let channel: string | null = req.nextUrl.searchParams.get("channel")
  const sid = req.nextUrl.searchParams.get("sid") || ""

  // 2. JSON body (fetch keepalive path)
  if (!channel) {
    try {
      const body = await req.json()
      channel = typeof body?.channel === "string" ? body.channel : null
    } catch {}
  }

  if (!channel) {
    return NextResponse.json({ ok: false, reason: "missing_channel" }, { status: 200 })
  }

  // Resolve the customer ref — demo channels use IP-based ref, others use cookie.
  let customerRef: string | undefined
  if (channel === "demo-access") {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "guest"
    customerRef = `demo:${ip}`
  } else {
    customerRef = req.cookies.get("instanttalk_customer_ref")?.value
    if (!customerRef) {
      return NextResponse.json({ ok: false, reason: "no_customer_ref" }, { status: 200 })
    }
  }

  // Match the same composite key used at join time
  const slotKey = sid ? `${customerRef}:${sid}` : customerRef

  try {
    await prisma.roomSlot.deleteMany({
      where: { channelName: channel, customerRef: slotKey },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.warn("[room-leave] RoomSlot delete skipped:", (err as Error).message)
    return NextResponse.json({ ok: true })
  }
}
