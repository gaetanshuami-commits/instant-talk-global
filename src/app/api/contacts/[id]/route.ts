import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/prisma"

export const runtime = "nodejs"

function ref(req: NextRequest) { return req.cookies.get("instanttalk_customer_ref")?.value || null }
function str(v: unknown) { const s = typeof v === "string" ? v.trim() : ""; return s || undefined }

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const customerRef = ref(req); if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "invalid_json" }, { status: 400 })

  const sets: string[] = []; const vals: unknown[] = [id, customerRef]
  const fields: Record<string, unknown> = {
    name: str(body.name), email: str(body.email), company: str(body.company),
    role: str(body.role), lang: str(body.lang), color: str(body.color),
    ...(typeof body.starred === "boolean" ? { starred: body.starred } : {}),
    ...(typeof body.online === "boolean" ? { online: body.online } : {}),
  }
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) { sets.push(`"${k}"=$${vals.length + 1}`); vals.push(v) }
  }
  if (sets.length === 0) return NextResponse.json({ error: "empty_update" }, { status: 400 })
  sets.push(`"updatedAt"=NOW()`)
  try {
    const { rowCount } = await pool.query(
      `UPDATE "Contact" SET ${sets.join(",")} WHERE id=$1 AND "customerRef"=$2`, vals)
    if (!rowCount) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: "update_failed" }, { status: 500 }) }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const customerRef = ref(req); if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  try {
    await pool.query(`DELETE FROM "Contact" WHERE id=$1 AND "customerRef"=$2`, [id, customerRef])
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: "delete_failed" }, { status: 500 }) }
}
