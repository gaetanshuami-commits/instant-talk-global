"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/* ── Plan data ───────────────────────────────────────────────────────────────── */
const plans = [
  {
    key: "premium",
    priceMonthly: 24,
    priceAnnual: 19,
    stripeMonthly: "https://buy.stripe.com/3cIeVd1le4fL9EddLM1ZS00",
    stripeAnnual:  "https://buy.stripe.com/3cIeVd1le4fL9EddLM1ZS00",
    simulate: "/success?plan=premium",
    featureKeys: ["premiumF1","premiumF2","premiumF3","premiumF4","premiumF5","premiumF6"],
    limitKeys:   ["premiumLimit1","premiumLimit2"],
  },
  {
    key: "business",
    priceMonthly: 99,
    priceAnnual: 79,
    stripeMonthly: "https://buy.stripe.com/3cI6oH1le4fL8A9bDE1ZS01",
    stripeAnnual:  "https://buy.stripe.com/3cI6oH1le4fL8A9bDE1ZS01",
    simulate: "/success?plan=business",
    featured: true,
    featureKeys: ["businessF1","businessF2","businessF3","businessF4","businessF5","businessF6","businessF7","businessF8"],
    limitKeys:   ["businessLimit1","businessLimit2"],
  },
  {
    key: "enterprise",
    priceMonthly: null,
    priceAnnual: null,
    stripeMonthly: "/contact",
    stripeAnnual:  "/contact",
    simulate: null,
    featureKeys: ["enterpriseF1","enterpriseF2","enterpriseF3","enterpriseF4","enterpriseF5","enterpriseF6","enterpriseF7","enterpriseF8"],
    limitKeys:   ["enterpriseLimit1","enterpriseLimit2"],
  },
];

/* ── Comparison table rows ───────────────────────────────────────────────────── */
const compareRows = [
  { featureKey: "cmpF1",  premium: true,  business: true,  enterprise: true  },
  { featureKey: "cmpF2",  premium: true,  business: true,  enterprise: true  },
  { featureKey: "cmpF3",  premium: true,  business: true,  enterprise: true  },
  { featureKey: "cmpF4",  premium: true,  business: true,  enterprise: true  },
  { featureKey: "cmpF5",  premium: false, business: true,  enterprise: true  },
  { featureKey: "cmpF6",  premium: false, business: true,  enterprise: true  },
  { featureKey: "cmpF7",  premium: false, business: true,  enterprise: true  },
  { featureKey: "cmpF8",  premium: false, business: true,  enterprise: true  },
  { featureKey: "cmpF9",  premium: "5",   business: "50",  enterprise: "∞"   },
  { featureKey: "cmpF10", premium: false, business: false, enterprise: true  },
  { featureKey: "cmpF11", premium: false, business: false, enterprise: true  },
  { featureKey: "cmpF12", premium: false, business: false, enterprise: true  },
];

/* ── FAQ keys ────────────────────────────────────────────────────────────────── */
const faqKeys = [
  { q: "faq1q", a: "faq1a" },
  { q: "faq2q", a: "faq2a" },
  { q: "faq3q", a: "faq3a" },
  { q: "faq4q", a: "faq4a" },
  { q: "faq5q", a: "faq5a" },
  { q: "faq6q", a: "faq6a" },
];

function CheckIcon({ active }: { active: boolean | string }) {
  if (typeof active === "string") {
    return <span className="text-sm font-bold text-[#0a2540]">{active}</span>;
  }
  if (active) {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-emerald-500 mx-auto">
        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
      </svg>
    );
  }
  return <span className="text-slate-300 text-lg mx-auto block text-center">—</span>;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between px-6 py-5 text-left"
      >
        <span className="pr-4 text-base font-semibold text-[#0a2540]">{q}</span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform mt-0.5 ${open ? "rotate-180" : ""}`}
        >
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-slate-100 px-6 pb-5 pt-3 text-sm leading-7 text-slate-500">
          {a}
        </div>
      )}
    </div>
  );
}

export default function PricingPage() {
  const { t, lang } = useLanguage();
  const [annual, setAnnual] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    setSource(new URLSearchParams(window.location.search).get("source"));
  }, []);

  async function startCheckout(plan: "premium" | "business") {
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, trial: false }),
      });
      const data = await res.json();
      if (!res.ok || !data?.url) {
        throw new Error(data?.details || data?.error || "Stripe checkout failed");
      }
      window.location.href = data.url;
    } catch (error) {
      console.error("[pricing checkout]", error instanceof Error ? error.message : "unknown_error");
      setLoadingPlan(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <Navbar />

      <main className="pb-24">

        {/* ── Access required banner ── */}
        {source === "room" && (
          <div className="border-b border-violet-200 bg-violet-50 py-4 text-center">
            <p className="text-sm font-medium text-violet-700">
              {t("pricing.accessRequired")}{" "}
              <Link href="/trial" className="font-bold underline">{t("pricing.startTrial")} →</Link>
            </p>
          </div>
        )}

        {/* ── Header ── */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-white pt-20 pb-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/4 -top-20 h-80 w-80 rounded-full bg-violet-100/60 blur-[100px]" />
            <div className="absolute right-1/4 -top-10 h-60 w-60 rounded-full bg-sky-100/40 blur-[80px]" />
          </div>
          <div className="relative mx-auto max-w-3xl px-6 text-center">
            <div className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-violet-600 shadow-sm">
              {t("pricing.badge")}
            </div>
            <h1 className="mt-5 text-5xl font-extrabold tracking-tight text-[#0a2540] md:text-6xl">
              {t("pricing.title")}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-slate-500">
              {t("pricing.sub")}
            </p>

            {/* Monthly / Annual toggle */}
            <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
              <button
                onClick={() => setAnnual(false)}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                  !annual ? "bg-[#0a2540] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t("pricing.monthly")}
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                  annual ? "bg-[#0a2540] text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t("pricing.annual")}
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  annual ? "bg-emerald-400 text-white" : "bg-emerald-100 text-emerald-600"
                }`}>
                  {t("pricing.annualSave")}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* ── Plans ── */}
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-7 lg:grid-cols-3">
            {plans.map((plan) => {
              const name = t(`pricing.${plan.key}`);
              const desc = t(`pricing.${plan.key}Desc`);
              const cta  = t(`pricing.${plan.key}Cta`);
              const featureList = plan.featureKeys.map((k) => t(`pricing.${k}`));
              const limitList   = plan.limitKeys.map((k) => t(`pricing.${k}`));
              const price = annual ? plan.priceAnnual : plan.priceMonthly;
              const period = plan.priceMonthly
                ? annual ? t("pricing.perYear") : t("pricing.perMonth")
                : "";
              const href = annual ? plan.stripeAnnual : plan.stripeMonthly;

              return (
                <div
                  key={plan.key}
                  className={`relative flex flex-col rounded-[28px] border p-8 transition ${
                    plan.featured
                      ? "border-violet-400/60 bg-white ring-2 ring-violet-200/60 shadow-[0_20px_60px_-20px_rgba(99,91,255,0.3)]"
                      : "border-slate-200 bg-white shadow-sm"
                  }`}
                >
                  {plan.featured && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <div className="rounded-full bg-violet-600 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-lg">
                        {t("pricing.popular")}
                      </div>
                    </div>
                  )}

                  <div>
                    <h2 className="text-2xl font-extrabold text-[#0a2540]">{name}</h2>
                    <p className="mt-2 min-h-[44px] text-sm leading-6 text-slate-500">{desc}</p>
                  </div>

                  <div className="mt-6">
                    {price !== null ? (
                      <div className="flex items-end gap-1.5">
                        <span className="text-5xl font-extrabold tracking-tight text-[#0a2540]">
                          {price}€
                        </span>
                        <span className="mb-1.5 text-sm text-slate-400">{period}</span>
                      </div>
                    ) : (
                      <div className="text-3xl font-extrabold text-[#0a2540]">
                        {t("pricing.enterprisePrice")}
                      </div>
                    )}
                    {price && annual && (
                      <p className="mt-1 text-xs text-emerald-600 font-medium">
                        {t("pricing.annualBilled").replace("{price}", String(price))}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-violet-600 font-semibold">{t("pricing.trialText")}</p>
                  </div>

                  <div className="mt-6 flex flex-col gap-2.5">
                    {plan.key === "enterprise" ? (
                      <Link
                        href={href}
                        className="flex items-center justify-center rounded-2xl border-2 border-[#0a2540] px-5 py-4 text-sm font-bold text-[#0a2540] transition hover:bg-slate-50"
                      >
                        {cta}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void startCheckout(plan.key as "premium" | "business")}
                        disabled={loadingPlan === plan.key}
                        className={`flex items-center justify-center rounded-2xl px-5 py-4 text-sm font-bold transition disabled:opacity-60 ${
                          plan.featured
                            ? "bg-violet-600 text-white hover:bg-violet-700 shadow-[0_8px_20px_-6px_rgba(99,91,255,0.5)]"
                            : "bg-[#0a2540] text-white hover:bg-[#16324f]"
                        }`}
                      >
                        {loadingPlan === plan.key ? "Redirection Stripe..." : cta}
                      </button>
                    )}
                    {plan.simulate && (
                      <Link
                        href={plan.simulate}
                        className="flex items-center justify-center rounded-2xl border border-slate-200 bg-[#f6f9fc] px-5 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
                      >
                        {t("pricing.simulate")}
                      </Link>
                    )}
                  </div>

                  {/* Limits pills */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {limitList.map((l) => (
                      <span key={l} className="rounded-full border border-slate-200 bg-[#f6f9fc] px-3 py-1 text-[11px] font-semibold text-slate-500">
                        {l}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      {t("pricing.included")}
                    </p>
                    <ul className="mt-4 space-y-3">
                      {featureList.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm leading-6 text-slate-600">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Comparison table ── */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <div className="overflow-x-auto rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-5 pl-7 pr-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-400 w-1/2">
                    {t("pricing.featureCol")}
                  </th>
                  {(["premium","business","enterprise"] as const).map((p) => (
                    <th key={p} className="py-5 px-4 text-center text-sm font-extrabold text-[#0a2540]">
                      {t(`pricing.${p}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row, i) => (
                  <tr
                    key={row.featureKey}
                    className={i % 2 === 0 ? "bg-[#f8fafc]" : "bg-white"}
                  >
                    <td className="py-4 pl-7 pr-4 text-slate-600">{t(`pricing.${row.featureKey}`)}</td>
                    <td className="py-4 px-4 text-center"><CheckIcon active={row.premium} /></td>
                    <td className="py-4 px-4 text-center bg-violet-50/50"><CheckIcon active={row.business} /></td>
                    <td className="py-4 px-4 text-center"><CheckIcon active={row.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── AI Pricing Assistant ── */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <AIPricingAssistant lang={lang} t={t} />
        </section>

        {/* ── FAQ ── */}
        <section className="mx-auto max-w-4xl px-6 pb-16">
          <div className="mb-8 text-center">
            <div className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#635bff] shadow-sm">
              {t("pricing.faqBadge")}
            </div>
            <h2 className="mt-5 text-4xl font-extrabold tracking-tight text-[#0a2540]">
              {t("pricing.faqTitle")}
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {faqKeys.map((item) => (
              <FaqItem key={item.q} q={t(`pricing.${item.q}`)} a={t(`pricing.${item.a}`)} />
            ))}
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="mx-auto max-w-7xl px-6">
          <div className="relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#0a2540_0%,#1a1060_100%)] p-10 md:p-14 text-center shadow-[0_30px_80px_-30px_rgba(10,37,64,0.5)]">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/4 top-0 h-64 w-64 rounded-full bg-violet-500/15 blur-[80px]" />
              <div className="absolute right-1/4 bottom-0 h-48 w-48 rounded-full bg-sky-500/10 blur-[60px]" />
            </div>
            <div className="relative">
              <div className="inline-flex rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">
                {t("pricing.finalBadge")}
              </div>
              <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                {t("pricing.finalTitle")}
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/65">
                {t("pricing.finalText")}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/trial"
                  className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-[15px] font-bold text-[#0a2540] shadow-xl transition hover:-translate-y-0.5"
                >
                  {t("pricing.finalCta1")}
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-8 py-4 text-[15px] font-semibold text-white transition hover:bg-white/15"
                >
                  {t("pricing.finalCta2")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ── AI Assistant ──────────────────────────────────────────────────────────── */
function AIPricingAssistant({ lang, t }: { lang: string; t: (k: string) => string }) {
  const [input, setInput]     = useState("");
  const [reply, setReply]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function ask() {
    const msg = input.trim();
    if (!msg) return;
    setLoading(true);
    setError("");
    setReply("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `You are the premium pricing assistant for Instant Talk. Recommend the best plan between Premium (€24/month, 5 participants), Business (€99/month, 50 participants) and Enterprise (custom, unlimited). Be concrete, professional and concise. Respond in the user's language. Question: ${msg}`,
          activeLanguage: lang.toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Error");
      setReply(String(data?.reply ?? ""));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex-1">
          <div className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-violet-600">
            {t("pricing.aiAssistant")}
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0a2540]">
            {t("pricing.aiTitle")}
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            {t("pricing.aiSub")}
          </p>
        </div>
        <button
          onClick={ask}
          disabled={loading || !input.trim()}
          className="shrink-0 self-start rounded-2xl bg-[#0a2540] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#16324f] disabled:opacity-50"
        >
          {loading ? t("pricing.aiLoading") : t("pricing.aiBtn")}
        </button>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-4">
          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            {t("pricing.aiSituation")}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            placeholder={t("pricing.aiPlaceholder")}
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />
        </div>
        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-violet-500">
            {t("pricing.aiResult")}
          </div>
          <div className="min-h-[120px] rounded-xl border border-violet-100 bg-white p-4 text-sm leading-7 text-[#0a2540]">
            {error
              ? <span className="text-rose-500">{error}</span>
              : reply || (
                <span className="text-slate-400">
                  {t("pricing.aiResultPlaceholder")}
                </span>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
