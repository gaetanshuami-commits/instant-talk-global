import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildMeetingLink,
  createInviteToken,
  createMeetingRoomId,
  meetingStatusFromDates,
} from "@/lib/meetings";

type InviteeRecord = {
  id: string
  email: string
  status: string
}

type ReminderRecord = {
  id: string
  remindAt: Date | string
  sentAt?: Date | string | null
}

type MeetingRecord = {
  id: string
  title: string
  description?: string | null
  hostEmail: string
  roomId: string
  inviteToken: string
  startsAt: Date | string
  endsAt: Date | string
  timezone: string
  status: string
  createdAt: Date | string
  updatedAt: Date | string
  invitees?: InviteeRecord[]
  reminders?: ReminderRecord[]
}

type MeetingModel = {
  findMany: (args: unknown) => Promise<MeetingRecord[]>
  create: (args: unknown) => Promise<MeetingRecord>
}

function serializeMeeting(origin: string, meeting: MeetingRecord) {
  return {
    id: meeting.id,
    title: meeting.title,
    description: meeting.description,
    hostEmail: meeting.hostEmail,
    roomId: meeting.roomId,
    startsAt: meeting.startsAt,
    endsAt: meeting.endsAt,
    timezone: meeting.timezone,
    status: meeting.status,
    createdAt: meeting.createdAt,
    updatedAt: meeting.updatedAt,
    invitees: meeting.invitees ?? [],
    reminders: meeting.reminders ?? [],
    joinLink: buildMeetingLink(origin, meeting.roomId, meeting.inviteToken),
  };
}

export async function GET(req: NextRequest) {
  const meetingModel = (prisma as unknown as { meeting?: MeetingModel }).meeting;

  if (!meetingModel) {
    return NextResponse.json({ meetings: [], prismaReady: false });
  }

  try {
    const meetings = await meetingModel.findMany({
      orderBy: { startsAt: "asc" },
      include: {
        invitees: true,
        reminders: true,
      },
    });

    const origin = req.nextUrl.origin;

    return NextResponse.json({
      meetings: meetings.map((meeting) => serializeMeeting(origin, meeting)),
      prismaReady: true,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[meetings GET]", msg);
    return NextResponse.json({ meetings: [], prismaReady: false, error: "db_unavailable", detail: msg });
  }
}

export async function POST(req: NextRequest) {
  const meetingModel = (prisma as unknown as { meeting?: MeetingModel }).meeting;

  if (!meetingModel) {
    return NextResponse.json(
      { error: "meetings_prisma_not_ready" },
      { status: 503 }
    );
  }

  const body = await req.json();

  const title = String(body.title || "").trim();
  const description = body.description ? String(body.description) : null;
  const hostEmail = String(body.hostEmail || "").trim().toLowerCase();
  const timezone = String(body.timezone || "Europe/Paris");
  const startsAt = new Date(body.startsAt);
  const endsAt = new Date(body.endsAt);
  const invitees = Array.isArray(body.invitees) ? body.invitees : [];

  if (!title || !hostEmail || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (endsAt.getTime() <= startsAt.getTime()) {
    return NextResponse.json({ error: "invalid_meeting_range" }, { status: 400 });
  }

  const roomId = createMeetingRoomId();
  const inviteToken = createInviteToken();
  const origin = req.nextUrl.origin;

  try {
    const meeting = await meetingModel.create({
      data: {
        title,
        description,
        hostEmail,
        roomId,
        inviteToken,
        startsAt,
        endsAt,
        timezone,
        status: meetingStatusFromDates(startsAt, endsAt),
        invitees: {
          create: invitees
            .filter((email: unknown) => typeof email === "string" && email.trim())
            .map((email: string) => ({
              email: email.trim().toLowerCase(),
            })),
        },
        reminders: {
          create: [
            { remindAt: new Date(startsAt.getTime() - 24 * 60 * 60 * 1000) },
            { remindAt: new Date(startsAt.getTime() - 60 * 60 * 1000) },
            { remindAt: new Date(startsAt.getTime() - 15 * 60 * 1000) },
          ],
        },
      },
      include: {
        invitees: true,
        reminders: true,
      },
    });

    return NextResponse.json({
      meeting: serializeMeeting(origin, meeting),
      joinLink: buildMeetingLink(origin, meeting.roomId, meeting.inviteToken),
    });
  } catch (err) {
    console.error("[meetings POST]", err);
    return NextResponse.json(
      { error: "db_unavailable", detail: "La base de données est inaccessible. Vérifiez Supabase." },
      { status: 503 }
    );
  }
}
