"use client";

import { Navbar } from "@/components/ui/Navbar";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ContactPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 pb-24 pt-24 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-[#0A2540]">{t("contact.title")}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-xl text-[#425466]">{t("contact.sub")}</p>
      </main>
    </div>
  );
}