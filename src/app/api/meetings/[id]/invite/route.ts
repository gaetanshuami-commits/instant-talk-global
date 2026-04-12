import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildMeetingLink } from "@/lib/meetings";
import { sendMeetingInvitationEmail } from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Params) {
  const db = prisma as any;
  const { id } = await ctx.params;

  let meeting;
  try {
    meeting = await db.meeting.findUnique({
      where: { id },
      include: { invitees: true },
    });
  } catch (err) {
    console.error("[invite POST db]", err);
    return NextResponse.json({ error: "db_unavailable" }, { status: 503 });
  }

  if (!meeting) {
    return NextResponse.json({ error: "meeting_not_found" }, { status: 404 });
  }

  const origin = req.nextUrl.origin;
  const joinLink = buildMeetingLink(origin, meeting.roomId, meeting.inviteToken);

  const results = [];

  for (const invitee of meeting.invitees) {
    const result = await sendMeetingInvitationEmail({
      to: invitee.email,
      subject: `Invitation réunion : ${meeting.title}`,
      html: `
        <div style="font-family:Arial,sans-serif">
          <h2>${meeting.title}</h2>
          <p>Début : ${meeting.startsAt.toLocaleString("fr-FR")}</p>
          <p>Fin : ${meeting.endsAt.toLocaleString("fr-FR")}</p>
          <p><a href="${joinLink}">Rejoindre la réunion</a></p>
        </div>
      `,
    });

    if (result.sent) {
      await db.meetingInvite.update({
        where: { id: invitee.id },
        data: { status: "SENT" },
      });
    }

    results.push({
      email: invitee.email,
      ...result,
    });
  }

  return NextResponse.json({
    ok: true,
    joinLink,
    results,
  });
}