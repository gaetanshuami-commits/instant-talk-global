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
      `SELECT r.*, (
         SELECT row_to_json(m) FROM (
           SELECT * FROM "ChatMessage" WHERE "roomId"=r.id ORDER BY "createdAt" DESC LIMIT 1
         ) m
       ) AS "lastMessage"
       FROM "ChatRoom" r WHERE r."customerRef"=$1 ORDER BY r."createdAt" ASC`, [customerRef])
    return NextResponse.json({ rooms: rows })
  } catch { return NextResponse.json({ rooms: [] }) }
}

export async function POST(req: NextRequest) {
  const customerRef = ref(req)
  if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { name, emoji, color } = await req.json()
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 })
  try {
    const { rows } = await pool.query(
      `INSERT INTO "ChatRoom" (id,"customerRef",name,emoji,color,"createdAt")
       VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *`,
      [crypto.randomUUID(), customerRef, name, emoji??null, color??"#6366f1"]
    )
    return NextResponse.json({ room: rows[0] }, { status: 201 })
  } catch { return NextResponse.json({ error: "create_failed" }, { status: 500 }) }
}
