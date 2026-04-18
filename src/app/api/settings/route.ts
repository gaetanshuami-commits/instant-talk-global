import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/prisma"

export const runtime = "nodejs"

function ref(req: NextRequest) { return req.cookies.get("instanttalk_customer_ref")?.value || null }

export async function GET(req: NextRequest) {
  const customerRef = ref(req)
  if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const { rows } = await pool.query(`SELECT data FROM "UserSettings" WHERE "customerRef"=$1 LIMIT 1`, [customerRef])
    return NextResponse.json({ settings: rows[0]?.data ?? {} })
  } catch { return NextResponse.json({ settings: {} }) }
}

export async function PUT(req: NextRequest) {
  const customerRef = ref(req)
  if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const patch = await req.json()
    const { rows } = await pool.query(`SELECT data FROM "UserSettings" WHERE "customerRef"=$1 LIMIT 1`, [customerRef])
    const merged = { ...(rows[0]?.data ?? {}), ...patch }
    await pool.query(
      `INSERT INTO "UserSettings" (id,"customerRef",data,"updatedAt") VALUES (gen_random_uuid()::text,$1,$2::jsonb,NOW())
       ON CONFLICT ("customerRef") DO UPDATE SET data=$2::jsonb, "updatedAt"=NOW()`,
      [customerRef, JSON.stringify(merged)]
    )
    return NextResponse.json({ settings: merged })
  } catch { return NextResponse.json({ error: "save_failed" }, { status: 500 }) }
}
