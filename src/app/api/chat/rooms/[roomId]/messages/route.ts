import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/prisma"
import crypto from "node:crypto"

export const runtime = "nodejs"

function ref(req: NextRequest) { return req.cookies.get("instanttalk_customer_ref")?.value || null }

export async function GET(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const customerRef = ref(req)
  if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { roomId } = await params
  try {
    const { rows: rooms } = await pool.query(
      `SELECT id FROM "ChatRoom" WHERE id=$1 AND "customerRef"=$2 LIMIT 1`, [roomId, customerRef])
    if (!rooms[0]) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const { rows } = await pool.query(
      `SELECT * FROM "ChatMessage" WHERE "roomId"=$1 ORDER BY "createdAt" ASC LIMIT 200`, [roomId])
    return NextResponse.json({ messages: rows })
  } catch { return NextResponse.json({ messages: [] }) }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  const customerRef = ref(req)
  if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { roomId } = await params
  try {
    const { rows: rooms } = await pool.query(
      `SELECT id FROM "ChatRoom" WHERE id=$1 AND "customerRef"=$2 LIMIT 1`, [roomId, customerRef])
    if (!rooms[0]) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const { author, text, lang, mine } = await req.json()
    if (!author || !text) return NextResponse.json({ error: "author and text required" }, { status: 400 })
    const { rows } = await pool.query(
      `INSERT INTO "ChatMessage" (id,"roomId",author,text,lang,mine,"createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING *`,
      [crypto.randomUUID(), roomId, author, text, lang??null, mine??false]
    )
    return NextResponse.json({ message: rows[0] }, { status: 201 })
  } catch { return NextResponse.json({ error: "create_failed" }, { status: 500 }) }
}
