import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

function ref(req: NextRequest) {
  return req.cookies.get("instanttalk_customer_ref")?.value || null
}

export async function GET(req: NextRequest) {
  const customerRef = ref(req)
  if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const model = (prisma as any).contact
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
  const model = (prisma as any).contact
  if (!model) return NextResponse.json({ error: "db_not_ready" }, { status: 503 })
  const body = await req.json()
  const { name, email, company, role, lang, color, starred } = body
  if (!name || !email) return NextResponse.json({ error: "name and email required" }, { status: 400 })
  try {
    const contact = await model.create({
      data: { customerRef, name, email, company, role, lang, color: color ?? "#6366f1", starred: starred ?? false },
    })
    return NextResponse.json({ contact }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Contact already exists" }, { status: 409 })
  }
}
