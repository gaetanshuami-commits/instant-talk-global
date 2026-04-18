"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  InstantTalkAccess,
  normalizeAccess,
  setClientAccess,
  setCustomerRef,
} from "@/lib/access";
import { Play, Mail, Globe } from "lucide-react";

const planLabels: Record<string, string> = {
  premium:    "Premium",
  business:   "Business",
  enterprise: "Enterprise",
  trial:      "Essai gratuit",
};

const nextSteps: { Icon: React.FC; title: string; desc: string; href: string; cta: string }[] = [
  {
    Icon: () => <Play size={20} />,
    title: "Ouvrez votre première salle",
    desc: "Créez une salle et rejoignez-la depuis n'importe quel appareil.",
    href: "/room/demo-access",
    cta: "Ouvrir une salle",
  },
  {
    Icon: () => <Mail size={20} />,
    title: "Invitez vos collègues",
    desc: "Partagez un lien d'invitation. Aucune installation requise.",
    href: "/pricing",
    cta: "Voir les options",
  },
  {
    Icon: () => <Globe size={20} />,
    title: "Choisissez votre langue",
    desc: "Chaque participant sélectionne sa langue. La traduction démarre automatiquement.",
    href: "/demo",
    cta: "Voir la démo",
  },
];

export default function SuccessPage() {
  const [search, setSearch]               = useState("");
  const [verifiedPlan, setVerifiedPlan]   = useState<InstantTalkAccess>(null);
  const [verifying, setVerifying]         = useState(true);
  const [verificationError, setVerificationError] = useState("");
  const { t } = useLanguage();

  useEffect(() => { setSearch(window.location.search); }, []);

  const searchParams  = useMemo(() => new URLSearchParams(search), [search]);
  const fallbackPlan  = normalizeAccess(searchParams.get("plan")) || "premium";
  const sessionId     = searchParams.get("session_id");

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      try {
        if (!sessionId) {
          if (!cancelled) setVerifiedPlan(fallbackPlan);
          return;
        }
        const res  = await fetch(`/api/stripe/session?session_id=${encodeURIComponent(sessionId)}`, {
          method: "GET",
          cache:  "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.details || data?.error || "Session verification failed");
        if (!cancelled) {
          setVerifiedPlan(normalizeAccess(data?.plan) || fallbackPlan);
          const ref =
            typeof data?.customerId === "string" && data.customerId.trim()
              ? data.customerId
              : typeof data?.customerRef === "string" && data.customerRef.trim()
              ? data.customerRef
              : null;
          setCustomerRef(ref);
        }
      } catch (error) {
        if (!cancelled) {
          setVerificationError(error instanceof Error ? error.message : "Unknown error");
          setVerifiedPlan(fallbackPlan);
        }
      } finally {
        if (!cancelled) setVerifying(false);
      }
    }

    void verifySession();
    return () => { cancelled = true; };
  }, [sessionId, fallbackPlan]);

  useEffect(() => {
    if (!verifiedPlan) return;
    setClientAccess(verifiedPlan);
    // Redirect immédiat vers une salle (1s pour laisser le cookie se propager)
    const roomId = `room-${Math.random().toString(36).slice(2, 10)}`;
    const timer = setTimeout(() => {
      window.location.href = `/room/${roomId}?host=1`;
    }, 1000);
    return () => clearTimeout(timer);
  }, [verifiedPlan]);

  const planLabel = planLabels[verifiedPlan ?? fallbackPlan] ?? "Premium";

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 pb-24 pt-14">

        {/* ── Confirmation card ── */}
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_25px_60px_-30px_rgba(10,37,64,0.16)] md:p-10">

          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-8 w-8 text-emerald-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {t("success.title")}
            </div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[#0a2540]">
              Bienvenue sur Instant Talk
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-slate-500">
              {t("success.text")}
            </p>
          </div>

          {/* Plan status */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-[#f8fafc] p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Plan actif
                </div>
                <div className="mt-1 text-xl font-extrabold text-[#0a2540]">
                  {verifying ? (
                    <span className="inline-block h-4 w-24 animate-pulse rounded bg-slate-200" />
                  ) : planLabel}
                </div>
              </div>
              {!verifying && (
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Actif
                </div>
              )}
            </div>
            {verificationError && (
              <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {verificationError}
              </p>
            )}
          </div>

          {/* CTAs */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/room/demo-access"
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#0a2540] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#16324f]"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M3.25 4A2.25 2.25 0 0 0 1 6.25v7.5A2.25 2.25 0 0 0 3.25 16h7.5A2.25 2.25 0 0 0 13 13.75v-7.5A2.25 2.25 0 0 0 10.75 4h-7.5ZM19 4.75a.75.75 0 0 0-1.28-.53l-3 3a.75.75 0 0 0-.22.53v4.5c0 .199.079.39.22.53l3 3a.75.75 0 0 0 1.28-.53V4.75Z" />
              </svg>
              {t("success.cta1")}
            </Link>
            <Link
              href="/"
              className="flex flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-[#f8fafc] px-6 py-4 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              {t("success.cta2")}
            </Link>
          </div>
        </div>

        {/* ── Next steps ── */}
        <div className="mt-8">
          <div className="mb-5 text-center text-sm font-bold uppercase tracking-[0.2em] text-slate-400">
            Par où commencer
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {nextSteps.map((step, i) => (
              <div
                key={step.title}
                className="card-hover rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><step.Icon /></div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 mb-1">
                  Étape {i + 1}
                </div>
                <h3 className="text-sm font-bold text-[#0a2540]">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-6 text-slate-500">{step.desc}</p>
                <Link
                  href={step.href}
                  className="mt-4 inline-flex text-xs font-semibold text-[#635bff] hover:underline"
                >
                  {step.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
