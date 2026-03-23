import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey
  ? new Stripe(stripeKey, {
      apiVersion: "2026-02-25.clover",
    })
  : null;

const PLAN_CONFIG = {
  premium: {
    name: "Instant Talk Premium",
    description: "Premium monthly access to realtime multilingual meetings",
    unitAmount: 2400,
  },
  business: {
    name: "Instant Talk Business",
    description: "Business monthly access for multilingual team meetings",
    unitAmount: 9900,
  },
} as const;

type CheckoutPlan = keyof typeof PLAN_CONFIG;

function isCheckoutPlan(value: string): value is CheckoutPlan {
  return value === "premium" || value === "business";
}

export async function POST(req: Request) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawPlan = String(body?.plan || "premium").toLowerCase();

    if (!isCheckoutPlan(rawPlan)) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    const plan = PLAN_CONFIG[rawPlan];
    const origin = new URL(req.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: plan.name,
              description: plan.description,
            },
            recurring: {
              interval: "month",
            },
            unit_amount: plan.unitAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        plan: rawPlan,
      },
      success_url: `${origin}/success?plan=${rawPlan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      plan: rawPlan,
    });
  } catch (error) {
    console.error("STRIPE_CHECKOUT_ERROR", error);

    return NextResponse.json(
      {
        error: "Stripe checkout failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
