import React from "react";
import LegalScreen from "./LegalScreen";

const SECTIONS = [
  {
    heading: "1. Acceptance",
    body: "By downloading, installing, or using the Instant Talk application, you agree to be bound by these Terms of Service. If you do not agree, do not use the application.",
  },
  {
    heading: "2. Service Description",
    body: "Instant Talk provides real-time multilingual communication, including live speech translation, AI-powered text-to-speech, voice cloning, and meeting scheduling across 26 languages.",
  },
  {
    heading: "3. Account",
    body: "You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately of any unauthorised use of your account. You may not share accounts or use the service for purposes other than those stated.",
  },
  {
    heading: "4. Acceptable Use",
    body: "You agree not to:\n• Use the service for illegal purposes or to transmit harmful content.\n• Attempt to reverse-engineer, scrape, or disrupt the service.\n• Impersonate others or misrepresent your identity.\n• Use the service to harass, threaten, or abuse others.\n• Circumvent usage limits or access controls.",
  },
  {
    heading: "5. Subscriptions and Billing",
    body: "Some features require a paid subscription. Subscriptions renew automatically unless cancelled at least 24 hours before the renewal date. Refunds are issued at our discretion for unused portions of a subscription period. Prices may change with 30 days' notice.",
  },
  {
    heading: "6. Intellectual Property",
    body: "All platform technology, AI models, branding, and UI are owned by Instant Talk SAS. You retain ownership of content you create (meetings, recordings) but grant us a limited licence to process it to provide the service.",
  },
  {
    heading: "7. Voice Cloning",
    body: "Voice cloning features are session-scoped. You must have legal right to clone any voice you submit. You may not use voice cloning to impersonate individuals without their explicit consent.",
  },
  {
    heading: "8. Limitation of Liability",
    body: "Instant Talk is provided \"as is\". We are not liable for indirect, incidental, or consequential damages. Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.",
  },
  {
    heading: "9. Termination",
    body: "We may suspend or terminate your account for violation of these terms, without prior notice. You may terminate your account at any time from the Settings screen.",
  },
  {
    heading: "10. Governing Law",
    body: "These terms are governed by the laws of France. Disputes shall be resolved by the competent courts of Paris.",
  },
  {
    heading: "11. Contact",
    body: "Questions about these Terms:",
  },
];

export default function TermsScreen() {
  return (
    <LegalScreen
      title="Terms of Service"
      effectiveDate="April 1, 2026"
      sections={SECTIONS}
      contactEmail="legal@instant-talk.com"
    />
  );
}
