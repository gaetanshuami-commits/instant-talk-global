import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { 
  apiVersion: "2023-10-16" as any 
});

export async function POST(req: Request) {
  try {
    const { priceId, email } = await req.json();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: "https://instant-talk-global.vercel.app/dashboard?success=true",
      cancel_url: "https://instant-talk-global.vercel.app/pricing?canceled=true",
      customer_email: email,
    });
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
