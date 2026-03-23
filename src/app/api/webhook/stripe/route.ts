import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeKey
  ? new Stripe(stripeKey, {
      apiVersion: "2026-02-25.clover",
    })
  : null;

export async function POST(req: Request) {
  if (!stripe) {
    return new NextResponse("Stripe Secret Missing", { status: 500 });
  }

  if (!webhookSecret) {
    return new NextResponse("Webhook Secret Missing", { status: 400 });
  }

  try {
    const body = await req.text();
    const headerList = await headers();
    const signature = headerList.get("Stripe-Signature") || "";

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("STRIPE_CHECKOUT_COMPLETED", {
          id: session.id,
          customer: session.customer,
          subscription: session.subscription,
          plan: session.metadata?.plan || null,
        });
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("STRIPE_SUBSCRIPTION_EVENT", {
          type: event.type,
          id: subscription.id,
          status: subscription.status,
          customer: subscription.customer,
        });
        break;
      }

      default:
        console.log("STRIPE_EVENT_IGNORED", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("STRIPE_WEBHOOK_ERROR", error);
    return new NextResponse("Webhook Error", { status: 400 });
  }
}
