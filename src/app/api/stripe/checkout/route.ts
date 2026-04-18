import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY.trim(), { apiVersion: "2026-02-25.clover" })
  : null;

// Price IDs confirmed via Stripe API — do not change without verifying in dashboard
const PRICES: Record<string, string> = {
  premium:  "price_1T9oWtEwh4sBnj54ncKbHx17",
  business: "price_1TMDpHEwh4sBnj543iuEIVgV",
};

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
  }

  let plan: string;
  try {
    const body = await req.json();
    plan = typeof body.plan === "string" ? body.plan.toLowerCase().trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!PRICES[plan]) {
    return NextResponse.json({ error: `Unknown plan: ${plan}` }, { status: 400 });
  }

  try {
    const origin      = new URL(req.url).origin;
    const customerRef = `itr_${crypto.randomUUID()}`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      client_reference_id: customerRef,
      line_items: [{ price: PRICES[plan], quantity: 1 }],
      metadata: { plan, customerRef },
      subscription_data: {
        trial_period_days: 3,
        metadata: { plan, customerRef },
      },
      success_url: `${origin}/api/auth/callback/stripe?plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/pricing`,
    });

    console.info(`[checkout] plan=${plan} price=${PRICES[plan]} session=${session.id}`);
    return NextResponse.json({ url: session.url, plan, customerRef });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[checkout] ERROR:", msg);
    return NextResponse.json({ error: "Checkout failed", details: msg }, { status: 500 });
  }
}
