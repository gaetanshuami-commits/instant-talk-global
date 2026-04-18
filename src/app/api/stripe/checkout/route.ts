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
    priceId: "price_1T9oWtEwh4sBnj54ncKbHx17",
  },
  business: {
    name: "Instant Talk Business",
    description: "Réunions d'équipe multilingues — jusqu'à 50 participants, 20 langues",
    unitAmount: 9900,
    priceId: "price_1T9oXtEwh4sBnj54YgPSDbeU",
  },
} as const;

type CheckoutPlan = keyof typeof PLAN_CONFIG;

function isCheckoutPlan(value: string): value is CheckoutPlan {
  return value === "premium" || value === "business";
}

function resolvePlanFromBody(body: Record<string, unknown>): CheckoutPlan | null {
  const rawPlan = typeof body.plan === "string" ? body.plan.toLowerCase() : null;
  if (rawPlan && isCheckoutPlan(rawPlan)) {
    return rawPlan;
  }

  const priceId = typeof body.priceId === "string" ? body.priceId : null;
  if (!priceId) {
    return null;
  }

  const matchedPlan = (Object.entries(PLAN_CONFIG) as [CheckoutPlan, (typeof PLAN_CONFIG)[CheckoutPlan]][])
    .find(([, plan]) => plan.priceId === priceId)?.[0];

  return matchedPlan || null;
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

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const rawPlan = resolvePlanFromBody(body);

    if (!rawPlan) {
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
          price: plan.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        plan: rawPlan,
        customerRef,
        withTrial: "true",
      },
      subscription_data: {
        // Real Stripe trial — subscription starts as "trialing", billing after 3 days.
        // webhook will store trialEndsAt from subscription.trial_end.
        trial_period_days: 3,
        metadata: {
          plan: rawPlan,
          customerRef,
        },
      },
      success_url: `${origin}/api/auth/callback/stripe?plan=${rawPlan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      plan: rawPlan,
      customerRef,
      trial: true,
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
