export async function sendMeetingInvitationEmail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.MEETINGS_FROM_EMAIL?.trim();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY missing");
  }

  if (!from) {
    throw new Error("MEETINGS_FROM_EMAIL missing");
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

  const raw = await res.text();

  if (!res.ok) {
    throw new Error(`email_send_failed:${raw}`);
  }

  return { sent: true as const, raw };
}
