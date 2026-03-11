import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2023-10-16" as any,
});

export async function POST(req: Request) {
  const body = await req.text();
  const headerList = await headers();
  const signature = headerList.get("Stripe-Signature") || "";
  
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return new NextResponse("Webhook Secret Missing", { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    return NextResponse.json({ received: true });
  } catch (err: any) {
    return new NextResponse("Webhook Error", { status: 400 });
  }
}
