import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const customerRef = req.cookies.get("instanttalk_customer_ref")?.value || null
  if (!customerRef) return NextResponse.json({ results: [] })

  const q = req.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2) return NextResponse.json({ results: [] })

  const pattern = q.toLowerCase()
  const meetingModel = (prisma as any).meeting
  const contactModel = (prisma as any).contact
  const webinarModel = (prisma as any).webinar

  try {
    const [meetings, contacts, webinars] = await Promise.all([
      meetingModel ? meetingModel.findMany({
        where: { OR: [
          { title: { contains: pattern, mode: "insensitive" } },
          { hostEmail: { contains: pattern, mode: "insensitive" } },
        ]},
        take: 5, orderBy: { startsAt: "desc" },
      }) : [],
      contactModel ? contactModel.findMany({
        where: { customerRef, OR: [
          { name: { contains: pattern, mode: "insensitive" } },
          { email: { contains: pattern, mode: "insensitive" } },
          { company: { contains: pattern, mode: "insensitive" } },
        ]},
        take: 5,
      }) : [],
      webinarModel ? webinarModel.findMany({
        where: { customerRef, OR: [
          { title: { contains: pattern, mode: "insensitive" } },
          { topic: { contains: pattern, mode: "insensitive" } },
        ]},
        take: 3,
      }) : [],
    ])

    const results = [
      ...meetings.map((m: any) => ({ type: "meeting" as const, id: m.id, label: m.title, sub: new Date(m.startsAt).toLocaleDateString("fr-FR"), href: `/room/${m.roomId}` })),
      ...contacts.map((c: any) => ({ type: "contact" as const, id: c.id, label: c.name, sub: c.company ?? c.email, href: "/dashboard/contacts" })),
      ...webinars.map((w: any) => ({ type: "webinar" as const, id: w.id, label: w.title, sub: new Date(w.startsAt).toLocaleDateString("fr-FR"), href: "/dashboard/webinars" })),
    ]

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
