import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

function ref(req: NextRequest) {
  return req.cookies.get("instanttalk_customer_ref")?.value || null
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const customerRef = ref(req)
  if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const roomModel    = (prisma as any).chatRoom
  const messageModel = (prisma as any).chatMessage
  if (!roomModel || !messageModel) return NextResponse.json({ messages: [] })
  const { roomId } = await params
  try {
    const room = await roomModel.findFirst({ where: { id: roomId, customerRef } })
    if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const messages = await messageModel.findMany({ where: { roomId }, orderBy: { createdAt: "asc" }, take: 200 })
    return NextResponse.json({ messages })
  } catch { return NextResponse.json({ messages: [] }) }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const customerRef = ref(req)
  if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const roomModel    = (prisma as any).chatRoom
  const messageModel = (prisma as any).chatMessage
  if (!roomModel || !messageModel) return NextResponse.json({ error: "db_not_ready" }, { status: 503 })
  const { roomId } = await params
  try {
    const room = await roomModel.findFirst({ where: { id: roomId, customerRef } })
    if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const { author, text, lang, mine } = await req.json()
    if (!author || !text) return NextResponse.json({ error: "author and text required" }, { status: 400 })
    const message = await messageModel.create({ data: { roomId, author, text, lang, mine: mine ?? false } })
    return NextResponse.json({ message }, { status: 201 })
  } catch { return NextResponse.json({ error: "create_failed" }, { status: 500 }) }
}
