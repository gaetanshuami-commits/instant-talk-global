"use client";

import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function PricingPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#f6f9fc] font-sans pb-24">
      <Navbar />

      <div className="mx-auto max-w-6xl px-6 pt-24 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-[#0A2540] md:text-6xl">
          {t("pricing.title")}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-xl text-[#425466]">
          {t("pricing.sub")}
        </p>

        <div className="mt-16 grid grid-cols-1 gap-8 text-left md:grid-cols-3 items-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_18px_50px_-25px_rgba(10,37,64,0.22)]">
            <h3 className="text-2xl font-bold text-[#0A2540]">{t("pricing.b2c_title")}</h3>
            <p className="mt-2 text-sm text-[#425466]">{t("pricing.b2c_desc")}</p>
            <div className="mt-8 flex items-end gap-2">
              <span className="text-5xl font-extrabold tracking-tight text-[#0A2540]">{t("pricing.b2c_price")}</span>
              <span className="pb-2 text-base font-medium text-[#425466]">{t("pricing.b2c_period")}</span>
            </div>
            <a
              href="https://buy.stripe.com/3cIeVd1le4fL9EddLM1ZS00"
              className="mt-8 block rounded-2xl bg-[#eef2f7] px-5 py-4 text-center text-sm font-semibold text-[#0A2540] transition hover:bg-[#e3e8ef]"
            >
              {t("pricing.b2c_trial")}
            </a>
            <ul className="mt-8 space-y-4 text-sm text-[#425466]">
              <li>✓ {t("pricing.b2c_f1")}</li>
              <li>✓ {t("pricing.b2c_f2")}</li>
              <li>✓ {t("pricing.b2c_f3")}</li>
            </ul>
          </div>

          <div className="relative rounded-3xl border-2 border-[#635BFF] bg-white p-8 shadow-[0_24px_65px_-25px_rgba(99,91,255,0.35)]">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#635BFF] px-4 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow">
              {t("pricing.biz_badge")}
            </div>

            <h3 className="text-2xl font-bold text-[#0A2540]">{t("pricing.biz_title")}</h3>
            <p className="mt-2 text-sm text-[#425466]">{t("pricing.biz_desc")}</p>
            <div className="mt-8 flex items-end gap-2">
              <span className="text-5xl font-extrabold tracking-tight text-[#0A2540]">{t("pricing.biz_price")}</span>
              <span className="pb-2 text-base font-medium text-[#425466]">{t("pricing.biz_period")}</span>
            </div>
            <a
              href="https://buy.stripe.com/3cI6oH1le4fL8A9bDE1ZS01"
              className="mt-8 block rounded-2xl bg-[#635BFF] px-5 py-4 text-center text-sm font-semibold text-white transition hover:bg-[#4f46e5]"
            >
              {t("pricing.biz_trial")}
            </a>
            <ul className="mt-8 space-y-4 text-sm text-[#425466]">
              <li>✓ {t("pricing.biz_f1")}</li>
              <li>✓ {t("pricing.biz_f2")}</li>
              <li>✓ {t("pricing.biz_f3")}</li>
              <li>✓ {t("pricing.biz_f4")}</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_18px_50px_-25px_rgba(10,37,64,0.22)]">
            <h3 className="text-2xl font-bold text-[#0A2540]">{t("pricing.ent_title")}</h3>
            <p className="mt-2 text-sm text-[#425466]">{t("pricing.ent_desc")}</p>
            <div className="mt-8">
              <span className="text-5xl font-extrabold tracking-tight text-[#0A2540]">{t("pricing.ent_price")}</span>
            </div>
            <Link
              href="/contact"
              className="mt-8 block rounded-2xl bg-[#0A2540] px-5 py-4 text-center text-sm font-semibold text-white transition hover:bg-[#16324f]"
            >
              {t("pricing.ent_contact")}
            </Link>
            <ul className="mt-8 space-y-4 text-sm text-[#425466]">
              <li>✓ {t("pricing.ent_f1")}</li>
              <li>✓ {t("pricing.ent_f2")}</li>
              <li>✓ {t("pricing.ent_f3")}</li>
              <li>✓ {t("pricing.ent_f4")}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}