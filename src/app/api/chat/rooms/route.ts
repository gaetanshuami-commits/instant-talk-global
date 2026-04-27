import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/prisma"
import crypto from "node:crypto"

export const runtime = "nodejs"

function ref(req: NextRequest) { return req.cookies.get("instanttalk_customer_ref")?.value || null }

async function ensureChatSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "ChatRoom" (
      id          TEXT PRIMARY KEY,
      "customerRef" TEXT NOT NULL,
      name        TEXT NOT NULL,
      emoji       TEXT,
      color       TEXT NOT NULL DEFAULT '#6366f1',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS "ChatRoom_customerRef_idx" ON "ChatRoom"("customerRef");

    CREATE TABLE IF NOT EXISTS "ChatMessage" (
      id        TEXT PRIMARY KEY,
      "roomId"  TEXT NOT NULL REFERENCES "ChatRoom"(id) ON DELETE CASCADE,
      author    TEXT NOT NULL,
      text      TEXT NOT NULL,
      lang      TEXT,
      mine      BOOLEAN NOT NULL DEFAULT FALSE,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS "ChatMessage_roomId_idx" ON "ChatMessage"("roomId");
    CREATE INDEX IF NOT EXISTS "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");
  `)
}

export async function GET(req: NextRequest) {
  const customerRef = ref(req)
  if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    await ensureChatSchema()
    const { rows } = await pool.query(
      `SELECT r.id, r.name, r.color, r.emoji, r."createdAt",
         COALESCE(
           json_agg(m ORDER BY m."createdAt" DESC) FILTER (WHERE m.id IS NOT NULL),
           '[]'
         ) AS messages
       FROM "ChatRoom" r
       LEFT JOIN LATERAL (
         SELECT * FROM "ChatMessage" WHERE "roomId"=r.id ORDER BY "createdAt" DESC LIMIT 1
       ) m ON TRUE
       WHERE r."customerRef"=$1
       GROUP BY r.id
       ORDER BY r."createdAt" ASC`, [customerRef])
    return NextResponse.json({ rooms: rows })
  } catch { return NextResponse.json({ rooms: [] }) }
}

export async function POST(req: NextRequest) {
  const customerRef = ref(req)
  if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const body = await req.json().catch(() => ({}))
    const { name, emoji, color } = body as { name?: string; emoji?: string; color?: string }
    if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 })
    await ensureChatSchema()
    const { rows } = await pool.query(
      `INSERT INTO "ChatRoom" (id,"customerRef",name,emoji,color,"createdAt")
       VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *`,
      [crypto.randomUUID(), customerRef, name.trim(), emoji ?? null, color ?? "#6366f1"]
    )
    return NextResponse.json({ room: rows[0] }, { status: 201 })
  } catch (err) {
    console.error("[chat/rooms POST]", err)
    return NextResponse.json({ error: "create_failed" }, { status: 500 })
  }
}
