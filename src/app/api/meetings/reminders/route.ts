import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildMeetingLink } from "@/lib/meetings";
import { sendMeetingInvitationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const now = new Date();

  const reminders = await prisma.meetingReminder.findMany({
    where: {
      sentAt: null,
      remindAt: { lte: now },
    },
    include: {
      meeting: {
        include: {
          invitees: true,
        },
      },
    },
  });

  const origin = req.nextUrl.origin;
  const sentIds: string[] = [];

  for (const reminder of reminders) {
    const joinLink = buildMeetingLink(origin, reminder.meeting.roomId, reminder.meeting.inviteToken);

    for (const invitee of reminder.meeting.invitees) {
      await sendMeetingInvitationEmail({
        to: invitee.email,
        subject: `Rappel réunion : ${reminder.meeting.title}`,
        html: `
          <div style="font-family:Arial,sans-serif">
            <h2>Rappel réunion</h2>
            <p>${reminder.meeting.title}</p>
            <p>Début : ${reminder.meeting.startsAt.toLocaleString("fr-FR")}</p>
            <p><a href="${joinLink}">Rejoindre maintenant</a></p>
          </div>
        `,
      });
    }

    await prisma.meetingReminder.update({
      where: { id: reminder.id },
      data: { sentAt: new Date() },
    });

    sentIds.push(reminder.id);
  }

  return NextResponse.json({
    ok: true,
    sentCount: sentIds.length,
    sentIds,
  });
}
