"use client";

import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";

const demoSteps = [
  {
    title: "1. Chacun parle dans sa langue",
    text: "L’appel démarre naturellement. Chaque intervenant garde sa langue, son rythme et sa manière de s’exprimer."
  },
  {
    title: "2. La plateforme restitue la voix",
    text: "La traduction n’est pas seulement affichée. Elle est restituée avec une voix naturelle pour garder une conversation vivante."
  },
  {
    title: "3. Tout reste structuré",
    text: "Sous-titres synchronisés, résumé automatique, prise de notes IA et expérience claire pour tous les participants."
  }
];

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-20">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#635bff] shadow-sm">
            Démonstration produit
          </div>

          <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-[#0A2540] md:text-6xl">
            Découvrez une réunion réellement multilingue, fluide et naturelle.
          </h1>

          <p className="mt-6 text-lg leading-8 text-[#425466]">
            Instant Talk est conçu pour résoudre un problème mondial : la barrière linguistique dans les échanges humains, commerciaux et institutionnels. La plateforme ne se contente pas de traduire du texte. Elle transforme la conversation elle-même.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_25px_60px_-30px_rgba(10,37,64,0.22)]">
          <div className="relative aspect-video overflow-hidden rounded-[24px] bg-slate-950">
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1600&q=80"
              className="absolute inset-0 h-full w-full object-cover opacity-95"
            >
              <source src="https://cdn.coverr.co/videos/coverr-business-meeting-2544/1080p.mp4" type="video/mp4" />
            </video>

            <div className="absolute inset-0 bg-gradient-to-t from-[#0A2540]/80 via-[#0A2540]/15 to-transparent" />

            <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/15 bg-white/92 p-5 shadow-xl backdrop-blur">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#635bff]">
                Traduction vocale instantanée • voix naturelle
              </div>
              <div className="mt-3 text-sm font-semibold text-slate-500">
                Speaker • Français
              </div>
              <div className="mt-1 text-lg font-semibold text-[#0A2540]">
                Bonjour à tous, nous pouvons commencer la réunion internationale.
              </div>
              <div className="mt-1 text-sm font-semibold text-[#635bff]">
                Hello everyone, we can start the international meeting.
              </div>
              <div className="mt-1 text-sm font-semibold text-emerald-600">
                今日は国際会議を始めることができます。
              </div>
              <div className="mt-1 text-sm font-semibold text-fuchsia-600">
                يمكننا بدء الاجتماع الدولي الآن
              </div>
            </div>
          </div>
        </div>

        <section className="mt-16 grid gap-6 lg:grid-cols-3">
          {demoSteps.map((step) => (
            <div
              key={step.title}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-30px_rgba(10,37,64,0.20)]"
            >
              <h2 className="text-2xl font-bold tracking-tight text-[#0A2540]">{step.title}</h2>
              <p className="mt-4 text-[15px] leading-8 text-[#425466]">{step.text}</p>
            </div>
          ))}
        </section>

        <section className="mt-16 rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_-30px_rgba(10,37,64,0.20)]">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-[#0A2540]">
                Ce que la démo doit faire ressentir.
              </h2>
              <p className="mt-5 text-lg leading-8 text-[#425466]">
                Une réunion internationale ne devrait pas être ralentie par les langues. Instant Talk donne l’impression que tous les participants parlent enfin dans un même espace de compréhension, tout en conservant leur identité linguistique.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <MiniPoint title="Clarté immédiate" text="On comprend vite la promesse produit." />
              <MiniPoint title="Expérience premium" text="Le produit semble sérieux, structuré et crédible." />
              <MiniPoint title="Valeur concrète" text="Le bénéfice est visible dès les premières secondes." />
              <MiniPoint title="Portée mondiale" text="La plateforme s’adresse naturellement à l’international." />
            </div>
          </div>
        </section>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-full bg-[#0A2540] px-7 py-4 text-base font-semibold text-white transition hover:bg-[#16324f]"
          >
            Voir les offres
          </Link>

          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-4 text-base font-semibold text-[#0A2540] transition hover:bg-slate-50"
          >
            Contacter l’équipe
          </Link>
        </div>
      </main>
    </div>
  );
}

function MiniPoint({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
      <div className="text-base font-bold text-[#0A2540]">{title}</div>
      <p className="mt-2 text-sm leading-7 text-[#425466]">{text}</p>
    </div>
  );
}