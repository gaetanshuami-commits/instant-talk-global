import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { normalizeAccess } from "@/lib/access";

export const runtime = "nodejs";

const stripeKey = process.env.STRIPE_SECRET_KEY;

const stripe = stripeKey
  ? new Stripe(stripeKey, {
      apiVersion: "2026-02-25.clover",
    })
  : null;

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

    const dbSubscription = subscriptionId
      ? await prisma.subscription.findUnique({
          where: {
            stripeSubscriptionId: subscriptionId,
          },
        })
      : null;

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
    console.error("STRIPE_SESSION_LOOKUP_ERROR", error);

    return NextResponse.json(
      {
        error: "Stripe session lookup failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
