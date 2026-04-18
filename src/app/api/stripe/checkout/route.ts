import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY.trim(), { apiVersion: "2026-02-25.clover" })
  : null;

const PRODUCTS: Record<string, string> = {
  premium:  "prod_U84f2nE8R8Xy7M",
  business: "prod_U84hb0JlHeC5ER",
};

async function getActivePriceId(productId: string): Promise<string> {
  if (!stripe) throw new Error("Stripe not initialized");
  const { data } = await stripe.prices.list({
    product:  productId,
    active:   true,
    type:     "recurring",
    limit:    10,
  });
  if (!data.length) throw new Error(`No active recurring price for product ${productId}`);
  // newest first (Stripe default), but sort explicitly
  const sorted = [...data].sort((a, b) => b.created - a.created);
  console.info(`[checkout] product=${productId} prices found=${data.length} using=${sorted[0].id}`);
  return sorted[0].id;
}

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
  }

  let plan: string;
  try {
    const body = await req.json();
    plan = typeof body.plan === "string" ? body.plan.toLowerCase() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!PRODUCTS[plan]) {
    return NextResponse.json({ error: `Unknown plan: ${plan}` }, { status: 400 });
  }

  try {
    const priceId     = await getActivePriceId(PRODUCTS[plan]);
    const origin      = new URL(req.url).origin;
    const customerRef = `itr_${crypto.randomUUID()}`;

    console.info(`[checkout] plan=${plan} product=${PRODUCTS[plan]} price=${priceId}`);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      client_reference_id: customerRef,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { plan, customerRef },
      subscription_data: {
        trial_period_days: 3,
        metadata: { plan, customerRef },
      },
      success_url: `${origin}/api/auth/callback/stripe?plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/pricing`,
    });

    return NextResponse.json({ url: session.url, plan, customerRef });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[checkout] ERROR:", msg);
    return NextResponse.json({ error: "Checkout failed", details: msg }, { status: 500 });
  }
}
