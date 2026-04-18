import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
const stripe = stripeKey
  ? new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" })
  : null;

const PLAN_CONFIG = {
  premium: {
    productId: "prod_U84g0h5Ed64X42",
  },
  business: {
    productId: "prod_U84hb0JIHeC5ER",
  },
} as const;

type CheckoutPlan = keyof typeof PLAN_CONFIG;

function isCheckoutPlan(value: string): value is CheckoutPlan {
  return value === "premium" || value === "business";
}

function resolvePlanFromBody(body: Record<string, unknown>): CheckoutPlan | null {
  const rawPlan = typeof body.plan === "string" ? body.plan.toLowerCase() : null;
  if (rawPlan && isCheckoutPlan(rawPlan)) return rawPlan;
  return null;
}

async function getActivePriceId(productId: string): Promise<string> {
  if (!stripe) throw new Error("Stripe not initialized");
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 1 });
  const price = prices.data[0];
  if (!price) throw new Error(`No active price found for product ${productId}`);
  return price.id;
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
    const customerRef = `itr_${crypto.randomUUID()}`;
    const priceId     = await getActivePriceId(plan.productId);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      client_reference_id: customerRef,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { plan: rawPlan, customerRef, withTrial: "true" },
      subscription_data: {
        trial_period_days: 3,
        metadata: { plan: rawPlan, customerRef },
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
    console.error("STRIPE_CHECKOUT_ERROR", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Stripe checkout failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
