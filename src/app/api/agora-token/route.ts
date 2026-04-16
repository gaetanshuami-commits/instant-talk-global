import { NextRequest, NextResponse } from "next/server"
import { RtcRole, RtcTokenBuilder } from "agora-access-token"
import { prisma } from "@/lib/prisma"
import { normalizeAccess } from "@/lib/server-access"
import { getCapabilities } from "@/lib/planCapabilities"

export const runtime = "nodejs"

function isActiveStatus(status: string | null | undefined) {
  return status === "active" || status === "trialing"
}

// A "session" slot is considered active if the last join was within 2 hours.
// Beyond that, the slot is stale and doesn't count toward the participant limit.
const SLOT_TTL_MS = 2 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  const channel = req.nextUrl.searchParams.get("channel")
  const sid     = req.nextUrl.searchParams.get("sid") || ""

  if (!channel) {
    return NextResponse.json({ error: "Missing channel parameter" }, { status: 400 })
  }

  // ── 1. Authenticate caller ───────────────────────────────────────────────────
  const cookiePlan = normalizeAccess(req.cookies.get("instanttalk_access")?.value)
  const customerRef = req.cookies.get("instanttalk_customer_ref")?.value || null

  // Demo channel: bypass auth — anyone can join without a subscription.
  // Uses "trial" plan caps (5 participants, 10 languages) and a fixed customer ref.
  const isDemoChannel = channel === "demo-access"
  // Dev bypass: any local dev session can enter rooms without cookies.
  const isDevSession = process.env.NODE_ENV === "development"

  if (!isDemoChannel && !isDevSession && (!cookiePlan || !customerRef)) {
    return NextResponse.json(
      { error: "No valid session. Please subscribe first." },
      { status: 401 }
    )
  }

  // ── 2. Verify subscription in database ──────────────────────────────────────
  const appId          = process.env.NEXT_PUBLIC_AGORA_APP_ID
  const appCertificate = process.env.AGORA_APP_CERTIFICATE

  if (!appId || !appCertificate) {
    return NextResponse.json({ error: "Missing Agora credentials" }, { status: 500 })
  }

  // ── 4. Get plan capabilities ──────────────────────────────────────────────────
  let plan: string
  let effectiveCustomerRef: string

  if (isDemoChannel) {
    // Demo room: trial plan, stable per-IP guest ref so slot tracking still works.
    plan = "trial"
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "guest"
    effectiveCustomerRef = `demo:${ip}`
  } else if (isDevSession) {
    // Dev mode: skip DB sub check, use cookie ref or fall back to session ID.
    plan = cookiePlan || "business"
    effectiveCustomerRef = customerRef || `dev:${sid || "anon"}`
  } else {
    let subscription = null
    try {
      const subs = await prisma.subscription.findMany({
        where: {
          OR: [
            { stripeCustomerId: customerRef ?? undefined },
            { customerEmail: customerRef ?? undefined },
          ],
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      })
      subscription = subs.find((s) => isActiveStatus(s.status)) ?? null
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error("[agora-token] DB error:", msg)
      return NextResponse.json({ error: "Subscription check failed", detail: msg }, { status: 500 })
    }

    if (!subscription) {
      return NextResponse.json(
        { error: "No active subscription found." },
        { status: 403 }
      )
    }

    // ── 3. Check subscription not expired ──────────────────────────────────────
    if (subscription.currentPeriodEnd && subscription.currentPeriodEnd < new Date()) {
      return NextResponse.json(
        { error: "Subscription expired." },
        { status: 403 }
      )
    }

    // If the subscription has enterpriseEnabled, treat as enterprise regardless of plan field.
    plan = subscription.enterpriseEnabled
      ? "enterprise"
      : (subscription.plan || cookiePlan || "premium")
    effectiveCustomerRef = customerRef!
  }

  const caps = getCapabilities(plan)

  // ── 5. Enforce participant limit ──────────────────────────────────────────────
  // Each browser tab gets a unique slot via (customerRef + sessionId).
  // This prevents two tabs from the same account sharing a UID and conflicting
  // in Agora (which treats two clients with the same UID as one user and kicks
  // the older one, making each participant see only themselves).
  const slotKey = sid ? `${effectiveCustomerRef}:${sid}` : effectiveCustomerRef
  const cutoff  = new Date(Date.now() - SLOT_TTL_MS)

  let activeSlotCount = 0
  let existingSlot: { uid: number } | null = null
  try {
    // Passively purge expired slots across all channels (fire-and-forget, non-blocking).
    prisma.roomSlot.deleteMany({ where: { joinedAt: { lt: cutoff } } }).catch(() => {})

    const slots = await prisma.roomSlot.findMany({
      where: {
        channelName: channel,
        joinedAt: { gte: cutoff },
      },
      select: { customerRef: true, uid: true },
    })
    // Match on composite key — same tab can reconnect and reuse its UID
    existingSlot = slots.find((s) => s.customerRef === slotKey) ?? null
    // Count distinct participants excluding this tab's own slot
    const otherSlots = slots.filter((s) => s.customerRef !== slotKey)
    activeSlotCount = otherSlots.length
  } catch (err) {
    // Non-fatal: if RoomSlot table doesn't exist yet (migration pending), skip limit check
    console.warn("[agora-token] RoomSlot check skipped:", (err as Error).message)
  }

  // Dev mode: never block on participant count — stale slots from previous test
  // sessions would otherwise lock out the developer from their own demo room.
  if (!isDevSession && activeSlotCount >= caps.maxParticipants) {
    return NextResponse.json(
      {
        error: `Room full. Your ${plan} plan allows up to ${caps.maxParticipants} participants.`,
        code: "ROOM_FULL",
        maxParticipants: caps.maxParticipants,
      },
      { status: 403 }
    )
  }

  // ── 6. Generate Agora token ──────────────────────────────────────────────────
  // Reuse UID for this tab's reconnection; assign fresh UID for new tabs.
  const uid = existingSlot?.uid ?? (Math.floor(Math.random() * 900000) + 100000)
  const expire = Math.floor(Date.now() / 1000) + 3600

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channel,
    uid,
    RtcRole.PUBLISHER,
    expire
  )

  // ── 7. Upsert room slot ───────────────────────────────────────────────────────
  try {
    await prisma.roomSlot.upsert({
      where:  { channelName_customerRef: { channelName: channel, customerRef: slotKey } },
      update: { joinedAt: new Date(), plan },
      create: { channelName: channel, customerRef: slotKey, uid, plan },
    })
  } catch (err) {
    // Non-fatal: skip if migration not yet applied
    console.warn("[agora-token] RoomSlot upsert skipped:", (err as Error).message)
  }

  return NextResponse.json({
    appId,
    channel,
    token,
    uid,
    expire,
    // Return capabilities to the client for language/feature enforcement
    plan,
    caps: {
      maxParticipants: caps.maxParticipants,
      maxLanguages: caps.maxLanguages,
      // null = toutes les 26 langues disponibles sans restriction de plan
      allowedLangs: null,
      summaryLevel: caps.summaryLevel,
      prioritySupport: caps.prioritySupport,
    },
  })
}
