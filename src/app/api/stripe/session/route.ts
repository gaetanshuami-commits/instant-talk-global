import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { normalizeAccess } from "@/lib/access";

export const runtime = "nodejs";

const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();

const stripe = stripeKey
  ? new Stripe(stripeKey, {
      apiVersion: "2026-02-25.clover",
    })
  : null;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "unknown_error";
}

function isActiveStatus(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}

async function syncSubscriptionFromStripeSession(session: Stripe.Checkout.Session) {
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  if (!subscriptionId || !customerId) {
    return null;
  }

  const subscription = await stripe!.subscriptions.retrieve(subscriptionId);
  const plan = normalizeAccess(session.metadata?.plan || subscription.metadata?.plan) || "premium";

  return prisma.subscription.upsert({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    update: {
      stripeCustomerId: customerId,
      plan,
      status: subscription.status,
      customerEmail: session.customer_details?.email || session.customer_email || null,
      currentPeriodEnd:
        typeof (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end === "number"
          ? new Date((subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end! * 1000)
          : null,
      trialEndsAt:
        typeof (subscription as Stripe.Subscription & { trial_end?: number | null }).trial_end === "number"
          ? new Date((subscription as Stripe.Subscription & { trial_end?: number | null }).trial_end! * 1000)
          : null,
    },
    create: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      plan,
      status: subscription.status,
      customerEmail: session.customer_details?.email || session.customer_email || null,
      currentPeriodEnd:
        typeof (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end === "number"
          ? new Date((subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end! * 1000)
          : null,
      trialEndsAt:
        typeof (subscription as Stripe.Subscription & { trial_end?: number | null }).trial_end === "number"
          ? new Date((subscription as Stripe.Subscription & { trial_end?: number | null }).trial_end! * 1000)
          : null,
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY" },
        { status: 500 }
      );
    }

    const sessionId = req.nextUrl.searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.mode !== "subscription") {
      return NextResponse.json(
        { error: "Invalid checkout session" },
        { status: 400 }
      );
    }

    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;

    const rawPlan = session.metadata?.plan || null;

    let dbSubscription = subscriptionId
      ? await prisma.subscription.findUnique({
          where: {
            stripeSubscriptionId: subscriptionId,
          },
        })
      : null;

    if (session.status === "complete" || session.payment_status === "paid" || isActiveStatus(dbSubscription?.status || null)) {
      if (!dbSubscription || !isActiveStatus(dbSubscription.status)) {
        dbSubscription = await syncSubscriptionFromStripeSession(session);
      }
    }

    const plan =
      normalizeAccess(dbSubscription?.plan || rawPlan || "premium") || "premium";

    return NextResponse.json({
      ok: true,
      sessionId: session.id,
      customerId:
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id || null,
      customerRef:
        session.client_reference_id ||
        session.metadata?.customerRef ||
        null,
      subscriptionId: subscriptionId || null,
      plan,
      dbStatus: dbSubscription?.status || null,
    });
  } catch (error) {
    console.error("STRIPE_SESSION_LOOKUP_ERROR", getErrorMessage(error));

    return NextResponse.json(
      {
        error: "Stripe session lookup failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
