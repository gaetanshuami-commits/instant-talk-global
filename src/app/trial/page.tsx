"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Mic, FileText, Globe, Zap, Lock } from "lucide-react";

const trialFeatures: { Icon: React.FC; title: string; desc: string }[] = [
  { Icon: () => <Mic size={18} />, title: "Traduction vocale instantanée", desc: "Parlez : la plateforme traduit en temps réel avec une voix naturelle." },
  { Icon: () => <FileText size={18} />, title: "Sous-titres synchronisés", desc: "Chaque participant suit la conversation dans sa langue." },
  { Icon: () => <Globe size={18} />, title: "26 langues supportées", desc: "Du français au swahili, toutes les grandes langues mondiales." },
  { Icon: () => <Zap size={18} />, title: "Latence ultra faible", desc: "Moins de 400 ms. La compréhension reste immédiate." },
];

export default function TrialPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const startTrial = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/stripe/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ plan: "premium", trial: true }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Erreur lors de la création de l'essai.");
      }
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-14">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">

          {/* ── Left: features ── */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Essai gratuit 3 jours
            </div>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-[#0a2540] md:text-5xl">
              {t("trial.title")}
            </h1>
            <p className="mt-4 text-base leading-8 text-slate-500">
              {t("trial.text")}
            </p>

            <div className="mt-8 flex flex-col gap-4">
              {trialFeatures.map((f) => (
                <div
                  key={f.title}
                  className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 mt-0.5"><f.Icon /></span>
                  <div>
                    <div className="text-sm font-bold text-[#0a2540]">{f.title}</div>
                    <div className="mt-0.5 text-sm leading-6 text-slate-500">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: CTA card ── */}
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_25px_60px_-30px_rgba(10,37,64,0.16)]">
            {/* Plan badge */}
            <div className="mb-5 flex items-center justify-between">
              <div className="rounded-xl bg-violet-50 border border-violet-100 px-3 py-1.5 text-xs font-bold text-violet-600 uppercase tracking-wider">
                Plan Premium
              </div>
              <div className="text-sm font-semibold text-emerald-600">3 jours gratuits</div>
            </div>

            {/* Price display */}
            <div className="rounded-2xl border border-slate-100 bg-[#f8fafc] p-5 text-center">
              <div className="text-4xl font-extrabold text-[#0a2540]">0€</div>
              <div className="mt-1 text-sm text-slate-400">pendant 3 jours</div>
              <div className="mt-2 text-xs text-slate-400">puis 24€/mois, annulable avant</div>
            </div>

            {/* Guarantees */}
            <ul className="mt-5 space-y-2.5">
              {[
                "Aucun débit pendant l'essai",
                "Accès complet au plan Premium",
                "Annulation en un clic avant la fin",
                "Paiement sécurisé par Stripe",
                "Aucune carte demandée avant",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-slate-600">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-emerald-500">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            {error && (
              <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {error}
              </p>
            )}

            <button
              onClick={startTrial}
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0a2540] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#16324f] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Redirection Stripe…
                </>
              ) : (
                <>
                  {t("trial.cta1")}
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>

            <Link
              href="/pricing"
              className="mt-3 flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-[#f8fafc] px-6 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
            >
              {t("trial.cta2")}
            </Link>

            <p className="mt-4 text-center text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5"><Lock size={11} /> Paiement sécurisé. Conforme RGPD.</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
