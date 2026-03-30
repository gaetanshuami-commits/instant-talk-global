import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { meetingStatusFromDates } from "@/lib/meetings";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, ctx: Params) {
  const { id } = await ctx.params;

  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: {
      invitees: true,
      reminders: true,
    },
  });

  if (!meeting) {
    return NextResponse.json({ error: "meeting_not_found" }, { status: 404 });
  }

  return NextResponse.json({ meeting });
}

export async function PATCH(req: NextRequest, ctx: Params) {
  const { id } = await ctx.params;
  const body = await req.json();

  const current = await prisma.meeting.findUnique({ where: { id } });

  if (!current) {
    return NextResponse.json({ error: "meeting_not_found" }, { status: 404 });
  }

  const startsAt = body.startsAt ? new Date(body.startsAt) : current.startsAt;
  const endsAt = body.endsAt ? new Date(body.endsAt) : current.endsAt;

  if (endsAt.getTime() <= startsAt.getTime()) {
    return NextResponse.json({ error: "invalid_meeting_range" }, { status: 400 });
  }

  const meeting = await prisma.meeting.update({
    where: { id },
    data: {
      title: body.title ?? current.title,
      description: body.description ?? current.description,
      startsAt,
      endsAt,
      timezone: body.timezone ?? current.timezone,
      status: meetingStatusFromDates(startsAt, endsAt) as any,
    },
    include: {
      invitees: true,
      reminders: true,
    },
  });

  return NextResponse.json({ meeting });
}

export async function DELETE(_: NextRequest, ctx: Params) {
  const { id } = await ctx.params;

  await prisma.meeting.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
