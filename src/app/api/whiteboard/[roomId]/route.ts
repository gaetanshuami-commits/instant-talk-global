import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

// ── In-memory whiteboard store ───────────────────────────────────────────────
// Persists in the Node.js process across requests (works on single-server deploys).
// Each room holds up to MAX_EVENTS draw events; older ones are pruned.
const MAX_EVENTS = 2000

type DrawEvent = {
  seq: number
  type: "draw" | "clear" | "sticky" | "erase"
  data: unknown
}

const rooms = new Map<string, { events: DrawEvent[]; seq: number }>()

function getRoom(id: string) {
  if (!rooms.has(id)) rooms.set(id, { events: [], seq: 0 })
  return rooms.get(id)!
}

// GET /api/whiteboard/[roomId]?since=<seq>
// Returns all events with seq > since
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params
  const since = parseInt(req.nextUrl.searchParams.get("since") ?? "0", 10)
  const room  = getRoom(roomId)
  const events = room.events.filter((e) => e.seq > since)
  return NextResponse.json({ events, seq: room.seq })
}

// POST /api/whiteboard/[roomId]
// Body: { type, data }  — appends an event
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params
  const room = getRoom(roomId)
  const body = await req.json() as { type: DrawEvent["type"]; data: unknown }

  if (body.type === "clear") {
    // Clear resets the event log
    room.events = []
    room.seq++
    room.events.push({ seq: room.seq, type: "clear", data: null })
    return NextResponse.json({ seq: room.seq })
  }

  room.seq++
  const event: DrawEvent = { seq: room.seq, type: body.type, data: body.data }
  room.events.push(event)
  if (room.events.length > MAX_EVENTS) room.events.splice(0, room.events.length - MAX_EVENTS)
  return NextResponse.json({ seq: room.seq })
}

// DELETE — clear board
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params
  rooms.delete(roomId)
  return NextResponse.json({ ok: true })
}
