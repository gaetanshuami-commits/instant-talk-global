import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

function ref(req: NextRequest) {
  return req.cookies.get("instanttalk_customer_ref")?.value || null
}

export async function GET(req: NextRequest) {
  const customerRef = ref(req)
  if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const model = (prisma as any).webinar
  if (!model) return NextResponse.json({ webinars: [] })
  try {
    const webinars = await model.findMany({ where: { customerRef }, orderBy: { startsAt: "asc" } })
    return NextResponse.json({ webinars })
  } catch { return NextResponse.json({ webinars: [] }) }
}

export async function POST(req: NextRequest) {
  const customerRef = ref(req)
  if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const model = (prisma as any).webinar
  if (!model) return NextResponse.json({ error: "db_not_ready" }, { status: 503 })
  const body = await req.json()
  const { title, topic, host, startsAt, durationMins, maxAttendees, langs, color } = body
  if (!title || !startsAt) return NextResponse.json({ error: "title and startsAt required" }, { status: 400 })
  try {
    const roomId = Math.random().toString(36).substring(2, 12)
    const webinar = await model.create({
      data: { customerRef, title, topic, host: host ?? "Gaetan", startsAt: new Date(startsAt),
        durationMins: durationMins ?? 60, maxAttendees: maxAttendees ?? 1000,
        langs: langs ?? [], color: color ?? "#6366f1", roomId },
    })
    return NextResponse.json({ webinar }, { status: 201 })
  } catch { return NextResponse.json({ error: "create_failed" }, { status: 500 }) }
}
