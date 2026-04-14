import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

type ContactModel = {
  findMany: (args: unknown) => Promise<unknown[]>
  create: (args: unknown) => Promise<unknown>
}

function ref(req: NextRequest) {
  return req.cookies.get("instanttalk_customer_ref")?.value || null
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

export async function GET(req: NextRequest) {
  const customerRef = ref(req)
  if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const model = (prisma as unknown as { contact?: ContactModel }).contact
  if (!model) return NextResponse.json({ contacts: [] })
  try {
    const contacts = await model.findMany({
      where: { customerRef },
      orderBy: [{ starred: "desc" }, { name: "asc" }],
    })
    return NextResponse.json({ contacts })
  } catch { return NextResponse.json({ contacts: [] }) }
}

export async function POST(req: NextRequest) {
  const customerRef = ref(req)
  if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const model = (prisma as unknown as { contact?: ContactModel }).contact
  if (!model) return NextResponse.json({ error: "db_not_ready" }, { status: 503 })
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }
  const name = normalizeOptionalString(body.name)
  const email = normalizeOptionalString(body.email)
  const company = normalizeOptionalString(body.company)
  const role = normalizeOptionalString(body.role)
  const lang = normalizeOptionalString(body.lang)
  const color = normalizeOptionalString(body.color)
  const starred = body.starred === true
  if (!name || !email) return NextResponse.json({ error: "name and email required" }, { status: 400 })
  try {
    const contact = await model.create({
      data: { customerRef, name, email, company, role, lang, color: color ?? "#6366f1", starred },
    })
    return NextResponse.json({ contact }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Contact already exists" }, { status: 409 })
  }
}
