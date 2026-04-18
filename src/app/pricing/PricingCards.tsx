"use client";

import { useState } from "react";

const PLANS = [
  {
    key: "premium",
    name: "Premium",
    price: 24,
    featured: false,
    features: [
      "5 participants max",
      "10 langues",
      "Traduction vocale temps rÃ©el",
      "3 jours d'essai gratuit",
    ],
  },
  {
    key: "business",
    name: "Business",
    price: 99,
    featured: true,
    features: [
      "50 participants max",
      "20 langues",
      "Toutes les fonctions Premium",
      "IA avancÃ©e",
      "Support prioritaire",
      "3 jours d'essai gratuit",
    ],
  },
];

export default function PricingCards() {
  const [loading, setLoading] = useState<string | null>(null);

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
        alert("Erreur Stripe : " + (data?.error || "Impossible de crÃ©er la session de paiement"));
        setLoading(null);
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      alert("Erreur rÃ©seau.");
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {PLANS.map((plan) => (
        <div
          key={plan.key}
          className={`flex flex-col rounded-3xl border p-8 ${
            plan.featured
              ? "border-violet-400 bg-white ring-2 ring-violet-200 shadow-lg"
              : "border-slate-200 bg-white shadow-sm"
          }`}
        >
          {plan.featured && (
            <div className="mb-4 inline-flex self-start rounded-full bg-violet-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              Populaire
            </div>
          )}

          <h2 className="text-2xl font-extrabold text-[#0a2540]">{plan.name}</h2>

          <div className="mt-4 flex items-end gap-1">
            <span className="text-5xl font-extrabold text-[#0a2540]">{plan.price}â‚¬</span>
            <span className="mb-1 text-slate-400">/mois</span>
          </div>

          <ul className="mt-6 flex-1 space-y-3">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-emerald-500">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
                {f}
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => handleCheckout(plan.key)}
            disabled={loading === plan.key}
            className={`mt-8 flex w-full items-center justify-center rounded-2xl py-4 text-sm font-bold transition disabled:opacity-70 ${
              plan.featured
                ? "bg-violet-600 text-white hover:bg-violet-700"
                : "bg-[#0a2540] text-white hover:bg-[#16324f]"
            }`}
          >
            {loading === plan.key ? "Redirection..." : "Commencer l'essai gratuit"}
          </button>
        </div>
      ))}
    </div>
  );
}
