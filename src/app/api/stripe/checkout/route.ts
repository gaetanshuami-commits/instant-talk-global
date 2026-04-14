import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
const stripe = stripeKey
  ? new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" })
  : null;

const PLAN_CONFIG = {
  premium: {
    name: "Instant Talk Premium",
    description: "Traduction vocale temps réel — jusqu'à 5 participants, 10 langues",
    unitAmount: 2400,
  },
  business: {
    name: "Instant Talk Business",
    description: "Réunions d'équipe multilingues — jusqu'à 50 participants, 20 langues",
    unitAmount: 9900,
  },
} as const;

type CheckoutPlan = keyof typeof PLAN_CONFIG;

function isCheckoutPlan(value: string): value is CheckoutPlan {
  return value === "premium" || value === "business";
}

function createCustomerRef() {
  return `itr_${crypto.randomUUID()}`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "unknown_error";
}

export async function POST(req: Request) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const rawPlan  = String(body?.plan  || "premium").toLowerCase();
    const withTrial = body?.trial === true;

    if (!isCheckoutPlan(rawPlan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const plan        = PLAN_CONFIG[rawPlan];
    const origin      = new URL(req.url).origin;
    const customerRef = createCustomerRef();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      client_reference_id: customerRef,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: plan.name,
              description: plan.description,
            },
            recurring: { interval: "month" },
            unit_amount: plan.unitAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        plan: rawPlan,
        customerRef,
        withTrial: withTrial ? "true" : "false",
      },
      subscription_data: {
        // Real Stripe trial — subscription starts as "trialing", billing after 3 days.
        // webhook will store trialEndsAt from subscription.trial_end.
        ...(withTrial ? { trial_period_days: 3 } : {}),
        metadata: {
          plan: rawPlan,
          customerRef,
        },
      },
      success_url: `${origin}/success?plan=${rawPlan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      plan: rawPlan,
      customerRef,
      trial: withTrial,
    });
  } catch (error) {
    console.error("STRIPE_CHECKOUT_ERROR", getErrorMessage(error));
    return NextResponse.json(
      {
        error: "Stripe checkout failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
