export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const hc = globalThis as unknown as { _hbSchemaReady?: boolean };
async function ensureColumns() {
  if (hc._hbSchemaReady) return;
  try { await prisma.$queryRawUnsafe(`ALTER TABLE "Meeting" ADD COLUMN IF NOT EXISTS "hostLastSeen" TIMESTAMP(3)`); } catch {}
  hc._hbSchemaReady = true;
}

// POST — host sends heartbeat (every 30s)
export async function POST(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get("roomId") ?? "";
  if (!roomId) return NextResponse.json({ error: "missing_roomId" }, { status: 400 });

  try {
    await ensureColumns();
    const body = await req.json().catch(() => ({}));
    const hostEmail = String(body.hostEmail ?? "").toLowerCase().trim();

    const rows = await prisma.$queryRawUnsafe<{ id: string; hostEmail: string }[]>(
      `SELECT id, "hostEmail" FROM "Meeting" WHERE "roomId" = $1 LIMIT 1`,
      roomId
    );
    // Ad-hoc rooms (not created from dashboard) have no DB row — treat as no-op
    if (!rows.length) return NextResponse.json({ ok: true, tracked: false });

    // Optional host ownership check
    if (hostEmail && rows[0].hostEmail !== hostEmail) {
      return NextResponse.json({ error: "unauthorized" }, { status: 403 });
    }

    await prisma.$queryRawUnsafe(
      `UPDATE "Meeting"
       SET "hostLastSeen" = NOW(),
           "updatedAt"    = NOW(),
           status = CASE WHEN status = 'SCHEDULED'::"MeetingStatus" THEN 'LIVE'::"MeetingStatus" ELSE status END
       WHERE "roomId" = $1`,
      roomId
    );

    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    console.error("[heartbeat POST]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// GET — guests poll host presence (every 10s)
export async function GET(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get("roomId") ?? "";
  if (!roomId) return NextResponse.json({ error: "missing_roomId" }, { status: 400 });

  try {
    await ensureColumns();

    const rows = await prisma.$queryRawUnsafe<{
      id: string; status: string; hostLastSeen: Date | null; title: string; hostEmail: string;
    }[]>(
      `SELECT id, status, "hostLastSeen", title, "hostEmail"
       FROM "Meeting" WHERE "roomId" = $1 LIMIT 1`,
      roomId
    );
    // Ad-hoc room — assume host present so guest is never incorrectly kicked
    if (!rows.length) return NextResponse.json({ hostPresent: true, status: "LIVE", tracked: false });

    const m = rows[0];
    const hostPresent = m.hostLastSeen
      ? new Date(m.hostLastSeen).getTime() > Date.now() - 65_000
      : false;

    // Auto-mark ENDED if host gone during LIVE meeting
    if (m.status === "LIVE" && !hostPresent) {
      await prisma.$queryRawUnsafe(
        `UPDATE "Meeting" SET status = 'ENDED'::"MeetingStatus", "updatedAt" = NOW()
         WHERE id = $1 AND status = 'LIVE'::"MeetingStatus"`,
        m.id
      ).catch(() => {});
    }

    return NextResponse.json({
      id:          m.id,
      status:      m.status === "LIVE" && !hostPresent ? "ENDED" : m.status,
      hostPresent,
      title:       m.title,
      hostEmail:   m.hostEmail,
      lastSeen:    m.hostLastSeen,
    });
  } catch (err) {
    console.error("[heartbeat GET]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// DELETE — host explicitly closes the meeting on leave
export async function DELETE(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get("roomId") ?? "";
  if (!roomId) return NextResponse.json({ ok: true });
  try {
    await prisma.$queryRawUnsafe(
      `UPDATE "Meeting" SET status = 'ENDED'::"MeetingStatus", "updatedAt" = NOW()
       WHERE "roomId" = $1 AND status = 'LIVE'::"MeetingStatus"`,
      roomId
    );
  } catch {}
  return NextResponse.json({ ok: true });
}
