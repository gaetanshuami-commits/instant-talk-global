"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { normalizeAccess, setClientAccess } from "@/lib/access";

export default function SuccessPage() {
  const [search, setSearch] = useState("");
  const { t } = useLanguage();

  useEffect(() => {
    setSearch(window.location.search);
  }, []);

  const plan = useMemo(() => {
    const searchParams = new URLSearchParams(search);
    return normalizeAccess(searchParams.get("plan")) || "premium";
  }, [search]);

  useEffect(() => {
    setClientAccess(plan);
  }, [plan]);

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <Navbar />

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-20">
        <div className="rounded-[32px] border border-slate-200 bg-white p-10 shadow-[0_25px_60px_-30px_rgba(10,37,64,0.22)]">
          <div className="inline-flex rounded-full bg-emerald-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">
            Acces active
          </div>

          <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-[#0A2540]">
            {t("success.title")}
          </h1>

          <p className="mt-5 text-lg leading-8 text-[#425466]">
            {t("success.text")}
          </p>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-[#f8fafc] p-4 text-sm text-[#0A2540]">
            Plan active: <span className="font-semibold uppercase">{plan}</span>
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/room/demo-access"
              className="inline-flex items-center justify-center rounded-full bg-[#0A2540] px-7 py-4 text-base font-semibold text-white transition hover:bg-[#16324f]"
            >
              {t("success.cta1")}
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-4 text-base font-semibold text-[#0A2540] transition hover:bg-slate-50"
            >
              {t("success.cta2")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
