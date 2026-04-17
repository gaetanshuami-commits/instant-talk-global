import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { pool } from "@/lib/prisma";
import { normalizeAccess } from "@/lib/access";

export const runtime = "nodejs";

const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" }) : null;

function isActiveStatus(s: string | null | undefined) {
  return s === "active" || s === "trialing";
}

async function upsertSubscription(
  customerId: string,
  subscriptionId: string,
  plan: string,
  status: string,
  email: string | null,
  currentPeriodEnd: Date | null,
  trialEndsAt: Date | null,
) {
  await pool.query(
    `INSERT INTO "Subscription"
       (id, "stripeCustomerId", "stripeSubscriptionId", plan, status, "customerEmail",
        "currentPeriodEnd", "trialEndsAt", "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text,$1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
     ON CONFLICT ("stripeSubscriptionId")
     DO UPDATE SET
       "stripeCustomerId"=$1, plan=$3, status=$4, "customerEmail"=$5,
       "currentPeriodEnd"=$6, "trialEndsAt"=$7, "updatedAt"=NOW()`,
    [customerId, subscriptionId, plan, status, email, currentPeriodEnd, trialEndsAt]
  );
  return { plan, status };
}

export async function GET(req: NextRequest) {
  try {
    if (!stripe) return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });

    const sessionId = req.nextUrl.searchParams.get("session_id");
    if (!sessionId) return NextResponse.json({ error: "Missing session_id" }, { status: 400 });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || session.mode !== "subscription") {
      return NextResponse.json({ error: "Invalid checkout session" }, { status: 400 });
    }

    const subscriptionId = typeof session.subscription === "string"
      ? session.subscription : session.subscription?.id;
    const customerId = typeof session.customer === "string"
      ? session.customer : session.customer?.id;
    const rawPlan = session.metadata?.plan || null;

    // Check DB via pg direct
    let dbPlan: string | null = null;
    let dbStatus: string | null = null;
    if (subscriptionId) {
      try {
        const { rows } = await pool.query<{ plan: string; status: string }>(
          `SELECT plan, status FROM "Subscription" WHERE "stripeSubscriptionId"=$1 LIMIT 1`,
          [subscriptionId]
        );
        if (rows[0]) { dbPlan = rows[0].plan; dbStatus = rows[0].status; }
      } catch { /* not yet in DB — will sync below */ }
    }

    // Sync from Stripe if not in DB or not active
    if ((session.status === "complete" || session.payment_status === "paid") &&
        (!dbStatus || !isActiveStatus(dbStatus))) {
      try {
        if (subscriptionId && customerId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId) as
            Stripe.Subscription & { current_period_end?: number; trial_end?: number | null };
          const plan = normalizeAccess(session.metadata?.plan || sub.metadata?.plan) || "premium";
          const email = session.customer_details?.email || session.customer_email || null;
          const cpe = typeof sub.current_period_end === "number" ? new Date(sub.current_period_end * 1000) : null;
          const te  = typeof sub.trial_end === "number" ? new Date(sub.trial_end * 1000) : null;
          const result = await upsertSubscription(customerId, sub.id, plan, sub.status, email, cpe, te);
          dbPlan   = result.plan;
          dbStatus = result.status;
        }
      } catch (syncErr) {
        console.error("[stripe/session] sync error:", syncErr);
      }
    }

    const plan = normalizeAccess(dbPlan || rawPlan || "premium") || "premium";

    return NextResponse.json({
      ok: true,
      sessionId: session.id,
      customerId: customerId || null,
      customerRef: session.client_reference_id || session.metadata?.customerRef || null,
      subscriptionId: subscriptionId || null,
      plan,
      dbStatus,
    });
  } catch (error) {
    console.error("STRIPE_SESSION_LOOKUP_ERROR", error);
    return NextResponse.json({ error: "Stripe session lookup failed",
      details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
