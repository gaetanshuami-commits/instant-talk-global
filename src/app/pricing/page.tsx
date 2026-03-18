"use client";

import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";

const plans = [
  {
    name: "Premium",
    description: "Pour les particuliers et freelances internationaux",
    price: "24€",
    period: "/mois",
    cta: "Commencer l’essai gratuit",
    href: "https://buy.stripe.com/3cIeVd1le4fL9EddLM1ZS00",
    features: [
      "Traduction vocale instantanée",
      "Sous-titres traduits",
      "Résumé automatique",
      "Réunions multilingues",
      "Expérience premium",
    ],
  },
  {
    name: "Business",
    description: "Pour les équipes, sociétés et opérations internationales",
    price: "99€",
    period: "/mois",
    cta: "Lancer l’essai Business",
    href: "https://buy.stripe.com/3cI6oH1le4fL8A9bDE1ZS01",
    featured: true,
    features: [
      "Réunions d’équipe multilingues",
      "Prise de notes IA",
      "Résumé avancé",
      "Support prioritaire",
      "Coordination internationale",
      "Organisation plus fluide",
    ],
  },
  {
    name: "Enterprise",
    description: "Pour les institutions, organisations et déploiements sur mesure",
    price: "Sur mesure",
    period: "",
    cta: "Contacter l’équipe",
    href: "/contact",
    features: [
      "Déploiement personnalisé",
      "Accompagnement dédié",
      "Intégration sur mesure",
      "Architecture adaptée",
      "Usage à grande échelle",
    ],
  },
];

const faqItems = [
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

const objectionItems = [
  {
    title: "Ce n’est pas juste un appel vidéo",
    text: "Instant Talk apporte une couche stratégique de compréhension instantanée et naturelle entre langues."
  },
  {
    title: "Ce n’est pas seulement une traduction affichée",
    text: "La voix, les sous-titres, le rythme conversationnel et l’expérience globale sont pensés comme un tout."
  },
  {
    title: "Ce n’est pas un outil limité à une cible",
    text: "Le produit est crédible pour les indépendants, les équipes, les entreprises et les institutions."
  }
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#635bff] shadow-sm">
            Conversion claire
          </div>
          <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-[#0A2540] md:text-6xl">
            Choisissez une offre conçue pour communiquer au-delà des langues.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl leading-8 text-[#425466]">
            Instant Talk n’est pas seulement une interface de réunion. C’est une plateforme conçue pour transformer les échanges mondiaux avec une traduction vocale instantanée et naturelle.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-[32px] border bg-white p-8 shadow-[0_20px_60px_-30px_rgba(10,37,64,0.22)] ${
                plan.featured ? "border-[#635BFF] ring-2 ring-[#635BFF]/10" : "border-slate-200"
              }`}
            >
              {plan.featured ? (
                <div className="mb-5 inline-flex rounded-full bg-[#635BFF] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                  Recommandé
                </div>
              ) : null}

              <h2 className="text-2xl font-extrabold text-[#0A2540]">{plan.name}</h2>
              <p className="mt-3 min-h-[56px] text-sm leading-7 text-[#425466]">{plan.description}</p>

              <div className="mt-8 flex items-end gap-2">
                <span className="text-5xl font-extrabold tracking-tight text-[#0A2540]">{plan.price}</span>
                <span className="pb-2 text-base font-medium text-[#425466]">{plan.period}</span>
              </div>

              <div className="mt-3 text-sm font-semibold text-[#635bff]">
                3 jours d’essai gratuit pour démarrer rapidement
              </div>

              <Link
                href={plan.href}
                className={`mt-8 inline-flex w-full items-center justify-center rounded-2xl px-5 py-4 text-center text-sm font-semibold transition ${
                  plan.featured
                    ? "bg-[#635BFF] text-white hover:bg-[#5247ff]"
                    : "bg-[#0A2540] text-white hover:bg-[#16324f]"
                }`}
              >
                {plan.cta}
              </Link>

              <div className="mt-8 border-t border-slate-100 pt-8">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  Inclus
                </div>
                <ul className="mt-5 space-y-4">
                  {plan.features.map((feature) => (
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
          ))}
        </div>

        <section className="mt-20 rounded-[36px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_-30px_rgba(10,37,64,0.22)] md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-[#0A2540]">
                Une offre qui ne vend pas seulement des réunions.
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#425466]">
                Vous investissez dans une plateforme capable d’éliminer la barrière linguistique, de professionnaliser vos échanges internationaux et d’accélérer la compréhension entre personnes, équipes et organisations.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <BenefitCard title="Plus de clarté" text="Moins de malentendus, plus de compréhension instantanée." />
              <BenefitCard title="Plus de valeur" text="La réunion devient un outil de production, pas juste un appel vidéo." />
              <BenefitCard title="Plus de portée" text="Travaillez avec n’importe quelle langue, partout dans le monde." />
              <BenefitCard title="Plus d’impact" text="Une plateforme crédible pour particuliers, entreprises et institutions." />
            </div>
          </div>
        </section>

        <section className="mt-20">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#635bff] shadow-sm">
              Réponses claires
            </div>
            <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-[#0A2540] md:text-5xl">
              FAQ
            </h2>
            <p className="mt-6 text-lg leading-8 text-[#425466]">
              Les points essentiels pour comprendre la valeur produit, lever les objections et accélérer la décision.
            </p>
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

        <section className="mt-20">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#635bff] shadow-sm">
              Objections levées
            </div>
            <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-[#0A2540] md:text-5xl">
              Ce que le produit apporte réellement.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {objectionItems.map((item) => (
              <div
                key={item.title}
                className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-30px_rgba(10,37,64,0.18)]"
              >
                <h3 className="text-xl font-bold text-[#0A2540]">{item.title}</h3>
                <p className="mt-3 text-[15px] leading-8 text-[#425466]">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 rounded-[36px] border border-slate-200 bg-[#0A2540] p-8 shadow-[0_30px_90px_-40px_rgba(10,37,64,0.45)] md:p-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">
              Dernier pas
            </div>
            <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
              Donnez à vos échanges internationaux une vraie longueur d’avance.
            </h2>
            <p className="mt-6 text-lg leading-8 text-white/70">
              Si votre produit, votre équipe ou votre organisation travaille avec plusieurs langues, Instant Talk n’est pas un confort. C’est un avantage stratégique.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="https://buy.stripe.com/3cI6oH1le4fL8A9bDE1ZS01"
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-4 text-base font-semibold text-[#0A2540] transition hover:bg-slate-100"
              >
                Commencer maintenant
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-7 py-4 text-base font-semibold text-white transition hover:bg-white/15"
              >
                Parler à l’équipe
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function BenefitCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
      <div className="text-sm font-bold text-[#0A2540]">{title}</div>
      <p className="mt-2 text-sm leading-7 text-[#425466]">{text}</p>
    </div>
  );
}