import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  buildMeetingLink,
  createInviteToken,
  createMeetingRoomId,
  meetingStatusFromDates,
} from "@/lib/meetings";

function serializeMeeting(origin: string, meeting: any) {
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
  const meetingModel = (prisma as any).meeting;

  if (!meetingModel) {
    return NextResponse.json({ meetings: [], prismaReady: false });
  }

  const meetings = await meetingModel.findMany({
    orderBy: { startsAt: "asc" },
    include: {
      invitees: true,
      reminders: true,
    },
  });

  const origin = req.nextUrl.origin;

  return NextResponse.json({
    meetings: meetings.map((meeting: any) => serializeMeeting(origin, meeting)),
    prismaReady: true,
  });
}

export async function POST(req: NextRequest) {
  const meetingModel = (prisma as any).meeting;

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
}
