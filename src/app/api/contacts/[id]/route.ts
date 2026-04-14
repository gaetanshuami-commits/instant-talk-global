import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

type ContactModel = {
  updateMany: (args: unknown) => Promise<{ count: number }>
  deleteMany: (args: unknown) => Promise<unknown>
}

function ref(req: NextRequest) {
  return req.cookies.get("instanttalk_customer_ref")?.value || null
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const customerRef = ref(req)
  if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const model = (prisma as unknown as { contact?: ContactModel }).contact
  if (!model) return NextResponse.json({ error: "db_not_ready" }, { status: 503 })
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }
  const data = {
    ...(normalizeOptionalString(body.name) ? { name: normalizeOptionalString(body.name) } : {}),
    ...(normalizeOptionalString(body.email) ? { email: normalizeOptionalString(body.email) } : {}),
    ...(normalizeOptionalString(body.company) ? { company: normalizeOptionalString(body.company) } : {}),
    ...(normalizeOptionalString(body.role) ? { role: normalizeOptionalString(body.role) } : {}),
    ...(normalizeOptionalString(body.lang) ? { lang: normalizeOptionalString(body.lang) } : {}),
    ...(normalizeOptionalString(body.color) ? { color: normalizeOptionalString(body.color) } : {}),
    ...(typeof body.starred === "boolean" ? { starred: body.starred } : {}),
    ...(typeof body.online === "boolean" ? { online: body.online } : {}),
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "empty_update" }, { status: 400 })
  }
  try {
    const result = await model.updateMany({ where: { id, customerRef }, data })
    if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: "update_failed" }, { status: 500 }) }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const customerRef = ref(req)
  if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const model = (prisma as unknown as { contact?: ContactModel }).contact
  if (!model) return NextResponse.json({ error: "db_not_ready" }, { status: 503 })
  const { id } = await params
  try {
    await model.deleteMany({ where: { id, customerRef } })
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: "delete_failed" }, { status: 500 }) }
}
