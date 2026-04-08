"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function TrialPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const startTrial = async () => {
    setLoading(true);
    setError(null);
    try {
      // Creates a real Stripe subscription with trial_period_days: 3.
      // After checkout, webhook sets status="trialing" in DB.
      // Access is validated server-side via /api/agora-token, not a cookie.
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

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-20">
        <div className="rounded-[32px] border border-slate-200 bg-white p-10 shadow-[0_25px_60px_-30px_rgba(10,37,64,0.22)]">
          <div className="inline-flex rounded-full bg-[#eef2ff] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#635bff]">
            Essai gratuit 3 jours
          </div>

          <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-[#0A2540]">
            {t("trial.title")}
          </h1>

          <p className="mt-5 text-lg leading-8 text-[#425466]">
            {t("trial.text")}
          </p>

          <ul className="mt-6 space-y-2 text-[#425466] text-sm">
            <li>✓ 3 jours gratuits — aucun débit immédiat</li>
            <li>✓ Accès complet au plan Premium pendant l&apos;essai</li>
            <li>✓ Abonnement activé automatiquement après 3 jours (annulable avant)</li>
            <li>✓ Validé par Stripe — expiration serveur garantie</li>
          </ul>

          {error && (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          )}

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <button
              onClick={startTrial}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-full bg-[#0A2540] px-7 py-4 text-base font-semibold text-white transition hover:bg-[#16324f] disabled:opacity-60"
            >
              {loading ? "Redirection Stripe…" : t("trial.cta1")}
            </button>

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
