export async function sendMeetingInvitationEmail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.MEETINGS_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    return { sent: false, reason: "missing_email_provider_config" as const };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`email_send_failed:${text}`);
  }

  return { sent: true as const };
}
