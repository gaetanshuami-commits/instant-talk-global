import { NextResponse } from "next/server"
import { pool } from "@/lib/prisma"

export const runtime = "nodejs"

const EMPTY = {
  weeklyData: Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return { day: d.toLocaleDateString("fr-FR", { weekday: "short" }), meetings: 0, minutes: 0 }
  }),
  monthly: Array.from({ length: 6 }, (_, i) => {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() - (5 - i), 1)
    return { month: d.toLocaleDateString("fr-FR", { month: "short" }), meetings: 0 }
  }),
  stats: { totalMeetings: 0, totalParticipants: 0, totalMinutes: 0, upcomingCount: 0, endedCount: 0, avgParticipants: 0 },
}

export async function GET() {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const { rows: all } = await pool.query<{
      id: string; startsAt: Date; endsAt: Date; status: string; inviteeCount: string
    }>(
      `SELECT m.id, m."startsAt", m."endsAt", m.status, COUNT(i.id) AS "inviteeCount"
       FROM "Meeting" m LEFT JOIN "MeetingInvite" i ON i."meetingId"=m.id
       GROUP BY m.id ORDER BY m."startsAt" DESC LIMIT 500`
    )

    const { rows: recent } = await pool.query<{ id: string; startsAt: Date; endsAt: Date }>(
      `SELECT id, "startsAt", "endsAt" FROM "Meeting" WHERE "startsAt" >= $1 ORDER BY "startsAt" ASC`,
      [thirtyDaysAgo]
    )

    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - (6 - i))
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      const dayEnd   = new Date(dayStart.getTime() + 86400000)
      const dayMeetings = recent.filter(m => m.startsAt >= dayStart && m.startsAt < dayEnd)
      const minutes = dayMeetings.reduce((acc, m) =>
        acc + Math.round((new Date(m.endsAt).getTime() - new Date(m.startsAt).getTime()) / 60000), 0)
      return { day: d.toLocaleDateString("fr-FR", { weekday: "short" }), meetings: dayMeetings.length, minutes }
    })

    const monthly = Array.from({ length: 6 }, (_, i) => {
      const d   = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      return { month: d.toLocaleDateString("fr-FR", { month: "short" }),
        meetings: all.filter(m => m.startsAt >= d && m.startsAt < end).length }
    })

    const totalMeetings     = all.length
    const totalParticipants = all.reduce((a, m) => a + parseInt(m.inviteeCount) + 1, 0)
    const totalMinutes      = all.reduce((a, m) =>
      a + Math.max(0, Math.round((new Date(m.endsAt).getTime() - new Date(m.startsAt).getTime()) / 60000)), 0)

    return NextResponse.json({ weeklyData, monthly, stats: {
      totalMeetings, totalParticipants, totalMinutes,
      upcomingCount: all.filter(m => m.startsAt > now).length,
      endedCount: all.filter(m => m.status === "ENDED").length,
      avgParticipants: totalMeetings > 0 ? Math.round(totalParticipants / totalMeetings) : 0,
    }})
  } catch (err) {
    console.error("[Analytics]", err)
    return NextResponse.json(EMPTY)
  }
}
