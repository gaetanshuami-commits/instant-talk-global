import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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

export async function GET(req: NextRequest) {
  const meetingModel = (prisma as any).meeting
  if (!meetingModel) return NextResponse.json(EMPTY)

  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [allMeetings, recentMeetings] = await Promise.all([
      meetingModel.findMany({ include: { invitees: true }, orderBy: { startsAt: "desc" }, take: 500 }),
      meetingModel.findMany({ where: { startsAt: { gte: thirtyDaysAgo } }, include: { invitees: true }, orderBy: { startsAt: "asc" } }),
    ])

    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - (6 - i))
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      const dayEnd = new Date(dayStart.getTime() + 86400000)
      const dayMeetings = recentMeetings.filter(
        (m: any) => new Date(m.startsAt) >= dayStart && new Date(m.startsAt) < dayEnd
      )
      const minutes = dayMeetings.reduce((acc: number, m: any) =>
        acc + Math.round((new Date(m.endsAt).getTime() - new Date(m.startsAt).getTime()) / 60000), 0)
      return { day: d.toLocaleDateString("fr-FR", { weekday: "short" }), meetings: dayMeetings.length, minutes }
    })

    const totalMeetings    = allMeetings.length
    const totalParticipants = allMeetings.reduce((a: number, m: any) => a + m.invitees.length + 1, 0)
    const totalMinutes     = allMeetings.reduce((acc: number, m: any) =>
      acc + Math.max(0, Math.round((new Date(m.endsAt).getTime() - new Date(m.startsAt).getTime()) / 60000)), 0)
    const upcomingCount    = allMeetings.filter((m: any) => new Date(m.startsAt) > now).length
    const endedCount       = allMeetings.filter((m: any) => m.status === "ENDED").length

    const monthly = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      const count = allMeetings.filter(
        (m: any) => new Date(m.startsAt) >= d && new Date(m.startsAt) < end
      ).length
      return { month: d.toLocaleDateString("fr-FR", { month: "short" }), meetings: count }
    })

    return NextResponse.json({
      weeklyData, monthly,
      stats: { totalMeetings, totalParticipants, totalMinutes, upcomingCount, endedCount,
        avgParticipants: totalMeetings > 0 ? Math.round(totalParticipants / totalMeetings) : 0 },
    })
  } catch (err) {
    console.error("[Analytics]", err)
    return NextResponse.json(EMPTY)
  }
}
