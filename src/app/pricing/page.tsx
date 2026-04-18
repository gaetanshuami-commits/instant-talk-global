"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";

const PLANS = [
  {
    key:      "premium",
    name:     "Premium",
    price:    24,
    featured: false,
    href:     "https://buy.stripe.com/4gMdR9d3W9A53fP2341ZS03",
    features: [
      "5 participants max",
      "10 langues",
      "Traduction vocale temps réel",
      "3 jours d'essai gratuit",
    ],
  },
  {
    key:      "business",
    name:     "Business",
    price:    99,
    featured: true,
    href:     "https://buy.stripe.com/bJebJ12pieUp7w58rs1ZS05",
    features: [
      "50 participants max",
      "20 langues",
      "Toutes les fonctions Premium",
      "IA avancée",
      "Support prioritaire",
      "3 jours d'essai gratuit",
    ],
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-24">
        <div className="mb-14 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-[#0a2540]">
            Tarifs simples &amp; transparents
          </h1>
          <p className="mt-4 text-lg text-slate-500">
            3 jours d&apos;essai gratuit — aucune carte débitée avant la fin de l&apos;essai.
          </p>
        </div>

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
                <span className="text-5xl font-extrabold text-[#0a2540]">{plan.price}€</span>
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

              <a
                href={plan.href}
                onClick={() => setLoading(plan.key)}
                className={`mt-8 flex w-full items-center justify-center rounded-2xl py-4 text-sm font-bold transition ${
                  plan.featured
                    ? "bg-violet-600 text-white hover:bg-violet-700"
                    : "bg-[#0a2540] text-white hover:bg-[#16324f]"
                }`}
              >
                {loading === plan.key ? "Redirection…" : "Commencer l'essai gratuit"}
              </a>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-slate-500">
            Besoin d&apos;une solution Enterprise ?{" "}
            <Link href="/contact" className="font-semibold text-violet-600 hover:underline">
              Contactez-nous
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
