import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/prisma"
import crypto from "node:crypto"

export const runtime = "nodejs"

function ref(req: NextRequest) { return req.cookies.get("instanttalk_customer_ref")?.value || null }
function str(v: unknown) { const s = typeof v === "string" ? v.trim() : ""; return s || undefined }

export async function GET(req: NextRequest) {
  const customerRef = ref(req)
  if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const { rows } = await pool.query(
      `SELECT * FROM "Contact" WHERE "customerRef"=$1 ORDER BY starred DESC, name ASC`, [customerRef])
    return NextResponse.json({ contacts: rows })
  } catch { return NextResponse.json({ contacts: [] }) }
}

export async function POST(req: NextRequest) {
  const customerRef = ref(req)
  if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  const name = str(body.name); const email = str(body.email)
  if (!name || !email) return NextResponse.json({ error: "name and email required" }, { status: 400 })
  try {
    const id = crypto.randomUUID()
    const { rows } = await pool.query(
      `INSERT INTO "Contact" (id,"customerRef",name,email,company,role,lang,color,starred,online,"createdAt","updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,false,NOW(),NOW()) RETURNING *`,
      [id, customerRef, name, email, str(body.company)??null, str(body.role)??null,
       str(body.lang)??null, str(body.color)??"#6366f1", body.starred===true]
    )
    return NextResponse.json({ contact: rows[0] }, { status: 201 })
  } catch { return NextResponse.json({ error: "Contact already exists" }, { status: 409 }) }
}
