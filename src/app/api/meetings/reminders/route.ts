import { NextResponse } from "next/server"
import { pool } from "@/lib/prisma"
import { sendMeetingInvitationEmail } from "@/lib/email"
import { buildMeetingLink } from "@/lib/meetings"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret")
  if (secret !== process.env.REMINDER_SECRET && process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const windowEnd = new Date(now.getTime() + 16 * 60 * 1000)

  try {
    const { rows } = await pool.query(
      `SELECT r.id AS "reminderId", r."meetingId",
              m.title, m."hostEmail", m."roomId", m."inviteToken", m."startsAt", m."endsAt",
              COALESCE(json_agg(i.email) FILTER (WHERE i.id IS NOT NULL), '[]'::json) AS "inviteeEmails"
       FROM "MeetingReminder" r
       JOIN "Meeting" m ON m.id = r."meetingId"
       LEFT JOIN "MeetingInvite" i ON i."meetingId" = m.id
       WHERE r."remindAt" >= $1 AND r."remindAt" <= $2 AND r."sentAt" IS NULL
       GROUP BY r.id, m.id`,
      [now, windowEnd]
    )

    const origin = new URL(req.url).origin
    let sent = 0
    for (const row of rows) {
      const joinLink = buildMeetingLink(origin, row.roomId, row.inviteToken)
      const emails = [row.hostEmail, ...(row.inviteeEmails ?? [])].filter(Boolean)
      for (const email of emails) {
        try {
          await sendMeetingInvitationEmail({
            to: email,
            subject: `Rappel : ${row.title} commence bientôt`,
            html: `<div style="font-family:Arial,sans-serif">
              <h2>Rappel : ${row.title}</h2>
              <p>Début dans moins de 15 minutes.</p>
              <p><a href="${joinLink}">Rejoindre la réunion</a></p>
            </div>`,
          })
          sent++
        } catch { /* skip */ }
      }
      await pool.query(`UPDATE "MeetingReminder" SET "sentAt"=NOW() WHERE id=$1`, [row.reminderId])
    }

    return NextResponse.json({ processed: rows.length, sent })
  } catch (err) {
    console.error("[reminders]", err)
    return NextResponse.json({ error: "reminder_failed" }, { status: 500 })
  }
}
