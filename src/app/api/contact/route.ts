import { NextResponse } from "next/server"
import { Resend } from "resend"

export const runtime = "nodejs"

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  return apiKey ? new Resend(apiKey) : null
}
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 5
const contactRateLimit = new Map<string, number[]>()

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "unknown_error"
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown"
  }
  return request.headers.get("x-real-ip") || "unknown"
}

function isRateLimited(ip: string) {
  const now = Date.now()
  const recent = (contactRateLimit.get(ip) || []).filter((value) => now - value < RATE_LIMIT_WINDOW_MS)
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    contactRateLimit.set(ip, recent)
    return true
  }
  recent.push(now)
  contactRateLimit.set(ip, recent)
  return false
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 })
    }

    const body = await request.json()
    const { name, company, email, message } = body ?? {}

    if (!name || !email || !message) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 })
    }

    const fromAddress = process.env.CONTACT_FROM_EMAIL?.trim()
    const toAddress = process.env.CONTACT_TO_EMAIL?.trim()

    const resend = getResendClient()

    if (!resend) {
      console.error("[Contact] Missing RESEND_API_KEY")
      return NextResponse.json({ error: "missing_resend_api_key" }, { status: 500 })
    }

    if (!fromAddress) {
      console.error("[Contact] Missing CONTACT_FROM_EMAIL")
      return NextResponse.json({ error: "missing_contact_from_email" }, { status: 500 })
    }

    if (!toAddress) {
      console.error("[Contact] Missing CONTACT_TO_EMAIL")
      return NextResponse.json({ error: "missing_contact_to_email" }, { status: 500 })
    }

    const subjectName = company ? company : name

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [toAddress],
      replyTo: email,
      subject: "[Contact] " + subjectName + " - Instant Talk",
      html: "<p><strong>Nom :</strong> " + name +
            "</p><p><strong>Entreprise :</strong> " + (company || "-") +
            "</p><p><strong>Email :</strong> " + email +
            "</p><p><strong>Message :</strong><br/>" + message +
            "</p>"
    })

    if (error) {
      const resendError =
        typeof error === "object" && error && "message" in error
          ? String(error.message)
          : "unknown_resend_error"
      console.error("[Contact] Resend error:", resendError)
      return NextResponse.json({
        error: "send_failed"
      }, { status: 500 })
    }

    console.info("[Contact] Email sent:", data?.id)
    return NextResponse.json({ ok: true })

  } catch (err) {

    console.error("[Contact] Unexpected error:", getErrorMessage(err))

    return NextResponse.json({
      error: "send_failed"
    }, { status: 500 })

  }
}
