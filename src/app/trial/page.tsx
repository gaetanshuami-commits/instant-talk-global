"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { setClientAccess } from "@/lib/access";

export default function TrialPage() {
  const { t } = useLanguage();

  useEffect(() => {
    const maxAge = 60 * 60 * 24 * 3;
    document.cookie = `instanttalk_access=trial; path=/; max-age=${maxAge}; SameSite=Lax`;
    setClientAccess("trial");
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <Navbar />

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-20">
        <div className="rounded-[32px] border border-slate-200 bg-white p-10 shadow-[0_25px_60px_-30px_rgba(10,37,64,0.22)]">
          <div className="inline-flex rounded-full bg-[#eef2ff] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#635bff]">
            Essai activé
          </div>

          <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-[#0A2540]">
            {t("trial.title")}
          </h1>

          <p className="mt-5 text-lg leading-8 text-[#425466]">
            {t("trial.text")}
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/room/demo-access"
              className="inline-flex items-center justify-center rounded-full bg-[#0A2540] px-7 py-4 text-base font-semibold text-white transition hover:bg-[#16324f]"
            >
              {t("trial.cta1")}
            </Link>

            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-4 text-base font-semibold text-[#0A2540] transition hover:bg-slate-50"
            >
              {t("trial.cta2")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}