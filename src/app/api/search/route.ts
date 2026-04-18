import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const customerRef = req.cookies.get("instanttalk_customer_ref")?.value || null
  if (!customerRef) return NextResponse.json({ results: [] })
  const q = req.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2) return NextResponse.json({ results: [] })
  const pattern = `%${q}%`

  try {
    const [meetings, contacts, webinars] = await Promise.all([
      pool.query<{ id: string; title: string; startsAt: Date; roomId: string }>(
        `SELECT id, title, "startsAt", "roomId" FROM "Meeting"
         WHERE (LOWER(title) LIKE LOWER($1) OR LOWER("hostEmail") LIKE LOWER($1))
         ORDER BY "startsAt" DESC LIMIT 5`, [pattern]),
      pool.query<{ id: string; name: string; company: string | null; email: string }>(
        `SELECT id, name, company, email FROM "Contact"
         WHERE "customerRef"=$1 AND (LOWER(name) LIKE LOWER($2) OR LOWER(email) LIKE LOWER($2) OR LOWER(COALESCE(company,'')) LIKE LOWER($2))
         LIMIT 5`, [customerRef, pattern]),
      pool.query<{ id: string; title: string; startsAt: Date }>(
        `SELECT id, title, "startsAt" FROM "Webinar"
         WHERE "customerRef"=$1 AND (LOWER(title) LIKE LOWER($2) OR LOWER(COALESCE(topic,'')) LIKE LOWER($2))
         LIMIT 3`, [customerRef, pattern]),
    ])

    const results = [
      ...meetings.rows.map(m => ({ type: "meeting", id: m.id, label: m.title,
        sub: new Date(m.startsAt).toLocaleDateString("fr-FR"), href: `/room/${m.roomId}` })),
      ...contacts.rows.map(c => ({ type: "contact", id: c.id, label: c.name,
        sub: c.company ?? c.email, href: "/dashboard/contacts" })),
      ...webinars.rows.map(w => ({ type: "webinar", id: w.id, label: w.title,
        sub: new Date(w.startsAt).toLocaleDateString("fr-FR"), href: "/dashboard/webinars" })),
    ]
    return NextResponse.json({ results })
  } catch { return NextResponse.json({ results: [] }) }
}
