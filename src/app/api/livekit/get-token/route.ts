import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ACCESS_COOKIE, CUSTOMER_REF_COOKIE, hasServerAccess } from "@/lib/server-access";

export const runtime = "nodejs";

function isActiveStatus(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}

export async function GET(request: NextRequest) {
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const customerRef = request.cookies.get(CUSTOMER_REF_COOKIE)?.value;

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

  const { searchParams } = new URL(request.url);
  const room = searchParams.get("room");

  if (!room) {
    return NextResponse.json(
      { error: 'Missing "room" query parameter' },
      { status: 400 }
    );
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Missing LiveKit server configuration" },
      { status: 500 }
    );
  }

  const participantIdentity = `User_${Math.floor(Math.random() * 10000)}`;

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    name: participantIdentity,
  });

  at.addGrant({
    roomJoin: true,
    room,
    canPublish: true,
    canSubscribe: true,
  });

  return NextResponse.json({
    token: await at.toJwt(),
    plan: activeSubscription.plan,
    status: activeSubscription.status,
  });
}
