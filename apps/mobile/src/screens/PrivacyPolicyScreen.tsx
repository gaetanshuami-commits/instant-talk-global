import React from "react";
import LegalScreen from "./LegalScreen";

const SECTIONS = [
  {
    heading: "1. Who We Are",
    body: "Instant Talk is a multilingual real-time communication platform operated by Instant Talk SAS. This Privacy Policy explains how we collect, use, and protect your personal data when you use the Instant Talk mobile application.",
  },
  {
    heading: "2. Data We Collect",
    body: "• Account data: email address, customer reference ID.\n• Meeting data: meeting titles, scheduled times, participant email addresses, meeting duration.\n• Voice data: audio recordings processed in real-time for live translation and speech-to-text. Voice clone audio is processed but not stored beyond the active session.\n• Usage data: feature interactions, session duration, language preferences.\n• Device data: device type, OS version, app version, push notification token.",
  },
  {
    heading: "3. How We Use Your Data",
    body: "• To provide and operate the Instant Talk service.\n• To perform real-time speech recognition and translation.\n• To send meeting reminders (with your consent).\n• To improve translation quality and AI model accuracy (aggregated, anonymised).\n• To manage your subscription and billing via Stripe.\n• To detect and prevent fraud or abuse.",
  },
  {
    heading: "4. Third-Party Services",
    body: "We share data with trusted sub-processors:\n• Agora (video/audio infrastructure) — processes real-time audio/video streams.\n• ElevenLabs (text-to-speech) — processes translated text to synthesise speech.\n• Microsoft Azure (speech recognition) — processes audio for transcription and translation.\n• Stripe (billing) — processes payment and subscription data.\n• Supabase (database) — stores meeting and account records.\n\nEach sub-processor is bound by a Data Processing Agreement and is GDPR-compliant.",
  },
  {
    heading: "5. Data Retention",
    body: "• Meeting records are retained for 90 days, then automatically deleted.\n• Voice clone audio is session-scoped and never written to disk.\n• Billing records are retained as required by applicable law (typically 7 years).\n• You may request deletion of your account data at any time.",
  },
  {
    heading: "6. Your Rights",
    body: "Under GDPR and applicable data protection laws, you have the right to:\n• Access the personal data we hold about you.\n• Request correction of inaccurate data.\n• Request deletion of your data (right to erasure).\n• Object to or restrict processing.\n• Data portability.\n\nTo exercise these rights, contact us at privacy@instant-talk.com.",
  },
  {
    heading: "7. Security",
    body: "All data is transmitted over TLS 1.3. Audio streams are encrypted end-to-end via Agora's media encryption. We apply least-privilege access controls and regular security audits.",
  },
  {
    heading: "8. Children's Privacy",
    body: "Instant Talk is not directed at children under 16. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, contact us immediately.",
  },
  {
    heading: "9. Changes to This Policy",
    body: "We may update this policy from time to time. Significant changes will be notified via in-app notification or email. Continued use after the effective date constitutes acceptance.",
  },
  {
    heading: "10. Contact",
    body: "Data Controller: Instant Talk SAS\nEmail:",
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <LegalScreen
      title="Privacy Policy"
      effectiveDate="April 1, 2026"
      sections={SECTIONS}
      contactEmail="privacy@instant-talk.com"
    />
  );
}
