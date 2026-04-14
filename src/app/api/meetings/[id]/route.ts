import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { meetingStatusFromDates } from "@/lib/meetings";

type Params = { params: Promise<{ id: string }> };
type MeetingStatusValue = ReturnType<typeof meetingStatusFromDates>;
type MeetingRecord = {
  id: string
  title: string
  description?: string | null
  startsAt: Date
  endsAt: Date
  timezone: string
}
type MeetingModel = {
  findUnique: (args: unknown) => Promise<MeetingRecord | null>
  update: (args: unknown) => Promise<unknown>
  delete: (args: unknown) => Promise<unknown>
}

export async function GET(_: NextRequest, ctx: Params) {
  const db = prisma as unknown as { meeting: MeetingModel };
  const { id } = await ctx.params;

  try {
    const meeting = await db.meeting.findUnique({
      where: { id },
      include: { invitees: true, reminders: true },
    });
    if (!meeting) return NextResponse.json({ error: "meeting_not_found" }, { status: 404 });
    return NextResponse.json({ meeting });
  } catch (err) {
    console.error("[meeting GET]", err);
    return NextResponse.json({ error: "db_unavailable" }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest, ctx: Params) {
  const db = prisma as unknown as { meeting: MeetingModel };
  const { id } = await ctx.params;
  const body = await req.json();

  try {
    const current = await db.meeting.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "meeting_not_found" }, { status: 404 });

    const startsAt = body.startsAt ? new Date(body.startsAt) : current.startsAt;
    const endsAt = body.endsAt ? new Date(body.endsAt) : current.endsAt;

    if (endsAt.getTime() <= startsAt.getTime()) {
      return NextResponse.json({ error: "invalid_meeting_range" }, { status: 400 });
    }

    const meeting = await db.meeting.update({
      where: { id },
      data: {
        title: body.title ?? current.title,
        description: body.description ?? current.description,
        startsAt,
        endsAt,
        timezone: body.timezone ?? current.timezone,
        status: meetingStatusFromDates(startsAt, endsAt) as MeetingStatusValue,
      },
      include: { invitees: true, reminders: true },
    });
    return NextResponse.json({ meeting });
  } catch (err) {
    console.error("[meeting PATCH]", err);
    return NextResponse.json({ error: "db_unavailable" }, { status: 503 });
  }
}

export async function DELETE(_: NextRequest, ctx: Params) {
  const db = prisma as unknown as { meeting: MeetingModel };
  const { id } = await ctx.params;

  try {
    await db.meeting.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[meeting DELETE]", err);
    return NextResponse.json({ error: "db_unavailable" }, { status: 503 });
  }
}
