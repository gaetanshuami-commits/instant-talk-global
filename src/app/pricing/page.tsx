"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Navbar } from "@/components/ui/Navbar";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const plans = [
  {
    key: "premium",
    price: "24€",
    periodFr: "/mois",
    periodEn: "/month",
    href: "https://buy.stripe.com/3cIeVd1le4fL9EddLM1ZS00",
    success: "/success?plan=premium",
    featuresFr: [
      "Traduction vocale instantanée",
      "Sous-titres traduits",
      "Résumé automatique",
      "Réunions multilingues",
      "Expérience premium"
    ],
    featuresEn: [
      "Instant voice translation",
      "Translated subtitles",
      "Automatic summary",
      "Multilingual meetings",
      "Premium experience"
    ]
  },
  {
    key: "business",
    price: "99€",
    periodFr: "/mois",
    periodEn: "/month",
    href: "https://buy.stripe.com/3cI6oH1le4fL8A9bDE1ZS01",
    success: "/success?plan=business",
    featured: true,
    featuresFr: [
      "Réunions d’équipe multilingues",
      "Prise de notes IA",
      "Résumé avancé",
      "Support prioritaire",
      "Coordination internationale",
      "Organisation plus fluide"
    ],
    featuresEn: [
      "Multilingual team meetings",
      "AI notes",
      "Advanced summary",
      "Priority support",
      "International coordination",
      "Better organization"
    ]
  },
  {
    key: "enterprise",
    price: "Sur mesure",
    periodFr: "",
    periodEn: "",
    href: "/contact",
    success: "/contact",
    featuresFr: [
      "Déploiement personnalisé",
      "Accompagnement dédié",
      "Intégration sur mesure",
      "Architecture adaptée",
      "Usage à grande échelle"
    ],
    featuresEn: [
      "Custom deployment",
      "Dedicated support",
      "Custom integration",
      "Adapted architecture",
      "Large scale usage"
    ]
  }
];

const faqItemsFr = [
  {
    q: "Pourquoi Instant Talk est différent ?",
    a: "Parce que la plateforme est pensée autour de la compréhension multilingue en temps réel, avec voix naturelle, sous-titres synchronisés et structure IA autour de la réunion."
  },
  {
    q: "À qui s’adresse Instant Talk ?",
    a: "Aux particuliers internationaux, freelances, entreprises, équipes distribuées, institutions et organisations qui doivent travailler au-delà des langues."
  },
  {
    q: "Pourquoi proposer un essai gratuit ?",
    a: "Parce que la promesse produit se ressent très vite. Dès les premières minutes, la valeur de la traduction vocale instantanée devient évidente."
  },
  {
    q: "Que se passe-t-il après l’abonnement ?",
    a: "L’utilisateur active son accès, crée ses réunions, partage ses liens, organise ses rendez-vous et entre dans une expérience premium conçue pour la communication mondiale."
  }
];

const faqItemsEn = [
  {
    q: "Why is Instant Talk different?",
    a: "Because the platform is built around real-time multilingual understanding, with natural voice rendering, synchronized subtitles and AI structure around every meeting."
  },
  {
    q: "Who is Instant Talk for?",
    a: "For international individuals, freelancers, companies, distributed teams, institutions and organizations that need to work beyond languages."
  },
  {
    q: "Why offer a free trial?",
    a: "Because the product promise is felt very quickly. Within minutes, the value of instant voice translation becomes obvious."
  },
  {
    q: "What happens after subscription?",
    a: "The user activates access, creates meetings, shares links, schedules appointments and enters a premium experience built for global communication."
  }
];

export default function PricingPage() {
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSource(params.get("source"));
  }, []);

  const { t, lang } = useLanguage();

  const faqItems = lang === "fr" ? faqItemsFr : faqItemsEn;

  const [assistantInput, setAssistantInput] = useState(lang === "fr" ? "Quelle formule me convient si je fais des reunions internationales chaque semaine ?" : "Which plan fits me if I run international meetings every week?");
  const [assistantReply, setAssistantReply] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState("");

  async function askPricingAssistant() {
    try {
      const message = assistantInput.trim();

      if (!message) return;

      setAssistantLoading(true);
      setAssistantError("");

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: lang === "fr"
            ? `Tu es l assistant pricing premium de Instant Talk. Recommande la formule la plus adaptee entre Premium, Business et Enterprise. Reste concret, premium et court. Question client: ${message}`
            : `You are the premium pricing assistant for Instant Talk. Recommend the best plan between Premium, Business, and Enterprise. Stay concrete, premium, and concise. Customer question: ${message}`,
          activeLanguage: lang === "fr" ? "FR" : "EN"
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.details || data?.error || "Pricing assistant failed");
      }

      setAssistantReply(String(data?.reply || ""));
    } catch (error) {
      console.error("PRICING_ASSISTANT_ERROR", error);
      setAssistantError(error instanceof Error ? error.message : "Unknown pricing assistant error");
    } finally {
      setAssistantLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-24">
        {source === "room" ? (
          <div className="mx-auto mb-10 max-w-4xl rounded-[28px] border border-[#d9d6ff] bg-[#f7f6ff] p-6 text-center shadow-sm">
            <div className="text-sm font-bold uppercase tracking-[0.18em] text-[#635bff]">
              Accès requis
            </div>
            <p className="mt-3 text-base leading-8 text-[#425466]">
              Pour entrer dans une salle, un accès actif ou un essai est nécessaire.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/trial"
                className="inline-flex items-center justify-center rounded-full bg-[#0A2540] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#16324f]"
              >
                {t("pricing.finalCta1")}
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-[#0A2540] transition hover:bg-slate-50"
              >
                {t("pricing.finalCta2")}
              </Link>
            </div>
          </div>
        ) : null}

        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#635bff] shadow-sm">
            Conversion claire
          </div>
          <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-[#0A2540] md:text-6xl">
            {t("pricing.title")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl leading-8 text-[#425466]">
            {t("pricing.sub")}
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => {
            const name =
              plan.key === "premium" ? t("pricing.premium") :
              plan.key === "business" ? t("pricing.business") :
              t("pricing.enterprise");

            const desc =
              plan.key === "premium" ? t("pricing.premiumDesc") :
              plan.key === "business" ? t("pricing.businessDesc") :
              t("pricing.enterpriseDesc");

            const cta =
              plan.key === "premium" ? t("pricing.premiumCta") :
              plan.key === "business" ? t("pricing.businessCta") :
              t("pricing.enterpriseCta");

            const features = lang === "fr" ? plan.featuresFr : plan.featuresEn;
            const period = lang === "fr" ? plan.periodFr : plan.periodEn;

            async function askPricingAssistant() {
    try {
      const message = assistantInput.trim();

      if (!message) return;

      setAssistantLoading(true);
      setAssistantError("");

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: lang === "fr"
            ? `Tu es l assistant pricing premium de Instant Talk. Recommande la formule la plus adaptee entre Premium, Business et Enterprise. Reste concret, premium et court. Question client: ${message}`
            : `You are the premium pricing assistant for Instant Talk. Recommend the best plan between Premium, Business, and Enterprise. Stay concrete, premium, and concise. Customer question: ${message}`,
          activeLanguage: lang === "fr" ? "FR" : "EN"
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.details || data?.error || "Pricing assistant failed");
      }

      setAssistantReply(String(data?.reply || ""));
    } catch (error) {
      console.error("PRICING_ASSISTANT_ERROR", error);
      setAssistantError(error instanceof Error ? error.message : "Unknown pricing assistant error");
    } finally {
      setAssistantLoading(false);
    }
  }

  return (
              <div
                key={plan.key}
                className={`rounded-[32px] border bg-white p-8 shadow-[0_20px_60px_-30px_rgba(10,37,64,0.22)] ${
                  plan.featured ? "border-[#635BFF] ring-2 ring-[#635BFF]/10" : "border-slate-200"
                }`}
              >
                {plan.featured ? (
                  <div className="mb-5 inline-flex rounded-full bg-[#635BFF] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                    {t("pricing.recommended")}
                  </div>
                ) : null}

                <h2 className="text-2xl font-extrabold text-[#0A2540]">{name}</h2>
                <p className="mt-3 min-h-[56px] text-sm leading-7 text-[#425466]">{desc}</p>

                <div className="mt-8 flex items-end gap-2">
                  <span className="text-5xl font-extrabold tracking-tight text-[#0A2540]">{plan.price}</span>
                  <span className="pb-2 text-base font-medium text-[#425466]">{period}</span>
                </div>

                <div className="mt-3 text-sm font-semibold text-[#635bff]">
                  {t("pricing.trialText")}
                </div>

                <div className="mt-8 flex flex-col gap-3">
                  <Link
                    href={plan.href}
                    className={`inline-flex w-full items-center justify-center rounded-2xl px-5 py-4 text-center text-sm font-semibold transition ${
                      plan.featured
                        ? "bg-[#635BFF] text-white hover:bg-[#5247ff]"
                        : "bg-[#0A2540] text-white hover:bg-[#16324f]"
                    }`}
                  >
                    {cta}
                  </Link>

                  {plan.key !== "enterprise" ? (
                    <Link
                      href={plan.success}
                      className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-4 text-center text-sm font-semibold text-[#0A2540] transition hover:bg-slate-50"
                    >
                      {t("pricing.simulate")}
                    </Link>
                  ) : null}
                </div>

                <div className="mt-8 border-t border-slate-100 pt-8">
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                    {t("pricing.included")}
                  </div>
                  <ul className="mt-5 space-y-4">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm leading-7 text-[#425466]">
                        <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#eef2ff] text-[11px] font-bold text-[#635BFF]">
                          ✓
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        <section className="mt-20 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full border border-slate-200 bg-[#f6f9fc] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#635bff] shadow-sm">
                {lang === "fr" ? "Assistant IA pricing" : "AI pricing assistant"}
              </div>
              <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-[#0A2540] md:text-5xl">
                {lang === "fr" ? "Trouvez la bonne formule plus vite" : "Find the right plan faster"}
              </h2>
              <p className="mt-4 text-base leading-8 text-[#425466]">
                {lang === "fr"
                  ? "Posez votre question et l assistant vous oriente vers la formule la plus adaptee selon votre usage."
                  : "Ask your question and the assistant will guide you toward the best plan for your use case."}
              </p>
            </div>

            <button
              type="button"
              onClick={askPricingAssistant}
              disabled={assistantLoading || !assistantInput.trim()}
              className="inline-flex items-center justify-center rounded-full bg-[#0A2540] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#16324f] disabled:opacity-60"
            >
              {assistantLoading
                ? (lang === "fr" ? "Analyse..." : "Analyzing...")
                : (lang === "fr" ? "Demander a l assistant" : "Ask assistant")}
            </button>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[24px] border border-slate-200 bg-[#f8fafc] p-5">
              <label className="mb-3 block text-sm font-semibold text-[#0A2540]">
                {lang === "fr" ? "Votre besoin" : "Your need"}
              </label>
              <textarea
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                rows={5}
                className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#635bff]"
                placeholder={lang === "fr"
                  ? "Exemple : nous avons une equipe internationale de 18 personnes..."
                  : "Example: we are an international team of 18 people..."}
              />
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-[#eef2ff] p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#635bff]">
                {lang === "fr" ? "Recommandation IA" : "AI recommendation"}
              </div>

              <div className="mt-4 min-h-[160px] rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-7 text-[#0A2540]">
                {assistantError
                  ? assistantError
                  : assistantReply || (lang === "fr"
                    ? "La recommandation de formule apparaitra ici."
                    : "The plan recommendation will appear here.")}
              </div>
            </div>
          </div>
        </section>

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
              <Link
                href="/trial"
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-4 text-base font-semibold text-[#0A2540] transition hover:bg-slate-100"
              >
                {t("pricing.finalCta1")}
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-7 py-4 text-base font-semibold text-white transition hover:bg-white/15"
              >
                {t("pricing.finalCta2")}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}





