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

  if (!channel) {
    return NextResponse.json({ error: "Missing channel parameter" }, { status: 400 })
  }

  // ── 1. Authenticate caller ───────────────────────────────────────────────────
  const cookiePlan = normalizeAccess(req.cookies.get("instanttalk_access")?.value)
  const customerRef = req.cookies.get("instanttalk_customer_ref")?.value || null

  if (!cookiePlan || !customerRef) {
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

  let subscription = null
  try {
    const subs = await prisma.subscription.findMany({
      where: {
        OR: [
          { stripeCustomerId: customerRef },
          { customerEmail: customerRef },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    })
    subscription = subs.find((s) => isActiveStatus(s.status)) ?? null
  } catch (err) {
    console.error("[agora-token] DB error", err)
    return NextResponse.json({ error: "Subscription check failed" }, { status: 500 })
  }

  if (!subscription) {
    return NextResponse.json(
      { error: "No active subscription found." },
      { status: 403 }
    )
  }

  // ── 3. Check subscription not expired ────────────────────────────────────────
  if (subscription.currentPeriodEnd && subscription.currentPeriodEnd < new Date()) {
    return NextResponse.json(
      { error: "Subscription expired." },
      { status: 403 }
    )
  }

  // ── 4. Get plan capabilities ──────────────────────────────────────────────────
  const plan = subscription.plan || cookiePlan || "premium"
  const caps = getCapabilities(plan)

  // ── 5. Enforce participant limit ──────────────────────────────────────────────
  // Count RoomSlots for this channel that are still within the TTL window.
  const cutoff = new Date(Date.now() - SLOT_TTL_MS)

  let activeSlotCount = 0
  let existingSlot: { uid: number } | null = null
  try {
    const slots = await prisma.roomSlot.findMany({
      where: {
        channelName: channel,
        joinedAt: { gte: cutoff },
      },
      select: { customerRef: true, uid: true },
    })
    existingSlot = slots.find((s) => s.customerRef === customerRef) ?? null
    // Count distinct participants excluding the current user's own slot
    const otherSlots = slots.filter((s) => s.customerRef !== customerRef)
    activeSlotCount = otherSlots.length
  } catch (err) {
    // Non-fatal: if RoomSlot table doesn't exist yet (migration pending), skip limit check
    console.warn("[agora-token] RoomSlot check skipped:", (err as Error).message)
  }

  if (activeSlotCount >= caps.maxParticipants) {
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
  // Assign or reuse UID — unique per (channel, customer).
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
      where: { channelName_customerRef: { channelName: channel, customerRef } },
      update: { joinedAt: new Date(), plan },
      create: { channelName: channel, customerRef, uid, plan },
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
      allowedLangs: caps.allowedLangs,
      summaryLevel: caps.summaryLevel,
      prioritySupport: caps.prioritySupport,
    },
  })
}
