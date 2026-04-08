import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeKey     = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeKey
  ? new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" })
  : null;

function unixToDate(value: number | null | undefined): Date | null {
  return typeof value === "number" ? new Date(value * 1000) : null;
}

function getSubscriptionCurrentPeriodEnd(sub: Stripe.Subscription): Date | null {
  const raw = (sub as Stripe.Subscription & { current_period_end?: number }).current_period_end;
  return unixToDate(raw);
}

function getTrialEnd(sub: Stripe.Subscription): Date | null {
  const raw = (sub as Stripe.Subscription & { trial_end?: number | null }).trial_end;
  return typeof raw === "number" ? unixToDate(raw) : null;
}

function normalizePlan(value: string | null | undefined) {
  if (value === "premium" || value === "business" || value === "trial") return value;
  return "premium";
}

export async function POST(req: Request) {
  if (!stripe)        return new NextResponse("Stripe Secret Missing", { status: 500 });
  if (!webhookSecret) return new NextResponse("Webhook Secret Missing", { status: 400 });

  try {
    const body       = await req.text();
    const headerList = await headers();
    const signature  = headerList.get("Stripe-Signature") || "";

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    switch (event.type) {
      // ── Checkout completed ────────────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;

        if (session.mode === "subscription" && subscriptionId && customerId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);

          await prisma.subscription.upsert({
            where: { stripeSubscriptionId: sub.id },
            update: {
              stripeCustomerId: String(customerId),
              plan: normalizePlan(session.metadata?.plan || sub.metadata?.plan),
              status: sub.status,
              customerEmail: session.customer_details?.email || session.customer_email || null,
              currentPeriodEnd: getSubscriptionCurrentPeriodEnd(sub),
              trialEndsAt: getTrialEnd(sub),
            },
            create: {
              stripeCustomerId: String(customerId),
              stripeSubscriptionId: sub.id,
              plan: normalizePlan(session.metadata?.plan || sub.metadata?.plan),
              status: sub.status,
              customerEmail: session.customer_details?.email || session.customer_email || null,
              currentPeriodEnd: getSubscriptionCurrentPeriodEnd(sub),
              trialEndsAt: getTrialEnd(sub),
            },
          });
        }
        break;
      }

      // ── Subscription created / updated ────────────────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;

        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: sub.id },
          update: {
            stripeCustomerId: String(sub.customer),
            plan: normalizePlan(sub.metadata?.plan),
            status: sub.status,
            currentPeriodEnd: getSubscriptionCurrentPeriodEnd(sub),
            trialEndsAt: getTrialEnd(sub),
          },
          create: {
            stripeCustomerId: String(sub.customer),
            stripeSubscriptionId: sub.id,
            plan: normalizePlan(sub.metadata?.plan),
            status: sub.status,
            customerEmail: null,
            currentPeriodEnd: getSubscriptionCurrentPeriodEnd(sub),
            trialEndsAt: getTrialEnd(sub),
          },
        });
        break;
      }

      // ── Trial ending soon (3-day warning from Stripe) ─────────────────────────
      case "customer.subscription.trial_will_end": {
        const sub = event.data.object as Stripe.Subscription;
        console.info("[STRIPE] Trial will end for subscription", sub.id);
        // trialEndsAt is already stored; no additional action needed here.
        // A future enhancement: send a reminder email via /api/contact.
        break;
      }

      // ── Subscription canceled / deleted ───────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            status: "canceled",
            currentPeriodEnd: getSubscriptionCurrentPeriodEnd(sub),
          },
        });
        break;
      }

      default:
        console.log("STRIPE_EVENT_IGNORED", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("STRIPE_WEBHOOK_ERROR", error);
    return new NextResponse("Webhook Error", { status: 400 });
  }
}
