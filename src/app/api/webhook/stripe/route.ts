import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { pool } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeKey     = process.env.STRIPE_SECRET_KEY?.trim();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" }) : null;

function unixToDate(v: number | null | undefined) {
  return typeof v === "number" ? new Date(v * 1000) : null;
}
function normalizePlan(v: string | null | undefined) {
  if (v === "premium" || v === "business" || v === "trial") return v;
  return "premium";
}

async function upsertSub(
  customerId: string, subId: string, plan: string, status: string,
  email: string | null, periodEnd: Date | null, trialEnd: Date | null
) {
  await pool.query(
    `INSERT INTO "Subscription"
       (id,"stripeCustomerId","stripeSubscriptionId",plan,status,"customerEmail",
        "currentPeriodEnd","trialEndsAt","createdAt","updatedAt")
     VALUES (gen_random_uuid()::text,$1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
     ON CONFLICT ("stripeSubscriptionId")
     DO UPDATE SET
       "stripeCustomerId"=$1, plan=$3, status=$4, "customerEmail"=COALESCE($5,"Subscription"."customerEmail"),
       "currentPeriodEnd"=$6, "trialEndsAt"=$7, "updatedAt"=NOW()`,
    [customerId, subId, plan, status, email, periodEnd, trialEnd]
  );
}

export async function POST(req: Request) {
  if (!stripe)        return new NextResponse("Stripe Secret Missing", { status: 500 });
  if (!webhookSecret) return new NextResponse("Webhook Secret Missing", { status: 400 });

  try {
    const body      = await req.text();
    const hdrs      = await headers();
    const signature = hdrs.get("Stripe-Signature") || "";
    const event     = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
        if (session.mode !== "subscription" || !customerId) break;

        const subId = typeof session.subscription === "string"
          ? session.subscription : (session.subscription as Stripe.Subscription)?.id;
        if (!subId) break;

        const sub = await stripe.subscriptions.retrieve(subId) as
          Stripe.Subscription & { current_period_end?: number; trial_end?: number | null };

        await upsertSub(
          String(customerId), sub.id,
          normalizePlan(session.metadata?.plan || sub.metadata?.plan),
          sub.status,
          session.customer_details?.email || session.customer_email || null,
          unixToDate(sub.current_period_end), unixToDate(sub.trial_end ?? null)
        );
        console.info("[webhook] checkout.session.completed", sub.id);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription &
          { current_period_end?: number; trial_end?: number | null };
        await upsertSub(
          String(sub.customer), sub.id,
          normalizePlan(sub.metadata?.plan), sub.status, null,
          unixToDate(sub.current_period_end), unixToDate(sub.trial_end ?? null)
        );
        console.info("[webhook] subscription", event.type, sub.id, sub.status);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription &
          { current_period_end?: number };
        await pool.query(
          `UPDATE "Subscription" SET status='canceled', "currentPeriodEnd"=$2, "updatedAt"=NOW()
           WHERE "stripeSubscriptionId"=$1`,
          [sub.id, unixToDate(sub.current_period_end)]
        );
        break;
      }

      default:
        console.info("[webhook] ignored", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("STRIPE_WEBHOOK_ERROR", error);
    return new NextResponse("Webhook Error", { status: 400 });
  }
}
