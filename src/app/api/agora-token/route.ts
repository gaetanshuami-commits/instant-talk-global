import { NextRequest, NextResponse } from "next/server"
import { RtcRole, RtcTokenBuilder } from "agora-access-token"
import { pool } from "@/lib/prisma"
import { normalizeAccess } from "@/lib/server-access"
import { getCapabilities } from "@/lib/planCapabilities"

export const runtime = "nodejs"

function isActiveStatus(status: string | null | undefined) {
  return status === "active" || status === "trialing"
}

const SLOT_TTL_MS = 2 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  const channel = req.nextUrl.searchParams.get("channel")
  const sid     = req.nextUrl.searchParams.get("sid") || ""

  if (!channel) {
    return NextResponse.json({ error: "Missing channel parameter" }, { status: 400 })
  }

  const cookiePlan  = normalizeAccess(req.cookies.get("instanttalk_access")?.value)
  const customerRef = req.cookies.get("instanttalk_customer_ref")?.value || null

  const isDemoChannel = channel === "demo-access"
  const isDevSession  = process.env.NODE_ENV === "development"

  if (!isDemoChannel && !isDevSession && (!cookiePlan || !customerRef)) {
    return NextResponse.json({ error: "No valid session. Please subscribe first." }, { status: 401 })
  }

  const appId          = process.env.NEXT_PUBLIC_AGORA_APP_ID
  const appCertificate = process.env.AGORA_APP_CERTIFICATE
  if (!appId || !appCertificate) {
    return NextResponse.json({ error: "Missing Agora credentials" }, { status: 500 })
  }

  let plan: string
  let effectiveCustomerRef: string

  if (isDemoChannel) {
    plan = "trial"
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip") || "guest"
    effectiveCustomerRef = `demo:${ip}`
  } else if (isDevSession) {
    plan = cookiePlan || "business"
    effectiveCustomerRef = customerRef || `dev:${sid || "anon"}`
  } else {
    // ── DB check via pg direct (no Prisma WASM) ──────────────────────────────
    let subscription: { plan: string; status: string; currentPeriodEnd: Date | null; enterpriseEnabled: boolean } | null = null
    let dbAvailable = true
    try {
      const { rows } = await pool.query<{
        plan: string; status: string; "currentPeriodEnd": Date | null; "enterpriseEnabled": boolean
      }>(
        `SELECT plan, status, "currentPeriodEnd", "enterpriseEnabled"
         FROM "Subscription"
         WHERE ("stripeCustomerId" = $1 OR "customerEmail" = $1)
           AND status IN ('active','trialing')
         ORDER BY "updatedAt" DESC
         LIMIT 5`,
        [customerRef]
      )
      subscription = rows[0] ?? null
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn("[agora-token] DB unavailable, falling back to cookie plan:", msg.slice(0, 120))
      dbAvailable = false
    }

    if (dbAvailable && !subscription) {
      return NextResponse.json({ error: "No active subscription found." }, { status: 403 })
    }

    if (dbAvailable && subscription?.currentPeriodEnd && subscription.currentPeriodEnd < new Date()) {
      return NextResponse.json({ error: "Subscription expired." }, { status: 403 })
    }

    plan = (dbAvailable && subscription)
      ? (subscription.enterpriseEnabled ? "enterprise" : (subscription.plan || cookiePlan || "premium"))
      : (cookiePlan || "premium")
    effectiveCustomerRef = customerRef!
  }

  const caps    = getCapabilities(plan)
  const slotKey = sid ? `${effectiveCustomerRef}:${sid}` : effectiveCustomerRef
  const cutoff  = new Date(Date.now() - SLOT_TTL_MS)

  let activeSlotCount = 0
  let existingUid: number | null = null
  try {
    // Purge expired slots (fire-and-forget)
    pool.query(`DELETE FROM "RoomSlot" WHERE "joinedAt" < $1`, [cutoff]).catch(() => {})

    const { rows } = await pool.query<{ customerRef: string; uid: number }>(
      `SELECT "customerRef", uid FROM "RoomSlot" WHERE "channelName" = $1 AND "joinedAt" >= $2`,
      [channel, cutoff]
    )
    existingUid   = rows.find(s => s.customerRef === slotKey)?.uid ?? null
    activeSlotCount = rows.filter(s => s.customerRef !== slotKey).length
  } catch (err) {
    console.warn("[agora-token] RoomSlot check skipped:", (err as Error).message)
  }

  if (!isDevSession && activeSlotCount >= caps.maxParticipants) {
    return NextResponse.json({
      error: `Room full. Your ${plan} plan allows up to ${caps.maxParticipants} participants.`,
      code: "ROOM_FULL",
      maxParticipants: caps.maxParticipants,
    }, { status: 403 })
  }

  const uid    = existingUid ?? (Math.floor(Math.random() * 900000) + 100000)
  const expire = Math.floor(Date.now() / 1000) + 3600

  const token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channel, uid, RtcRole.PUBLISHER, expire)

  // Upsert room slot
  try {
    await pool.query(
      `INSERT INTO "RoomSlot" ("channelName","customerRef","uid","plan","joinedAt")
       VALUES ($1,$2,$3,$4,NOW())
       ON CONFLICT ("channelName","customerRef")
       DO UPDATE SET "joinedAt"=NOW(), plan=$4`,
      [channel, slotKey, uid, plan]
    )
  } catch (err) {
    console.warn("[agora-token] RoomSlot upsert skipped:", (err as Error).message)
  }

  return NextResponse.json({
    appId, channel, token, uid, expire, plan,
    caps: {
      maxParticipants: caps.maxParticipants,
      maxLanguages:    caps.maxLanguages,
      allowedLangs:    null,
      summaryLevel:    caps.summaryLevel,
      prioritySupport: caps.prioritySupport,
    },
  })
}
