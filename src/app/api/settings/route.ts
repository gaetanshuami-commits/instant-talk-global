import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

type UserSettingsRow = {
  data?: Record<string, unknown> | null
}

type UserSettingsModel = {
  findUnique: (args: unknown) => Promise<UserSettingsRow | null>
  upsert: (args: unknown) => Promise<unknown>
}

function ref(req: NextRequest) {
  return req.cookies.get("instanttalk_customer_ref")?.value || null
}

export async function GET(req: NextRequest) {
  const customerRef = ref(req)
  if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const model = (prisma as unknown as { userSettings?: UserSettingsModel }).userSettings
  if (!model) return NextResponse.json({ settings: {} })
  try {
    const row = await model.findUnique({ where: { customerRef } })
    return NextResponse.json({ settings: (row?.data as Record<string, unknown>) ?? {} })
  } catch { return NextResponse.json({ settings: {} }) }
}

export async function PUT(req: NextRequest) {
  const customerRef = ref(req)
  if (!customerRef) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const model = (prisma as unknown as { userSettings?: UserSettingsModel }).userSettings
  if (!model) return NextResponse.json({ error: "db_not_ready" }, { status: 503 })
  try {
    const patch = await req.json()
    const existing = await model.findUnique({ where: { customerRef } })
    const merged = { ...(existing?.data as Record<string, unknown> ?? {}), ...patch }
    await model.upsert({ where: { customerRef }, update: { data: merged }, create: { customerRef, data: merged } })
    return NextResponse.json({ settings: merged })
  } catch { return NextResponse.json({ error: "save_failed" }, { status: 500 }) }
}
