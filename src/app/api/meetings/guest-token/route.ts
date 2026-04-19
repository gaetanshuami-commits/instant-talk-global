export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

const gc = globalThis as unknown as { _guestSchemaReady?: boolean };
async function ensureColumns() {
  if (gc._guestSchemaReady) return;
  try { await prisma.$queryRawUnsafe(`ALTER TABLE "Meeting" ADD COLUMN IF NOT EXISTS "hostLastSeen" TIMESTAMP(3)`); } catch {}
  try { await prisma.$queryRawUnsafe(`ALTER TABLE "Meeting" ADD COLUMN IF NOT EXISTS "maxGuests" INTEGER NOT NULL DEFAULT 50`); } catch {}
  gc._guestSchemaReady = true;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const roomId = searchParams.get("roomId") ?? "";
  const token  = searchParams.get("t") ?? "";

  if (!roomId || !token) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  try {
    await ensureColumns();

    const rows = await prisma.$queryRawUnsafe<{
      id: string; title: string; hostEmail: string; status: string;
      startsAt: Date; endsAt: Date; inviteToken: string;
      hostLastSeen: Date | null; maxGuests: number;
    }[]>(
      `SELECT id, title, "hostEmail", status, "startsAt", "endsAt",
              "inviteToken", "hostLastSeen", "maxGuests"
       FROM "Meeting" WHERE "roomId" = $1 LIMIT 1`,
      roomId
    );

    if (!rows.length) {
      return NextResponse.json({ error: "meeting_not_found" }, { status: 404 });
    }

    const meeting = rows[0];

    if (meeting.inviteToken !== token) {
      return NextResponse.json({ error: "invalid_token" }, { status: 403 });
    }

    if (meeting.status === "CANCELLED") {
      return NextResponse.json({ error: "meeting_cancelled" }, { status: 410 });
    }

    // Reject if meeting ended more than 24h ago
    if (new Date(meeting.endsAt).getTime() < Date.now() - 86_400_000) {
      return NextResponse.json({ error: "meeting_expired" }, { status: 410 });
    }

    const hostPresent = meeting.hostLastSeen
      ? new Date(meeting.hostLastSeen).getTime() > Date.now() - 65_000
      : false;

    const appId          = process.env.NEXT_PUBLIC_AGORA_APP_ID ?? "";
    const appCertificate = process.env.AGORA_APP_CERTIFICATE ?? "";

    if (!appId || !appCertificate) {
      return NextResponse.json({ error: "agora_not_configured" }, { status: 503 });
    }

    const uid             = Math.floor(Math.random() * 99_000) + 1_000;
    const expireSeconds   = 7_200;
    const privilegeExpire = Math.floor(Date.now() / 1_000) + expireSeconds;

    const agoraToken = RtcTokenBuilder.buildTokenWithUid(
      appId, appCertificate, roomId, uid,
      RtcRole.PUBLISHER, privilegeExpire
    );

    return NextResponse.json({
      appId,
      channel: roomId,
      token: agoraToken,
      uid,
      expire: expireSeconds,
      meeting: {
        id: meeting.id,
        title: meeting.title,
        hostEmail: meeting.hostEmail,
        status: meeting.status,
        startsAt: meeting.startsAt,
        endsAt: meeting.endsAt,
        hostPresent,
      },
    });
  } catch (err) {
    console.error("[guest-token]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
