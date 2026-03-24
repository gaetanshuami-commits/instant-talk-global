import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeKey
  ? new Stripe(stripeKey, {
      apiVersion: "2026-02-25.clover",
    })
  : null;

function unixToDate(value: number | null | undefined): Date | null {
  return typeof value === "number" ? new Date(value * 1000) : null;
}

function getSubscriptionCurrentPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const raw = (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end;
  return unixToDate(raw);
}

function normalizePlan(value: string | null | undefined) {
  if (value === "premium" || value === "business" || value === "trial") {
    return value;
  }
  return "premium";
}

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

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;

        if (session.mode === "subscription" && subscriptionId && customerId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          await prisma.subscription.upsert({
            where: {
              stripeSubscriptionId: subscription.id,
            },
            update: {
              stripeCustomerId: String(customerId),
              plan: normalizePlan(
                session.metadata?.plan ||
                subscription.metadata?.plan
              ),
              status: subscription.status,
              customerEmail:
                session.customer_details?.email ||
                session.customer_email ||
                null,
              currentPeriodEnd: getSubscriptionCurrentPeriodEnd(subscription),
            },
            create: {
              stripeCustomerId: String(customerId),
              stripeSubscriptionId: subscription.id,
              plan: normalizePlan(
                session.metadata?.plan ||
                subscription.metadata?.plan
              ),
              status: subscription.status,
              customerEmail:
                session.customer_details?.email ||
                session.customer_email ||
                null,
              currentPeriodEnd: getSubscriptionCurrentPeriodEnd(subscription),
            },
          });
        }

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        await prisma.subscription.upsert({
          where: {
            stripeSubscriptionId: subscription.id,
          },
          update: {
            stripeCustomerId: String(subscription.customer),
            plan: normalizePlan(subscription.metadata?.plan),
            status: subscription.status,
            currentPeriodEnd: getSubscriptionCurrentPeriodEnd(subscription),
          },
          create: {
            stripeCustomerId: String(subscription.customer),
            stripeSubscriptionId: subscription.id,
            plan: normalizePlan(subscription.metadata?.plan),
            status: subscription.status,
            customerEmail: null,
            currentPeriodEnd: getSubscriptionCurrentPeriodEnd(subscription),
          },
        });

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await prisma.subscription.updateMany({
          where: {
            stripeSubscriptionId: subscription.id,
          },
          data: {
            status: "canceled",
            currentPeriodEnd: getSubscriptionCurrentPeriodEnd(subscription),
          },
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

