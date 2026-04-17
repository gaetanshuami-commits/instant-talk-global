import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/prisma";
import { buildMeetingLink, createInviteToken, createMeetingRoomId, meetingStatusFromDates } from "@/lib/meetings";
import crypto from "node:crypto";

function newId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 25);
}

export async function GET(req: NextRequest) {
  try {
    const { rows: meetings } = await pool.query<{
      id: string; title: string; description: string | null;
      hostEmail: string; roomId: string; inviteToken: string;
      startsAt: Date; endsAt: Date; timezone: string; status: string;
    }>(
      `SELECT id, title, description, "hostEmail", "roomId", "inviteToken",
              "startsAt", "endsAt", timezone, status
       FROM "Meeting" ORDER BY "startsAt" ASC`
    );

    let invitees: { id: string; meetingId: string; email: string; status: string }[] = [];
    if (meetings.length > 0) {
      const { rows } = await pool.query<{ id: string; meetingId: string; email: string; status: string }>(
        `SELECT id, "meetingId", email, status FROM "MeetingInvite" WHERE "meetingId" = ANY($1)`,
        [meetings.map((m) => m.id)]
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
      })),
    });
  } catch (err) {
    console.error("[meetings GET]", err);
    return NextResponse.json({ meetings: [] }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
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

    await pool.query(
      `INSERT INTO "Meeting"
         (id, title, description, "hostEmail", "roomId", "inviteToken",
          "startsAt", "endsAt", timezone, status, "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())`,
      [id, title, description, hostEmail, roomId, inviteToken, startsAt, endsAt, timezone, status]
    );

    for (const email of invitees.filter((e) => typeof e === "string" && e.trim())) {
      await pool.query(
        `INSERT INTO "MeetingInvite" (id, "meetingId", email, status, "createdAt", "updatedAt")
         VALUES ($1,$2,$3,'PENDING',NOW(),NOW())`,
        [newId(), id, email.trim().toLowerCase()]
      );
    }

    for (const offset of [86400000, 3600000, 900000]) {
      await pool.query(
        `INSERT INTO "MeetingReminder" (id, "meetingId", "remindAt", channel, "createdAt")
         VALUES ($1,$2,$3,'EMAIL',NOW())`,
        [newId(), id, new Date(startsAt.getTime() - offset)]
      );
    }

    const joinLink = buildMeetingLink(req.nextUrl.origin, roomId, inviteToken);
    return NextResponse.json({ id, joinLink });
  } catch (err) {
    console.error("[meetings POST]", err);
    return NextResponse.json({ error: "db_unavailable" }, { status: 503 });
  }
}
