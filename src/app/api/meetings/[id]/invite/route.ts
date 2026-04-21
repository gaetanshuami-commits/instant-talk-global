import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/prisma";
import { buildJoinLink } from "@/lib/meetings";
import { sendMeetingInvitationEmail } from "@/lib/email";

export const runtime = "nodejs"

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Params) {
  const { id } = await ctx.params;

  try {
    const { rows: meetings } = await pool.query(
      `SELECT m.*, json_agg(json_build_object('id',i.id,'email',i.email)) FILTER (WHERE i.id IS NOT NULL) AS invitees
       FROM "Meeting" m LEFT JOIN "MeetingInvite" i ON i."meetingId"=m.id
       WHERE m.id=$1 GROUP BY m.id`, [id])

    if (!meetings[0]) return NextResponse.json({ error: "meeting_not_found" }, { status: 404 })
    const meeting = meetings[0]
    const joinLink = buildJoinLink(req.nextUrl.origin, meeting.roomId, meeting.inviteToken)
    const results = []

    for (const invitee of (meeting.invitees ?? [])) {
      const result = await sendMeetingInvitationEmail({
        to: invitee.email,
        subject: `Invitation réunion : ${meeting.title}`,
        html: `<div style="font-family:Arial,sans-serif">
          <h2>${meeting.title}</h2>
          <p>Début : ${new Date(meeting.startsAt).toLocaleString("fr-FR")}</p>
          <p>Fin : ${new Date(meeting.endsAt).toLocaleString("fr-FR")}</p>
          <p><a href="${joinLink}">Rejoindre la réunion</a></p></div>`,
      })
      if (result.sent) {
        await pool.query(`UPDATE "MeetingInvite" SET status='SENT', "updatedAt"=NOW() WHERE id=$1`, [invitee.id])
      }
      results.push({ email: invitee.email, ...result })
    }

    return NextResponse.json({ ok: true, joinLink, results })
  } catch (err) {
    console.error("[invite POST]", err)
    return NextResponse.json({ error: "db_unavailable" }, { status: 503 })
  }
}
