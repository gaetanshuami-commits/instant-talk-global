"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  Check, Minus, ChevronDown, Globe, Shield, Clock, Zap, Users, Headphones,
} from "lucide-react";

type Props = { currentPlan?: string | null; currentStatus?: string | null };

/* ── helpers ─────────────────────────────────────────────────────────────── */
function Pill({ children, color = "violet" }: { children: React.ReactNode; color?: "violet" | "green" | "slate" }) {
  const cls =
    color === "green"  ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
    color === "slate"  ? "bg-slate-50  text-slate-500  border-slate-200"  :
                         "bg-violet-50 text-violet-700 border-violet-200";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${cls}`}>
      {children}
    </span>
  );
}

function FeatureRow({ text, included }: { text: string; included: boolean | string }) {
  if (typeof included === "string") {
    return (
      <li className="flex items-start gap-3 py-1">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">✓</span>
        <span className="text-sm text-[#425466]"><span className="font-semibold text-[#0A2540]">{included}</span> — {text}</span>
      </li>
    );
  }
  return (
    <li className="flex items-start gap-3 py-1">
      {included ? (
        <Check className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" strokeWidth={2.5} />
      ) : (
        <Minus className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" strokeWidth={2} />
      )}
      <span className={`text-sm ${included ? "text-[#425466]" : "text-slate-400"}`}>{text}</span>
    </li>
  );
}

/* ── FAQ accordion item ───────────────────────────────────────────────────── */
function FAQItem({ q, a, open, onClick }: { q: string; a: string; open: boolean; onClick: () => void }) {
  return (
    <div
      className={`rounded-2xl border bg-white transition-shadow ${open ? "border-violet-200 shadow-[0_8px_30px_-10px_rgba(99,91,255,0.18)]" : "border-slate-200 shadow-sm hover:border-slate-300"}`}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between gap-4 p-6 text-left"
      >
        <span className="text-[15px] font-bold text-[#0A2540]">{q}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-[#635BFF] transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-64 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <p className="px-6 pb-6 text-[15px] leading-8 text-[#425466]">{a}</p>
      </div>
    </div>
  );
}

/* ── CMP table cell ───────────────────────────────────────────────────────── */
function CmpCell({ val }: { val: boolean | string }) {
  if (typeof val === "string")
    return <span className="text-sm font-semibold text-[#0A2540]">{val}</span>;
  if (val) return <Check className="mx-auto h-5 w-5 text-violet-600" strokeWidth={2.5} />;
  return <Minus className="mx-auto h-4 w-4 text-slate-300" strokeWidth={2} />;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function PricingCards({ currentPlan = null, currentStatus = null }: Props) {
  const { t } = useLanguage();
  const [billing, setBilling]             = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading]             = useState<string | null>(null);
  const [openFaq, setOpenFaq]             = useState<number | null>(null);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantReply, setAssistantReply] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);

  async function handleCheckout(plan: string) {
    try {
      setLoading(plan);
      const res  = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
      const data = await res.json();
      if (!res.ok || !data?.url) { alert("Erreur Stripe : " + (data?.error || "Session invalide")); setLoading(null); return; }
      window.location.href = data.url;
    } catch { alert("Erreur réseau."); setLoading(null); }
  }

  async function askAssistant() {
    if (!assistantInput.trim()) return;
    setAssistantLoading(true);
    try {
      const res  = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: `Tu es le conseiller pricing expert d'Instant Talk. Recommande la formule la plus adaptée (Premium 24€/mois, Business 99€/mois ou Enterprise sur mesure) de façon concise et premium. Question : ${assistantInput.trim()}`, activeLanguage: "FR" }) });
      const data = await res.json();
      setAssistantReply(res.ok ? String(data?.reply || "") : "Erreur lors de l'analyse.");
    } catch { setAssistantReply("Erreur réseau."); }
    finally { setAssistantLoading(false); }
  }

  /* ── Data ─────────────────────────────────────────────────────────────── */
  const plans = [
    {
      key: "premium", name: "Premium", featured: false,
      desc: "Pour les particuliers et freelances internationaux",
      priceM: "24", priceA: "19", saveA: "60",
      cta: "Commencer l'essai gratuit",
      trialLabel: "3 jours d'essai · Sans carte bancaire",
      features: [
        "Traduction vocale instantanée",
        "Sous-titres traduits en temps réel",
        "26 langues nativement supportées",
        "Voix naturelle IA haute fidélité",
        "Réunions multilingues illimitées",
        "Résumé automatique post-réunion",
        "Expérience premium garantie",
      ],
      limit: "5 participants / salle",
      support: "Support standard",
    },
    {
      key: "business", name: "Business", featured: true,
      desc: "Pour les équipes et entreprises en croissance internationale",
      priceM: "99", priceA: "79", saveA: "240",
      cta: "Lancer l'essai Business",
      trialLabel: "3 jours d'essai · Sans carte bancaire",
      features: [
        "Tout ce qui est inclus en Premium",
        "Réunions d'équipe multilingues avancées",
        "Résumé automatique enrichi par l'IA",
        "Prise de notes IA structurée",
        "Coordination internationale fluide",
        "Support prioritaire dédié",
        "Tableau de bord équipe centralisé",
        "Jusqu'à 50 participants par salle",
        "Statistiques & rapports d'usage",
      ],
      limit: "50 participants / salle",
      support: "Support prioritaire 24h",
    },
    {
      key: "enterprise", name: "Enterprise", featured: false,
      desc: "Pour les institutions, organisations et déploiements à grande échelle",
      priceM: "Sur mesure", priceA: "Sur mesure", saveA: "",
      cta: "Contacter l'équipe commerciale",
      trialLabel: "Déploiement personnalisé · SLA garanti",
      features: [
        "Tout ce qui est inclus en Business",
        "Déploiement sur infrastructure dédiée",
        "Accompagnement onboarding dédié",
        "Intégration API & webhooks sur mesure",
        "SLA garanti 99,9% de disponibilité",
        "Support 24/7 avec gestionnaire dédié",
        "Participants illimités par salle",
        "Audit de sécurité & conformité RGPD",
        "Contrat cadre & facturation personnalisée",
      ],
      limit: "Illimité",
      support: "Gestionnaire dédié 24/7",
    },
  ];

  const cmpGroups = [
    {
      label: "Communication",
      rows: [
        { label: "Traduction vocale temps réel",   p: true,  b: true,  e: true },
        { label: "Sous-titres synchronisés",       p: true,  b: true,  e: true },
        { label: "26 langues supportées",          p: true,  b: true,  e: true },
        { label: "Voix naturelle IA",              p: true,  b: true,  e: true },
        { label: "Participants max / salle",       p: "5",   b: "50",  e: "∞"  },
      ],
    },
    {
      label: "Intelligence Artificielle",
      rows: [
        { label: "Résumé automatique",             p: true,  b: true,  e: true },
        { label: "Prise de notes IA structurée",   p: false, b: true,  e: true },
        { label: "Analyse sémantique avancée",     p: false, b: true,  e: true },
        { label: "Companion IA en réunion",        p: false, b: true,  e: true },
      ],
    },
    {
      label: "Équipe & Administration",
      rows: [
        { label: "Tableau de bord équipe",         p: false, b: true,  e: true },
        { label: "Rapports & statistiques",        p: false, b: true,  e: true },
        { label: "Gestion des membres",            p: false, b: true,  e: true },
        { label: "Support prioritaire",            p: false, b: true,  e: true },
      ],
    },
    {
      label: "Sécurité & Conformité",
      rows: [
        { label: "Chiffrement bout en bout",       p: true,  b: true,  e: true },
        { label: "API & intégrations sur mesure",  p: false, b: false, e: true },
        { label: "SLA garanti 99,9%",             p: false, b: false, e: true },
        { label: "Audit de sécurité dédié",        p: false, b: false, e: true },
        { label: "Conformité RGPD avancée",        p: false, b: false, e: true },
      ],
    },
  ];

  const faqItems = [
    { q: "Qu'est-ce qui différencie Instant Talk de Zoom ou Teams ?", a: "Contrairement à Zoom ou Teams, Instant Talk est conçu dès l'origine pour la traduction vocale instantanée. Chaque participant parle sa langue et entend les autres dans la sienne, avec une voix naturelle haute fidélité — pas du texte affiché." },
    { q: "Comment fonctionne l'essai gratuit ?", a: "L'essai de 3 jours est entièrement fonctionnel et sans carte bancaire. Vous accédez à toutes les fonctionnalités Premium pour évaluer la valeur produit en conditions réelles, sans aucun engagement." },
    { q: "Combien de participants peuvent rejoindre une salle ?", a: "Plan Premium : jusqu'à 5 participants. Business : jusqu'à 50. Enterprise : illimité. La capacité s'adapte précisément à votre usage réel et peut être modulée selon vos besoins." },
    { q: "La qualité de la traduction est-elle fiable en conditions réelles ?", a: "Oui. Instant Talk repose sur un moteur de traduction vocale de classe entreprise garantissant une précision élevée dans toutes les langues supportées, avec une latence inférieure à 400 ms en conditions normales." },
    { q: "Puis-je changer de plan ou résilier à tout moment ?", a: "Oui. Vous pouvez passer d'un plan à l'autre ou résilier à tout moment depuis votre espace. Les changements prennent effet immédiatement, sans pénalité ni frais cachés." },
    { q: "Existe-t-il une option pour les grandes institutions ?", a: "Oui. Le plan Enterprise est conçu pour les institutions, administrations et grandes entreprises qui ont besoin de déploiements sur mesure, d'une intégration API, d'un SLA garanti et d'un accompagnement dédié." },
  ];

  const isAnnual = billing === "annual";

  /* ── render ───────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-20">

      {/* ── Trust signals bar ── */}
      <div className="flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-slate-200 bg-white px-8 py-4 shadow-sm">
        {[
          { icon: Shield,     label: "Chiffrement E2E"         },
          { icon: Clock,      label: "Essai 3j sans carte"     },
          { icon: Globe,      label: "26 langues natives"       },
          { icon: Zap,        label: "< 400ms de latence"      },
          { icon: Users,      label: "10 000+ réunions"        },
          { icon: Headphones, label: "Support humain inclus"   },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-sm font-semibold text-[#425466]">
            <Icon className="h-4 w-4 text-[#635BFF]" />
            {label}
          </div>
        ))}
      </div>

      {/* ── Billing toggle ── */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          {(["monthly", "annual"] as const).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBilling(b)}
              className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200 ${
                billing === b ? "bg-[#0A2540] text-white shadow-md" : "text-slate-500 hover:text-[#0A2540]"
              }`}
            >
              {b === "monthly" ? "Mensuel" : "Annuel"}
              {b === "annual" && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide transition-colors ${billing === "annual" ? "bg-emerald-400 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                  −20%
                </span>
              )}
            </button>
          ))}
        </div>
        {isAnnual && (
          <p className="text-sm font-semibold text-emerald-600">
            Économisez jusqu'à <span className="text-emerald-700">240€/an</span> avec la facturation annuelle
          </p>
        )}
      </div>

      {/* ── Plan cards ── */}
      <div className="relative grid items-start gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent  = currentPlan === plan.key;
          const price      = isAnnual ? plan.priceA : plan.priceM;
          const isEnterprise = plan.key === "enterprise";
          const isNumeric  = !isNaN(Number(plan.priceM));

          return (
            <div key={plan.key} className="relative flex flex-col">

              {/* Floating badge above Business card */}
              {plan.featured && !isCurrent && (
                <div className="mb-3 flex justify-center">
                  <span className="rounded-full bg-[#635BFF] px-5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-violet-500/30">
                    ★ Le plus populaire
                  </span>
                </div>
              )}
              {isCurrent && (
                <div className="mb-3 flex justify-center">
                  <span className="rounded-full bg-emerald-500 px-5 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-emerald-500/30">
                    {currentStatus === "trialing" ? "✓ Essai actif" : "✓ Plan actuel"}
                  </span>
                </div>
              )}
              {!plan.featured && !isCurrent && (
                <div className="mb-3 h-9" /> /* spacer to align cards */
              )}

              <div
                className={`flex flex-1 flex-col rounded-[28px] border p-8 transition-all duration-300 ${
                  isCurrent
                    ? "border-emerald-300 bg-white shadow-[0_20px_60px_-15px_rgba(16,185,129,0.25)] ring-1 ring-emerald-200"
                    : plan.featured
                    ? "border-[#635BFF]/40 bg-white shadow-[0_24px_64px_-20px_rgba(99,91,255,0.35)] ring-1 ring-[#635BFF]/20"
                    : "border-slate-200 bg-white shadow-[0_8px_30px_-10px_rgba(10,37,64,0.12)] hover:shadow-[0_16px_48px_-12px_rgba(10,37,64,0.18)] hover:-translate-y-1"
                }`}
              >
                {/* Plan name + description */}
                <div>
                  <h2 className={`text-2xl font-extrabold ${isCurrent ? "text-emerald-700" : plan.featured ? "text-[#635BFF]" : "text-[#0A2540]"}`}>
                    {plan.name}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#425466]">{plan.desc}</p>
                </div>

                {/* Price */}
                <div className="mt-8">
                  <div className="flex items-end gap-1">
                    {isNumeric ? (
                      <>
                        <span className="text-xl font-bold text-[#425466]">€</span>
                        <span className="text-6xl font-extrabold leading-none tracking-tight text-[#0A2540]">
                          {price}
                        </span>
                        <span className="mb-1.5 text-base font-medium text-[#425466]">
                          {isAnnual ? "/mois" : "/mois"}
                        </span>
                      </>
                    ) : (
                      <span className="text-4xl font-extrabold leading-none tracking-tight text-[#0A2540]">
                        {price}
                      </span>
                    )}
                  </div>
                  {isAnnual && isNumeric && (
                    <p className="mt-1.5 text-sm text-slate-500">
                      Soit <span className="font-semibold text-[#0A2540]">{Number(price) * 12}€</span> facturés annuellement ·{" "}
                      <span className="font-semibold text-emerald-600">Économisez {plan.saveA}€</span>
                    </p>
                  )}
                  <p className="mt-2 text-xs font-semibold text-[#635BFF]">{plan.trialLabel}</p>
                </div>

                {/* CTA */}
                <div className="mt-8">
                  {isEnterprise ? (
                    <Link
                      href="/contact"
                      className="flex w-full items-center justify-center rounded-2xl border-2 border-[#0A2540] bg-[#0A2540] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#16324f]"
                    >
                      {plan.cta}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { if (!isCurrent) void handleCheckout(plan.key); }}
                      disabled={isCurrent || loading === plan.key}
                      className={`flex w-full items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-bold transition disabled:cursor-not-allowed ${
                        isCurrent
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : plan.featured
                          ? "bg-[#635BFF] text-white shadow-lg shadow-violet-500/30 hover:bg-[#5247ff] hover:shadow-violet-500/40"
                          : "border-2 border-[#0A2540] bg-[#0A2540] text-white hover:bg-[#16324f]"
                      }`}
                    >
                      {isCurrent
                        ? currentStatus === "trialing" ? "Essai actif ✓" : "Plan actuel ✓"
                        : loading === plan.key ? "Redirection Stripe..."
                        : plan.cta}
                    </button>
                  )}
                </div>

                {/* Guarantee line */}
                {!isEnterprise && !isCurrent && (
                  <p className="mt-3 text-center text-[11px] text-slate-400">
                    Sans engagement · Résiliable à tout moment
                  </p>
                )}

                {/* Divider + features */}
                <div className="mt-8 border-t border-slate-100 pt-8">
                  <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Inclus
                  </p>
                  <ul className="space-y-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 py-0.5">
                        <Check className={`mt-0.5 h-4 w-4 shrink-0 ${isCurrent ? "text-emerald-500" : plan.featured ? "text-[#635BFF]" : "text-[#0A2540]"}`} strokeWidth={2.5} />
                        <span className="text-sm leading-6 text-[#425466]">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer meta */}
                <div className="mt-8 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-[#0A2540]">Capacité :</span> {plan.limit}
                  </div>
                  <div className="text-xs text-slate-500">
                    {plan.support}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Comparison table ── */}
      <section>
        <div className="mb-8 text-center">
          <Pill>Comparaison détaillée</Pill>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0A2540]">
            Fonctionnalités complètes par plan
          </h2>
          <p className="mt-3 text-[#425466]">Comparez chaque fonctionnalité pour choisir la formule adaptée à votre usage.</p>
        </div>

        <div className="overflow-x-auto rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  Fonctionnalité
                </th>
                {["Premium", "Business", "Enterprise"].map((col, i) => (
                  <th key={col} className="px-6 py-4 text-center">
                    <span className={`text-sm font-extrabold ${i === 1 ? "text-[#635BFF]" : "text-[#0A2540]"}`}>{col}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cmpGroups.map((group) => (
                <>
                  <tr key={group.label} className="border-t border-slate-100 bg-slate-50/40">
                    <td colSpan={4} className="px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#635BFF]">
                      {group.label}
                    </td>
                  </tr>
                  {group.rows.map((row, ri) => (
                    <tr key={row.label} className={ri % 2 === 1 ? "bg-slate-50/30" : ""}>
                      <td className="px-6 py-3.5 text-sm text-[#425466]">{row.label}</td>
                      <td className="px-6 py-3.5 text-center"><CmpCell val={row.p} /></td>
                      <td className="px-6 py-3.5 text-center"><CmpCell val={row.b} /></td>
                      <td className="px-6 py-3.5 text-center"><CmpCell val={row.e} /></td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── AI Pricing Assistant ── */}
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-br from-violet-50 to-white px-8 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Pill><Zap className="h-3 w-3" /> Assistant IA</Pill>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#0A2540]">
                Trouvez votre plan en 30 secondes
              </h2>
              <p className="mt-1.5 text-sm text-[#425466]">
                Décrivez votre usage — l'IA recommande la formule la plus adaptée.
              </p>
            </div>
            <button
              type="button"
              onClick={askAssistant}
              disabled={assistantLoading || !assistantInput.trim()}
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#635BFF] px-7 py-3 text-sm font-bold text-white shadow-md shadow-violet-500/25 transition hover:bg-[#5247ff] disabled:opacity-50"
            >
              {assistantLoading ? "Analyse en cours…" : "Analyser mon besoin"}
            </button>
          </div>
        </div>
        <div className="grid gap-0 lg:grid-cols-2">
          <div className="border-b border-slate-100 p-6 lg:border-b-0 lg:border-r">
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
              Votre situation
            </label>
            <textarea
              value={assistantInput}
              onChange={(e) => setAssistantInput(e.target.value)}
              rows={6}
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
              placeholder="Ex : j'ai une équipe de 12 personnes répartie en France, Allemagne et Japon. Nous faisons 3 réunions internationales par semaine avec des clients anglophones…"
            />
          </div>
          <div className="p-6">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#635BFF]">Recommandation IA</span>
              {assistantLoading && (
                <span className="h-1.5 w-1.5 animate-ping rounded-full bg-violet-500" />
              )}
            </div>
            <div className="min-h-[152px] rounded-2xl border border-violet-100 bg-[#f7f6ff] p-4 text-sm leading-7 text-[#0A2540] whitespace-pre-wrap">
              {assistantReply || (
                <span className="text-slate-400">
                  La recommandation personnalisée apparaîtra ici après votre question.
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section>
        <div className="mb-10 text-center">
          <Pill>FAQ</Pill>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-[#0A2540]">
            Vos questions. Des réponses directes.
          </h2>
        </div>
        <div className="mx-auto max-w-3xl space-y-3">
          {faqItems.map((item, i) => (
            <FAQItem
              key={item.q}
              q={item.q}
              a={item.a}
              open={openFaq === i}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            />
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden rounded-[32px] bg-[#0A2540] px-8 py-16 text-center shadow-[0_40px_100px_-30px_rgba(10,37,64,0.5)] md:px-16">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-2xl">
          <Pill color="slate">
            <span className="text-slate-300">Prêt à commencer ?</span>
          </Pill>
          <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            La barrière linguistique<br />n'est plus une fatalité.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/60">
            Rejoignez les équipes qui transforment leurs échanges internationaux avec Instant Talk. 3 jours d'essai gratuit, sans engagement.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {currentPlan ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-base font-bold text-[#0A2540] shadow-xl transition hover:bg-slate-100"
              >
                Accéder au dashboard →
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => void handleCheckout("premium")}
                className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-base font-bold text-[#0A2540] shadow-xl transition hover:bg-slate-100"
              >
                Démarrer gratuitement →
              </button>
            )}
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/8 px-8 py-4 text-base font-bold text-white transition hover:bg-white/15"
            >
              Parler à l'équipe commerciale
            </Link>
          </div>

          <p className="mt-6 text-sm text-white/40">
            Aucune carte bancaire requise pour l'essai · Résiliable à tout moment · Support humain inclus
          </p>
        </div>
      </section>

    </div>
  );
}
