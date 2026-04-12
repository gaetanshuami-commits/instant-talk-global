import { NextResponse } from "next/server"

// Development-only endpoint — sets test cookies for local testing
// NEVER accessible in production (NODE_ENV guard)
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  const res = NextResponse.json({ ok: true, message: "Dev cookies set" })

  const cookieOpts = {
    path:     "/",
    maxAge:   60 * 60 * 24 * 7, // 7 days
    httpOnly: false,
    sameSite: "lax" as const,
  }

  res.cookies.set("instanttalk_customer_ref", "dev@instant-talk.com", cookieOpts)
  res.cookies.set("instanttalk_access",       "business",              cookieOpts)

  return res
}
