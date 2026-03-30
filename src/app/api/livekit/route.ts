import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "fs";
import { prisma } from "@/lib/prisma";
import { isLobbyParticipantApproved } from "@/lib/lobby-store";

export const runtime = "nodejs";

function extractInviteToken(req: Request, body: any) {
  if (body?.inviteToken && typeof body.inviteToken === "string") {
    return body.inviteToken;
  }

  const referer = req.headers.get("referer");
  if (!referer) return null;

  try {
    const url = new URL(referer);
    return url.searchParams.get("invite");
  } catch {
    return null;
  }
}

function isJoinWindowOpen(startsAt: Date, endsAt: Date) {
  const now = Date.now();
  const earlyJoinMs = 15 * 60 * 1000;
  const lateGraceMs = 60 * 60 * 1000;

  return now >= startsAt.getTime() - earlyJoinMs && now <= endsAt.getTime() + lateGraceMs;
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();

    let access =
      cookieStore.get("instanttalk_access")?.value ||
      null;

    if (!access && fs.existsSync(".access_override")) {
      access = fs.readFileSync(".access_override", "utf8").trim();
    }

    const body = await req.json();

    const roomName = body.roomName;
    const userId = body.userId;
    const isHost = body.host === true;

    if (!roomName || !userId) {
      return NextResponse.json(
        { error: "Missing roomName or userId" },
        { status: 400 }
      );
    }

    const meetingModel = (prisma as any).meeting;
    const scheduledMeeting = meetingModel
      ? await meetingModel.findUnique({
          where: { roomId: roomName },
        })
      : null;

    if (scheduledMeeting) {
      const inviteToken = extractInviteToken(req, body);

      if (!inviteToken || inviteToken !== scheduledMeeting.inviteToken) {
        return NextResponse.json(
          { error: "Invalid or missing invite token" },
          { status: 403 }
        );
      }

      if (!isJoinWindowOpen(new Date(scheduledMeeting.startsAt), new Date(scheduledMeeting.endsAt))) {
        return NextResponse.json(
          { error: "Meeting join window is closed" },
          { status: 403 }
        );
      }
    } else {
      const lobbyApproved = isLobbyParticipantApproved(roomName, userId);

      if (!isHost && !lobbyApproved && !access) {
        return NextResponse.json(
          { error: "Missing access or waiting room approval" },
          { status: 403 }
        );
      }
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Missing LiveKit config" },
        { status: 500 }
      );
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: userId,
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    return NextResponse.json({
      token: await token.toJwt(),
    });
  } catch (error) {
    console.error("LIVEKIT_TOKEN_ERROR", error);

    return NextResponse.json(
      { error: "LiveKit token error" },
      { status: 500 }
    );
  }
}
