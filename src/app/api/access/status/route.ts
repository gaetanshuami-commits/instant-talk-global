import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeAccess } from "@/lib/access";

export const runtime = "nodejs";

function isActiveStatus(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}

export async function GET(req: NextRequest) {
  try {
    const cookiePlan = normalizeAccess(req.cookies.get("instanttalk_access")?.value);
    const customerRef = req.cookies.get("instanttalk_customer_ref")?.value || null;

    if (!cookiePlan || !customerRef) {
      return NextResponse.json({
        ok: false,
        hasAccess: false,
        reason: "missing_access_context",
      });
    }

    const subscriptions = await prisma.subscription.findMany({
      where: {
        OR: [
          { stripeCustomerId: customerRef },
          { customerEmail: customerRef },
        ],
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 5,
    });

    const activeSubscription = subscriptions.find((item) => isActiveStatus(item.status));

    if (!activeSubscription) {
      return NextResponse.json({
        ok: true,
        hasAccess: false,
        reason: "no_active_subscription",
      });
    }

    const dbPlan = normalizeAccess(activeSubscription.plan);

    return NextResponse.json({
      ok: true,
      hasAccess: true,
      plan: dbPlan || cookiePlan,
      status: activeSubscription.status,
      customerRef,
    });
  } catch (error) {
    console.error("ACCESS_STATUS_ERROR", error);

    return NextResponse.json(
      {
        ok: false,
        hasAccess: false,
        reason: "access_status_failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
