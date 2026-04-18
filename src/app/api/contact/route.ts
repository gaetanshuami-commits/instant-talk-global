import { NextResponse } from "next/server"
import { Resend } from "resend"

export const runtime = "nodejs"

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  return apiKey ? new Resend(apiKey) : null
}

/** Échappe les caractères spéciaux HTML pour éviter les emails cassés */
function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** Convertit les sauts de ligne en <br> pour l'affichage HTML */
function nl2br(str: string): string {
  return esc(str).replace(/\n/g, "<br>")
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

    if (!resend || !fromAddress || !toAddress) {
      const missing = [
        !resend       && "RESEND_API_KEY",
        !fromAddress  && "CONTACT_FROM_EMAIL",
        !toAddress    && "CONTACT_TO_EMAIL",
      ].filter(Boolean).join(", ")
      console.error(`[Contact] Missing env vars: ${missing}`)
      return NextResponse.json({ error: "configuration_error", missing }, { status: 500 })
    }

    const subjectName = company ? company : name

    const { data, error } = await resend.emails.send({
      from:    fromAddress,
      to:      [toAddress],
      replyTo: [email],          // tableau requis en Resend v6
      subject: `[Contact] ${esc(subjectName)} — Instant Talk`,
      html: `<!DOCTYPE html>
<html lang="fr"><body style="font-family:sans-serif;color:#0a2540;max-width:600px;margin:0 auto;padding:24px">
  <h2 style="margin:0 0 20px;font-size:18px;border-bottom:2px solid #635bff;padding-bottom:10px">
    Nouveau message — Instant Talk
  </h2>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:8px 0;font-weight:600;color:#555;width:130px">Nom</td>
        <td style="padding:8px 0">${esc(name)}</td></tr>
    <tr><td style="padding:8px 0;font-weight:600;color:#555">Entreprise</td>
        <td style="padding:8px 0">${esc(company || "—")}</td></tr>
    <tr><td style="padding:8px 0;font-weight:600;color:#555">Email</td>
        <td style="padding:8px 0"><a href="mailto:${esc(email)}" style="color:#635bff">${esc(email)}</a></td></tr>
  </table>
  <div style="margin-top:20px">
    <div style="font-weight:600;color:#555;margin-bottom:8px">Message</div>
    <div style="background:#f6f9fc;border-left:3px solid #635bff;padding:14px 16px;border-radius:4px;line-height:1.7">
      ${nl2br(message)}
    </div>
  </div>
  <p style="margin-top:24px;font-size:12px;color:#999">
    Envoyé depuis le formulaire contact de instant-talk.com
  </p>
</body></html>`,
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
