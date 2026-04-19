"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type Props = {
  currentPlan?: string | null;
  currentStatus?: string | null;
};

type CmpRow = {
  label: string;
  premium: boolean | string;
  business: boolean | string;
  enterprise: boolean | string;
};

function CmpCell({ val }: { val: boolean | string }) {
  if (typeof val === "string")
    return <span className="text-sm font-semibold text-[#0A2540]">{val}</span>;
  if (val)
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#eef2ff] text-[11px] font-bold text-[#635BFF]">
        ✓
      </span>
    );
  return <span className="text-slate-300">—</span>;
}

export default function PricingCards({ currentPlan = null, currentStatus = null }: Props) {
  const { t } = useLanguage();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState<string | null>(null);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantReply, setAssistantReply] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);

  async function handleCheckout(plan: string) {
    try {
      setLoading(plan);
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok || !data?.url) {
        alert("Erreur Stripe : " + (data?.error || "Impossible de créer la session"));
        setLoading(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      alert("Erreur réseau.");
      setLoading(null);
    }
  }

  async function askAssistant() {
    if (!assistantInput.trim()) return;
    setAssistantLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Tu es l'assistant pricing premium de Instant Talk. Recommande la formule la plus adaptée entre Premium, Business et Enterprise. Reste concret et court. Question: ${assistantInput.trim()}`,
          activeLanguage: "FR",
        }),
      });
      const data = await res.json();
      setAssistantReply(res.ok ? String(data?.reply || "") : data?.error || "Erreur");
    } catch {
      setAssistantReply("Erreur réseau.");
    } finally {
      setAssistantLoading(false);
    }
  }

  const plans = [
    {
      key: "premium",
      name: t("pricing.premium"),
      desc: t("pricing.premiumDesc"),
      priceMonthly: t("pricing.premiumPrice"),
      priceAnnual: t("pricing.premiumPriceAnnual"),
      cta: t("pricing.premiumCta"),
      featured: false,
      features: [
        t("pricing.premiumF1"),
        t("pricing.premiumF2"),
        t("pricing.premiumF3"),
        t("pricing.premiumF4"),
        t("pricing.premiumF5"),
        t("pricing.premiumF6"),
      ],
    },
    {
      key: "business",
      name: t("pricing.business"),
      desc: t("pricing.businessDesc"),
      priceMonthly: t("pricing.businessPrice"),
      priceAnnual: t("pricing.businessPriceAnnual"),
      cta: t("pricing.businessCta"),
      featured: true,
      features: [
        t("pricing.businessF1"),
        t("pricing.businessF2"),
        t("pricing.businessF3"),
        t("pricing.businessF4"),
        t("pricing.businessF5"),
        t("pricing.businessF6"),
        t("pricing.businessF7"),
        t("pricing.businessF8"),
      ],
    },
    {
      key: "enterprise",
      name: t("pricing.enterprise"),
      desc: t("pricing.enterpriseDesc"),
      priceMonthly: t("pricing.enterprisePrice"),
      priceAnnual: t("pricing.enterprisePrice"),
      cta: t("pricing.enterpriseCta"),
      featured: false,
      features: [
        t("pricing.enterpriseF2"),
        t("pricing.enterpriseF3"),
        t("pricing.enterpriseF4"),
        t("pricing.enterpriseF5"),
        t("pricing.enterpriseF6"),
        t("pricing.enterpriseF7"),
        t("pricing.enterpriseF8"),
      ],
    },
  ];

  const cmpRows: CmpRow[] = [
    { label: t("pricing.cmpF1"),  premium: true,  business: true,  enterprise: true },
    { label: t("pricing.cmpF2"),  premium: true,  business: true,  enterprise: true },
    { label: t("pricing.cmpF3"),  premium: true,  business: true,  enterprise: true },
    { label: t("pricing.cmpF4"),  premium: true,  business: true,  enterprise: true },
    { label: t("pricing.cmpF5"),  premium: true,  business: true,  enterprise: true },
    { label: t("pricing.cmpF6"),  premium: false, business: true,  enterprise: true },
    { label: t("pricing.cmpF7"),  premium: false, business: true,  enterprise: true },
    { label: t("pricing.cmpF8"),  premium: false, business: true,  enterprise: true },
    {
      label: t("pricing.cmpF9"),
      premium: t("pricing.premiumLimit1"),
      business: t("pricing.businessLimit1"),
      enterprise: t("pricing.enterpriseLimit1"),
    },
    { label: t("pricing.cmpF10"), premium: false, business: false, enterprise: true },
    { label: t("pricing.cmpF11"), premium: false, business: false, enterprise: true },
    { label: t("pricing.cmpF12"), premium: false, business: false, enterprise: true },
  ];

  const faqItems = [
    { q: t("pricing.faq1q"), a: t("pricing.faq1a") },
    { q: t("pricing.faq2q"), a: t("pricing.faq2a") },
    { q: t("pricing.faq3q"), a: t("pricing.faq3a") },
    { q: t("pricing.faq4q"), a: t("pricing.faq4a") },
    { q: t("pricing.faq5q"), a: t("pricing.faq5a") },
    { q: t("pricing.faq6q"), a: t("pricing.faq6a") },
  ];

  return (
    <>
      {/* ── Billing Toggle ── */}
      <div className="mb-12 flex justify-center">
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              billing === "monthly"
                ? "bg-[#0A2540] text-white"
                : "text-slate-500 hover:text-[#0A2540]"
            }`}
          >
            {t("pricing.monthly")}
          </button>
          <button
            type="button"
            onClick={() => setBilling("annual")}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${
              billing === "annual"
                ? "bg-[#0A2540] text-white"
                : "text-slate-500 hover:text-[#0A2540]"
            }`}
          >
            {t("pricing.annual")}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                billing === "annual"
                  ? "bg-emerald-400 text-white"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* ── 3 Plan Cards ── */}
      <div className="grid gap-8 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.key;
          const price =
            billing === "annual" ? plan.priceAnnual : plan.priceMonthly;
          const isEnterprise = plan.key === "enterprise";

          return (
            <div
              key={plan.key}
              className={`flex flex-col rounded-[32px] border p-8 shadow-[0_20px_60px_-30px_rgba(10,37,64,0.22)] ${
                isCurrent
                  ? "border-emerald-400 bg-white ring-2 ring-emerald-100"
                  : plan.featured
                  ? "border-[#635BFF] bg-white ring-2 ring-[#635BFF]/10"
                  : "border-slate-200 bg-white"
              }`}
            >
              {/* Badge row — always reserved height */}
              <div className="mb-5 h-7">
                {isCurrent ? (
                  <span className="inline-flex rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                    {currentStatus === "trialing" ? "Essai actif" : "Plan actuel"}
                  </span>
                ) : plan.featured ? (
                  <span className="inline-flex rounded-full bg-[#635BFF] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                    {t("pricing.popular")}
                  </span>
                ) : null}
              </div>

              <h2 className="text-2xl font-extrabold text-[#0A2540]">{plan.name}</h2>
              <p className="mt-3 min-h-[56px] text-sm leading-7 text-[#425466]">
                {plan.desc}
              </p>

              <div className="mt-6 flex items-end gap-2">
                <span className="text-5xl font-extrabold tracking-tight text-[#0A2540]">
                  {price}
                </span>
                {!isEnterprise && (
                  <span className="pb-2 text-base font-medium text-[#425466]">
                    {billing === "annual"
                      ? t("pricing.perYear")
                      : t("pricing.perMonth")}
                  </span>
                )}
              </div>

              {!isEnterprise && (
                <div className="mt-2 text-sm font-semibold text-[#635bff]">
                  {t("pricing.trialText")}
                </div>
              )}

              {/* CTA */}
              <div className="mt-8">
                {isEnterprise ? (
                  <Link
                    href="/contact"
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-[#0A2540] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#16324f]"
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!isCurrent) void handleCheckout(plan.key);
                    }}
                    disabled={isCurrent || loading === plan.key}
                    className={`inline-flex w-full items-center justify-center rounded-2xl px-5 py-4 text-sm font-semibold transition disabled:cursor-not-allowed ${
                      isCurrent
                        ? "bg-slate-200 text-slate-500"
                        : plan.featured
                        ? "bg-[#635BFF] text-white hover:bg-[#5247ff]"
                        : "bg-[#0A2540] text-white hover:bg-[#16324f]"
                    }`}
                  >
                    {isCurrent
                      ? currentStatus === "trialing"
                        ? "Essai actif ✓"
                        : "Plan actuel ✓"
                      : loading === plan.key
                      ? "Redirection..."
                      : plan.cta}
                  </button>
                )}
              </div>

              {/* Features list */}
              <div className="mt-8 border-t border-slate-100 pt-8">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  {t("pricing.included")}
                </div>
                <ul className="mt-5 space-y-4">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-3 text-sm leading-7 text-[#425466]"
                    >
                      <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[11px] font-bold text-[#635BFF]">
                        ✓
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Comparison Table ── */}
      <section className="mt-20 overflow-x-auto rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[620px]">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="p-6 text-left text-sm font-bold text-[#0A2540]">
                {t("pricing.featureCol")}
              </th>
              <th className="p-6 text-center text-sm font-bold text-[#0A2540]">
                {t("pricing.premium")}
              </th>
              <th className="p-6 text-center text-sm font-bold text-[#635BFF]">
                {t("pricing.business")}
              </th>
              <th className="p-6 text-center text-sm font-bold text-[#0A2540]">
                {t("pricing.enterprise")}
              </th>
            </tr>
          </thead>
          <tbody>
            {cmpRows.map((row, i) => (
              <tr
                key={row.label}
                className={i % 2 === 0 ? "bg-slate-50/50" : ""}
              >
                <td className="p-5 text-sm text-[#425466]">{row.label}</td>
                <td className="p-5 text-center">
                  <CmpCell val={row.premium} />
                </td>
                <td className="p-5 text-center">
                  <CmpCell val={row.business} />
                </td>
                <td className="p-5 text-center">
                  <CmpCell val={row.enterprise} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── AI Pricing Assistant ── */}
      <section className="mt-20 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex rounded-full border border-slate-200 bg-[#f6f9fc] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#635bff] shadow-sm">
              {t("pricing.aiAssistant")}
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0A2540]">
              {t("pricing.aiTitle")}
            </h2>
            <p className="mt-3 text-base leading-8 text-[#425466]">
              {t("pricing.aiSub")}
            </p>
          </div>
          <button
            type="button"
            onClick={askAssistant}
            disabled={assistantLoading || !assistantInput.trim()}
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#0A2540] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#16324f] disabled:opacity-60"
          >
            {assistantLoading ? t("pricing.aiLoading") : t("pricing.aiBtn")}
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[24px] border border-slate-200 bg-[#f8fafc] p-5">
            <label className="mb-3 block text-sm font-semibold text-[#0A2540]">
              {t("pricing.aiSituation")}
            </label>
            <textarea
              value={assistantInput}
              onChange={(e) => setAssistantInput(e.target.value)}
              rows={5}
              className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#635bff]"
              placeholder={t("pricing.aiPlaceholder")}
            />
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-[#eef2ff] p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#635bff]">
              {t("pricing.aiResult")}
            </div>
            <div className="mt-4 min-h-[160px] whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-7 text-[#0A2540]">
              {assistantReply || t("pricing.aiResultPlaceholder")}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="mt-20">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#635bff] shadow-sm">
            {t("pricing.faqBadge")}
          </div>
          <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-[#0A2540] md:text-5xl">
            {t("pricing.faqTitle")}
          </h2>
        </div>
        <div className="mt-12 grid gap-6">
          {faqItems.map((item) => (
            <div
              key={item.q}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-30px_rgba(10,37,64,0.18)]"
            >
              <h3 className="text-xl font-bold text-[#0A2540]">{item.q}</h3>
              <p className="mt-3 text-[15px] leading-8 text-[#425466]">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="mt-20 rounded-[36px] border border-slate-200 bg-[#0A2540] p-8 shadow-[0_30px_90px_-40px_rgba(10,37,64,0.45)] md:p-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">
            {t("pricing.finalBadge")}
          </div>
          <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            {t("pricing.finalTitle")}
          </h2>
          <p className="mt-6 text-lg leading-8 text-white/70">
            {t("pricing.finalText")}
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            {currentPlan ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-4 text-base font-semibold text-[#0A2540] transition hover:bg-slate-100"
              >
                Accéder au dashboard
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => void handleCheckout("premium")}
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-4 text-base font-semibold text-[#0A2540] transition hover:bg-slate-100"
              >
                {t("pricing.finalCta1")}
              </button>
            )}
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-7 py-4 text-base font-semibold text-white transition hover:bg-white/15"
            >
              {t("pricing.finalCta2")}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
