import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

export const metadata: Metadata = {
  title: {
    default: "Instant Talk — Visioconférence avec traduction vocale instantanée",
    template: "%s | Instant Talk",
  },
  description:
    "Instant Talk est la première plateforme de visioconférence avec traduction vocale instantanée en temps réel. Parlez votre langue — le monde vous comprend. 26 langues, voix naturelle, sous-titres synchronisés.",
  keywords: [
    "visioconférence multilingue",
    "traduction vocale temps réel",
    "réunion internationale",
    "instant talk",
    "video call translation",
    "real-time voice translation",
  ],
  authors: [{ name: "Instant Talk Global" }],
  creator: "Instant Talk Global",
  metadataBase: new URL("https://instanttalk.io"),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://instanttalk.io",
    siteName: "Instant Talk",
    title: "Instant Talk — Visioconférence avec traduction vocale instantanée",
    description:
      "La première plateforme de réunion vidéo avec traduction vocale en temps réel. 26 langues. Voix naturelle. Zéro barrière linguistique.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Instant Talk — Traduction vocale temps réel",
    description: "Parlez votre langue. Le monde vous comprend instantanément.",
    creator: "@instanttalk",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0A2540",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
