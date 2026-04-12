import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

function ref(req: NextRequest) {
  return req.cookies.get("instanttalk_customer_ref")?.value || null
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const customerRef = ref(req)
  if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const model = (prisma as any).webinar
  if (!model) return NextResponse.json({ error: "db_not_ready" }, { status: 503 })
  const { id } = await params
  const body = await req.json()
  if (body.startsAt) body.startsAt = new Date(body.startsAt)
  try {
    const result = await model.updateMany({ where: { id, customerRef }, data: body })
    if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: "update_failed" }, { status: 500 }) }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const customerRef = ref(req)
  if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const model = (prisma as any).webinar
  if (!model) return NextResponse.json({ error: "db_not_ready" }, { status: 503 })
  const { id } = await params
  try {
    await model.deleteMany({ where: { id, customerRef } })
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: "delete_failed" }, { status: 500 }) }
}
