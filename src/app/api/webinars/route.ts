import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/prisma"
import crypto from "node:crypto"

export const runtime = "nodejs"

function ref(req: NextRequest) { return req.cookies.get("instanttalk_customer_ref")?.value || null }

export async function GET(req: NextRequest) {
  const customerRef = ref(req)
  if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const { rows } = await pool.query(
      `SELECT * FROM "Webinar" WHERE "customerRef"=$1 ORDER BY "startsAt" ASC`, [customerRef])
    return NextResponse.json({ webinars: rows })
  } catch { return NextResponse.json({ webinars: [] }) }
}

export async function POST(req: NextRequest) {
  const customerRef = ref(req)
  if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  const { title, topic, host, startsAt, durationMins, maxAttendees, langs, color } = body
  if (!title || !startsAt) return NextResponse.json({ error: "title and startsAt required" }, { status: 400 })
  try {
    const id = crypto.randomUUID()
    const roomId = Math.random().toString(36).substring(2, 12)
    const { rows } = await pool.query(
      `INSERT INTO "Webinar" (id,"customerRef",title,topic,host,"startsAt","durationMins","maxAttendees",langs,color,status,"roomId","createdAt","updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'UPCOMING',$11,NOW(),NOW()) RETURNING *`,
      [id, customerRef, title, topic??null, host??"Gaetan", new Date(startsAt),
       durationMins??60, maxAttendees??1000, langs??[], color??"#6366f1", roomId]
    )
    return NextResponse.json({ webinar: rows[0] }, { status: 201 })
  } catch { return NextResponse.json({ error: "create_failed" }, { status: 500 }) }
}
