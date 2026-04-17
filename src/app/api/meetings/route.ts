import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/prisma";
import { buildMeetingLink, createInviteToken, createMeetingRoomId, meetingStatusFromDates } from "@/lib/meetings";
import { createId } from "@paralleldrive/cuid2";

function origin(req: NextRequest) {
  return req.nextUrl.origin;
}

export async function GET(req: NextRequest) {
  try {
    const { rows: meetings } = await pool.query<{
      id: string; title: string; description: string | null;
      host_email: string; room_id: string; invite_token: string;
      starts_at: Date; ends_at: Date; timezone: string; status: string;
    }>(`SELECT id, title, description, "hostEmail" AS host_email, "roomId" AS room_id,
         "inviteToken" AS invite_token, "startsAt" AS starts_at, "endsAt" AS ends_at,
         timezone, status
        FROM "Meeting" ORDER BY "startsAt" ASC`);

    const ids = meetings.map((m) => m.id);
    let invitees: { id: string; meeting_id: string; email: string; status: string }[] = [];
    if (ids.length > 0) {
      const { rows } = await pool.query<{ id: string; meeting_id: string; email: string; status: string }>(
        `SELECT id, "meetingId" AS meeting_id, email, status FROM "MeetingInvite" WHERE "meetingId" = ANY($1)`,
        [ids]
      );
      invitees = rows;
    }

    const inviteesByMeeting: Record<string, typeof invitees> = {};
    for (const inv of invitees) {
      if (!inviteesByMeeting[inv.meeting_id]) inviteesByMeeting[inv.meeting_id] = [];
      inviteesByMeeting[inv.meeting_id].push(inv);
    }

    return NextResponse.json({
      meetings: meetings.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        hostEmail: m.host_email,
        roomId: m.room_id,
        startsAt: m.starts_at,
        endsAt: m.ends_at,
        timezone: m.timezone,
        status: m.status,
        invitees: (inviteesByMeeting[m.id] ?? []).map((i) => ({ id: i.id, email: i.email, status: i.status })),
        joinLink: buildMeetingLink(origin(req), m.room_id, m.invite_token),
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[meetings GET]", msg);
    return NextResponse.json({ meetings: [], error: msg }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
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

  const id = createId();
  const roomId = createMeetingRoomId();
  const inviteToken = createInviteToken();
  const status = meetingStatusFromDates(startsAt, endsAt);

  try {
    await pool.query(
      `INSERT INTO "Meeting" (id, title, description, "hostEmail", "roomId", "inviteToken",
        "startsAt", "endsAt", timezone, status, "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())`,
      [id, title, description, hostEmail, roomId, inviteToken, startsAt, endsAt, timezone, status]
    );

    const validInvitees = invitees.filter((e) => typeof e === "string" && e.trim());
    for (const email of validInvitees) {
      await pool.query(
        `INSERT INTO "MeetingInvite" (id, "meetingId", email, status, "createdAt", "updatedAt")
         VALUES ($1,$2,$3,'PENDING',NOW(),NOW())`,
        [createId(), id, email.trim().toLowerCase()]
      );
    }

    // Reminders: -24h, -1h, -15min
    for (const offset of [86400000, 3600000, 900000]) {
      await pool.query(
        `INSERT INTO "MeetingReminder" (id, "meetingId", "remindAt", channel, "createdAt")
         VALUES ($1,$2,$3,'EMAIL',NOW())`,
        [createId(), id, new Date(startsAt.getTime() - offset)]
      );
    }

    const joinLink = buildMeetingLink(origin(req), roomId, inviteToken);
    return NextResponse.json({ id, joinLink });
  } catch (err) {
    console.error("[meetings POST]", err);
    return NextResponse.json({ error: "db_unavailable" }, { status: 503 });
  }
}
