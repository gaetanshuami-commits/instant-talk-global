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

    const fromAddress = process.env.CONTACT_FROM_EMAIL
    const toAddress = process.env.CONTACT_TO_EMAIL

    if (!process.env.RESEND_API_KEY) {
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
      from: "Instant Talk <" + fromAddress + ">",
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
      console.error("[Contact] Resend error:", error)
      return NextResponse.json({
        error: "send_failed",
        detail: JSON.stringify(error)
      }, { status: 500 })
    }

    console.info("[Contact] Email sent:", data?.id)
    return NextResponse.json({ ok: true })

  } catch (err) {

    console.error("[Contact] Unexpected error:", err)

    return NextResponse.json({
      error: "send_failed",
      detail: err instanceof Error ? err.message : "unknown_error"
    }, { status: 500 })

  }
}
