import { NextResponse } from "next/server"
import { Resend } from "resend"

export const runtime = "nodejs"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, company, email, message } = body ?? {}

    if (!name || !email || !message) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 })
    }

    // from: use Resend's verified sender (works without custom domain verification).
    // replyTo: set to the visitor's email so replies go directly to them.
    // to: your inbox — swap for your real address once instant-talk.com DNS is verified.
    const toAddress = process.env.CONTACT_TO_EMAIL ?? "gaeta@instant-talk.com"

    const { data, error } = await resend.emails.send({
      from:    "Instant Talk <contact@instant-talk.com>",
      to:      [toAddress],
      replyTo: email,
      subject: `[Contact] ${company || name} — Instant Talk`,
      html: `
<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:16px;">
  <div style="background:linear-gradient(135deg,#6366f1,#7c3aed);border-radius:12px;padding:24px 28px;margin-bottom:24px;">
    <h1 style="color:white;margin:0;font-size:20px;font-weight:800;letter-spacing:-0.02em;">Nouveau message — Instant Talk</h1>
    <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:13px;">Formulaire de contact</p>
  </div>

  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="padding:10px 0;font-size:13px;color:#64748b;font-weight:600;width:120px;">Nom</td>
      <td style="padding:10px 0;font-size:14px;color:#0a2540;font-weight:700;">${name}</td>
    </tr>
    ${company ? `<tr>
      <td style="padding:10px 0;font-size:13px;color:#64748b;font-weight:600;">Entreprise</td>
      <td style="padding:10px 0;font-size:14px;color:#0a2540;font-weight:700;">${company}</td>
    </tr>` : ""}
    <tr>
      <td style="padding:10px 0;font-size:13px;color:#64748b;font-weight:600;">Email</td>
      <td style="padding:10px 0;font-size:14px;"><a href="mailto:${email}" style="color:#6366f1;font-weight:700;">${email}</a></td>
    </tr>
  </table>

  <div style="margin-top:24px;background:white;border-radius:12px;padding:20px 24px;border:1px solid #e2e8f0;">
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#94a3b8;margin-bottom:12px;">Message</div>
    <p style="margin:0;font-size:14px;line-height:1.7;color:#334155;white-space:pre-wrap;">${message}</p>
  </div>

  <p style="margin-top:24px;font-size:12px;color:#94a3b8;text-align:center;">
    Envoyé depuis le formulaire de contact instant-talk.com &nbsp;·&nbsp; Répondre à <a href="mailto:${email}" style="color:#6366f1;">${email}</a>
  </p>
</div>`,
    })

    if (error) {
      console.error("[Contact] Resend error:", JSON.stringify(error))
      return NextResponse.json({ error: "send_failed", detail: (error as any)?.message }, { status: 500 })
    }

    console.info("[Contact] Email sent:", data?.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[Contact] Unexpected error:", err)
    return NextResponse.json({ error: "send_failed" }, { status: 500 })
  }
}
