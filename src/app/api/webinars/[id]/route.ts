import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/prisma"

export const runtime = "nodejs"

function ref(req: NextRequest) { return req.cookies.get("instanttalk_customer_ref")?.value || null }

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const customerRef = ref(req); if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const sets: string[] = []; const vals: unknown[] = [id, customerRef]
  const allowed = ["title","topic","host","startsAt","durationMins","maxAttendees","langs","color","status"]
  for (const k of allowed) {
    if (body[k] !== undefined) {
      const v = k === "startsAt" ? new Date(body[k]) : body[k]
      sets.push(`"${k}"=$${vals.length+1}`)
      vals.push(v)
    }
  }
  if (sets.length === 0) return NextResponse.json({ error: "empty_update" }, { status: 400 })
  sets.push(`"updatedAt"=NOW()`)
  try {
    const { rowCount } = await pool.query(`UPDATE "Webinar" SET ${sets.join(",")} WHERE id=$1 AND "customerRef"=$2`, vals)
    if (!rowCount) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: "update_failed" }, { status: 500 }) }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const customerRef = ref(req); if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  try {
    await pool.query(`DELETE FROM "Webinar" WHERE id=$1 AND "customerRef"=$2`, [id, customerRef])
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: "delete_failed" }, { status: 500 }) }
}
