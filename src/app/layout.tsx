import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

export const metadata: Metadata = {
  title: "Instant Talk",
  description:
    "Instant Talk est une plateforme de communication mondiale avec traduction vocale instantanée, sous-titres synchronisés et expérience premium."
};

export const viewport: Viewport = {
  themeColor: "#0A2540"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}