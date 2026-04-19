export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { buildMeetingLink, buildJoinLink, createInviteToken, createMeetingRoomId, meetingStatusFromDates } from "@/lib/meetings";
import crypto from "node:crypto";

function newId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 25);
}

/* ── Self-healing schema ── */
const g = globalThis as unknown as { _meetingSchemaV2Ready?: boolean };
async function ensureSchema() {
  if (g._meetingSchemaV2Ready) return;
  const stmts = [
    `DO $$ BEGIN CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED','LIVE','ENDED','CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN CREATE TYPE "InviteStatus" AS ENUM ('PENDING','SENT','ACCEPTED','DECLINED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `DO $$ BEGIN CREATE TYPE "ReminderChannel" AS ENUM ('EMAIL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `CREATE TABLE IF NOT EXISTS "Meeting" (
      "id" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT,
      "hostEmail" TEXT NOT NULL, "roomId" TEXT NOT NULL, "inviteToken" TEXT NOT NULL,
      "startsAt" TIMESTAMP(3) NOT NULL, "endsAt" TIMESTAMP(3) NOT NULL,
      "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
      "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Meeting_roomId_key" ON "Meeting"("roomId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Meeting_inviteToken_key" ON "Meeting"("inviteToken")`,
    `CREATE INDEX IF NOT EXISTS "Meeting_startsAt_idx" ON "Meeting"("startsAt")`,
    `CREATE TABLE IF NOT EXISTS "MeetingInvite" (
      "id" TEXT NOT NULL, "meetingId" TEXT NOT NULL, "email" TEXT NOT NULL,
      "name" TEXT, "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "MeetingInvite_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "MeetingInvite_meetingId_email_key" ON "MeetingInvite"("meetingId","email")`,
    `DO $$ BEGIN ALTER TABLE "MeetingInvite" ADD CONSTRAINT "MeetingInvite_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `CREATE TABLE IF NOT EXISTS "MeetingReminder" (
      "id" TEXT NOT NULL, "meetingId" TEXT NOT NULL,
      "remindAt" TIMESTAMP(3) NOT NULL, "sentAt" TIMESTAMP(3),
      "channel" "ReminderChannel" NOT NULL DEFAULT 'EMAIL',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "MeetingReminder_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE INDEX IF NOT EXISTS "MeetingReminder_remindAt_idx" ON "MeetingReminder"("remindAt")`,
    `DO $$ BEGIN ALTER TABLE "MeetingReminder" ADD CONSTRAINT "MeetingReminder_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    `ALTER TABLE "Meeting" ADD COLUMN IF NOT EXISTS "hostLastSeen" TIMESTAMP(3)`,
    `ALTER TABLE "Meeting" ADD COLUMN IF NOT EXISTS "maxGuests" INTEGER NOT NULL DEFAULT 50`,
    `ALTER TABLE "Meeting" ADD COLUMN IF NOT EXISTS "customerRef" TEXT`,
    `CREATE INDEX IF NOT EXISTS "Meeting_customerRef_idx" ON "Meeting"("customerRef")`,
  ];
  for (const sql of stmts) {
    try { await prisma.$queryRawUnsafe(sql); } catch { /* ignore individual failures */ }
  }
  g._meetingSchemaV2Ready = true;
}

function customerRef(req: NextRequest) {
  return req.cookies.get("instanttalk_customer_ref")?.value?.trim() || null;
}

export async function GET(req: NextRequest) {
  try {
    await ensureSchema();
    const cRef = customerRef(req);
    const meetings = cRef
      ? await prisma.$queryRawUnsafe<{
          id: string; title: string; description: string | null;
          hostEmail: string; roomId: string; inviteToken: string;
          startsAt: Date; endsAt: Date; timezone: string; status: string;
        }[]>(
          `SELECT id, title, description, "hostEmail", "roomId", "inviteToken",
                  "startsAt", "endsAt", timezone, status
           FROM "Meeting" WHERE "customerRef" = $1 ORDER BY "startsAt" ASC`,
          cRef
        )
      : [];

    let invitees: { id: string; meetingId: string; email: string; status: string }[] = [];
    if (meetings.length > 0) {
      const rows = await prisma.$queryRawUnsafe<{ id: string; meetingId: string; email: string; status: string }[]>(
        `SELECT id, "meetingId", email, status FROM "MeetingInvite" WHERE "meetingId" = ANY($1)`,
        meetings.map((m) => m.id)
      );
      invitees = rows;
    }

    const invByMeeting: Record<string, typeof invitees> = {};
    for (const inv of invitees) {
      if (!invByMeeting[inv.meetingId]) invByMeeting[inv.meetingId] = [];
      invByMeeting[inv.meetingId].push(inv);
    }

    return NextResponse.json({
      meetings: meetings.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        hostEmail: m.hostEmail,
        roomId: m.roomId,
        startsAt: m.startsAt,
        endsAt: m.endsAt,
        timezone: m.timezone,
        status: m.status,
        invitees: (invByMeeting[m.id] ?? []).map((i) => ({ id: i.id, email: i.email, status: i.status })),
        joinLink: buildMeetingLink(req.nextUrl.origin, m.roomId, m.inviteToken),
        guestLink: buildJoinLink(req.nextUrl.origin, m.roomId, m.inviteToken),
      })),
    });
  } catch (err) {
    const msg = (err as Error)?.message ?? "";
    console.error("[meetings GET]", msg);
    // Return 200 with empty list so the UI renders gracefully when DB is temporarily unavailable
    return NextResponse.json({ meetings: [], error: msg.slice(0, 200) });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const cRef = customerRef(req);
    if (!cRef) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const body = await req.json();

    const title = String(body.title || "").trim();
    const description = body.description ? String(body.description) : null;
    const hostEmail = String(body.hostEmail || "").trim().toLowerCase();
    const timezone = String(body.timezone || "Europe/Paris");
    const startsAt = new Date(body.startsAt);
    const endsAt = new Date(body.endsAt);
    const invitees: string[] = Array.isArray(body.invitees) ? body.invitees : [];

    if (!title || !hostEmail || isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }
    if (endsAt <= startsAt) {
      return NextResponse.json({ error: "invalid_meeting_range" }, { status: 400 });
    }

    const id = newId();
    const roomId = createMeetingRoomId();
    const inviteToken = createInviteToken();
    const status = meetingStatusFromDates(startsAt, endsAt);

    await prisma.$queryRawUnsafe(
      `INSERT INTO "Meeting"
         (id, title, description, "hostEmail", "roomId", "inviteToken",
          "startsAt", "endsAt", timezone, status, "customerRef", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::"MeetingStatus",$11,NOW(),NOW())`,
      id, title, description, hostEmail, roomId, inviteToken, startsAt, endsAt, timezone, status, cRef
    );

    for (const email of invitees.filter((e) => typeof e === "string" && e.trim())) {
      await prisma.$queryRawUnsafe(
        `INSERT INTO "MeetingInvite" (id, "meetingId", email, status, "createdAt", "updatedAt")
         VALUES ($1,$2,$3,'PENDING'::"InviteStatus",NOW(),NOW())`,
        newId(), id, email.trim().toLowerCase()
      );
    }

    for (const offset of [86400000, 3600000, 900000]) {
      await prisma.$queryRawUnsafe(
        `INSERT INTO "MeetingReminder" (id, "meetingId", "remindAt", channel, "createdAt")
         VALUES ($1,$2,$3,'EMAIL'::"ReminderChannel",NOW())`,
        newId(), id, new Date(startsAt.getTime() - offset)
      );
    }

    const joinLink = buildMeetingLink(req.nextUrl.origin, roomId, inviteToken);
    const guestLink = buildJoinLink(req.nextUrl.origin, roomId, inviteToken);
    return NextResponse.json({ id, joinLink, guestLink });
  } catch (err) {
    const msg = (err as Error)?.message ?? "";
    const code =
      msg.includes("does not exist")        ? "schema_missing"       :
      msg.includes("ECONNREFUSED")           ? "connection_refused"   :
      msg.includes("timeout")               ? "connection_timeout"   :
      msg.includes("violates unique")        ? "duplicate_entry"      :
      msg.includes("violates not-null")      ? "missing_required"     :
      "db_unavailable";
    console.error("[meetings POST]", code, msg);
    return NextResponse.json({ error: code, detail: msg.slice(0, 300) }, { status: 503 });
  }
}
