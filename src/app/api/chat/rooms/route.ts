import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

function ref(req: NextRequest) {
  return req.cookies.get("instanttalk_customer_ref")?.value || null
}

export async function GET(req: NextRequest) {
  const customerRef = ref(req)
  if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const model = (prisma as any).chatRoom
  if (!model) return NextResponse.json({ rooms: [] })
  try {
    const rooms = await model.findMany({
      where: { customerRef },
      orderBy: { createdAt: "asc" },
      include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    })
    return NextResponse.json({ rooms })
  } catch { return NextResponse.json({ rooms: [] }) }
}

export async function POST(req: NextRequest) {
  const customerRef = ref(req)
  if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const model = (prisma as any).chatRoom
  if (!model) return NextResponse.json({ error: "db_not_ready" }, { status: 503 })
  const { name, emoji, color } = await req.json()
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 })
  try {
    const room = await model.create({ data: { customerRef, name, emoji, color: color ?? "#6366f1" } })
    return NextResponse.json({ room }, { status: 201 })
  } catch { return NextResponse.json({ error: "create_failed" }, { status: 500 }) }
}
