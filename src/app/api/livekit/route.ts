import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { ACCESS_COOKIE, CUSTOMER_REF_COOKIE, hasServerAccess } from "@/lib/server-access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function isActiveStatus(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}

export async function POST(req: NextRequest) {
  try {
    const access = req.cookies.get(ACCESS_COOKIE)?.value;
    const customerRef = req.cookies.get(CUSTOMER_REF_COOKIE)?.value;

    if (!hasServerAccess(access)) {
      return NextResponse.json(
        { error: "Access required" },
        { status: 403 }
      );
    }

    if (!customerRef) {
      return NextResponse.json(
        { error: "Missing customer reference" },
        { status: 403 }
      );
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
      return NextResponse.json(
        { error: "No active subscription" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const roomName = body?.roomName;
    const userId = body?.userId;

    if (!roomName || !userId) {
      return NextResponse.json(
        { error: "Missing roomName or userId" },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Missing LiveKit credentials" },
        { status: 500 }
      );
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: userId,
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      plan: activeSubscription.plan,
      status: activeSubscription.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "LiveKit token error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
