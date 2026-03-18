"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { HeroVideoPlayer } from "@/components/ui/HeroVideoPlayer";
import { TestimonialMarquee } from "@/components/ui/TestimonialMarquee";

const heroImages = [
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80"
];

const calendarDays = [
  { day: "Mon", date: "08", time: "09:00" },
  { day: "Tue", date: "09", time: "11:30" },
  { day: "Wed", date: "10", time: "14:00" },
  { day: "Thu", date: "11", time: "16:00" },
  { day: "Fri", date: "12", time: "10:00" },
];

const comparisonItems = [
  {
    title: "Voix naturelle en temps réel",
    text: "Instant Talk traduit la parole instantanément avec une restitution vocale naturelle, là où beaucoup de solutions restent limitées à une expérience plus fragmentée."
  },
  {
    title: "Une seule plateforme",
    text: "Réunions, rendez-vous, invitations, notes IA, résumés, sous-titres, collaboration et communication mondiale sont réunis dans une seule interface premium."
  },
  {
    title: "Pensé pour le monde entier",
    text: "La plateforme est conçue pour des équipes internationales, des indépendants, des entreprises et des institutions qui doivent travailler au-delà des langues."
  }
];

export default function HomePage() {
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % heroImages.length);
    }, 2600);

    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f9fc] text-slate-900">
      <Navbar />

      <section className="relative overflow-hidden border-b border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f6f9fc_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,91,255,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(0,194,255,0.12),transparent_25%)]" />

        <div className="mx-auto max-w-7xl px-6 pb-20 pt-14 lg:pt-20">
          <div className="mb-10 overflow-hidden">
            <div className="flex min-w-max animate-[marquee_26s_linear_infinite] gap-4">
              {heroImages.concat(heroImages).map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt="Instant Talk visual"
                  className="h-28 w-44 rounded-2xl border border-slate-200 object-cover shadow-sm"
                />
              ))}
            </div>
          </div>

          <div className="grid gap-14 lg:grid-cols-[1.02fr_.98fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#635bff] shadow-sm">
                Visioconférence native multilingue
              </div>

              <h1 className="max-w-4xl text-5xl font-extrabold leading-[1.03] tracking-tight text-[#0a2540] md:text-7xl">
                Parlez votre langue. Le monde vous comprend instantanément.
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#425466] md:text-xl">
                Instant Talk est une plateforme de communication vidéo conçue dès l’origine pour la traduction vocale temps réel. Chaque personne parle naturellement dans sa langue, pendant que l’IA restitue la conversation avec une voix naturelle, des sous-titres synchronisés et une compréhension immédiate.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <a
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-full bg-[#0a2540] px-7 py-4 text-base font-semibold text-white shadow-[0_10px_30px_-10px_rgba(10,37,64,0.45)] transition hover:-translate-y-0.5 hover:bg-[#16324f]"
                >
                  Voir les offres
                </a>

                <a
                  href="/demo"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-4 text-base font-semibold text-[#0a2540] transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Voir la démo
                </a>
              </div>

              <div className="mt-10 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-bold tracking-tight text-[#0a2540]">
                  Une plateforme pensée pour la communication mondiale
                </h2>
                <p className="mt-3 text-base leading-7 text-[#425466]">
                  Réunions, rendez-vous, collaboration internationale, traduction vocale instantanée, résumé automatique et expérience premium réunis dans un seul produit.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_40px_90px_-30px_rgba(10,37,64,0.22)]">
                <div className="relative h-[520px] overflow-hidden rounded-[26px]">
                  {heroImages.map((img, idx) => (
                    <img
                      key={img}
                      src={img}
                      alt="meeting"
                      className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ${
                        idx === activeImage ? "scale-100 opacity-100" : "scale-105 opacity-0"
                      }`}
                    />
                  ))}

                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a2540]/75 via-[#0a2540]/10 to-transparent" />

                  <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/20 bg-white/92 p-5 shadow-xl backdrop-blur">
                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#635bff]">
                      Traduction vocale instantanée • voix naturelle
                    </div>
                    <div className="mt-3 text-sm font-semibold text-slate-500">
                      Speaker • Français
                    </div>
                    <div className="mt-1 text-lg font-semibold text-[#0a2540]">
                      Bonjour, nous lançons le projet aujourd’hui.
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[#635bff]">
                      Hello, we are launching the project today.
                    </div>
                    <div className="mt-1 text-sm font-semibold text-emerald-600">
                      今日はプロジェクトを開始します。
                    </div>
                    <div className="mt-1 text-sm font-semibold text-fuchsia-600">
                      نطلق المشروع اليوم
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16">
            <HeroVideoPlayer />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-6 md:grid-cols-3">
          <ProofCard
            title="Voix naturelle en temps réel"
            text="La conversation est restituée avec une voix fluide pour garder un échange vivant, humain et naturel."
          />
          <ProofCard
            title="Sous-titres synchronisés"
            text="Chaque participant suit la réunion avec des sous-titres traduits, lisibles et synchronisés en direct."
          />
          <ProofCard
            title="Faible latence"
            text="La communication reste rapide, claire et naturelle sans casser le rythme humain de la conversation."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="max-w-3xl">
          <h2 className="text-4xl font-extrabold tracking-tight text-[#0a2540] md:text-5xl">
            Tout ce qu’une plateforme moderne doit faire. En mieux.
          </h2>
          <p className="mt-6 text-lg leading-8 text-[#425466]">
            Instant Talk réunit la visioconférence, la traduction vocale bidirectionnelle, les sous-titres, les notes IA, les résumés automatiques et la planification dans une seule plateforme.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <FeatureCard title="Traduction vocale instantanée" text="Chaque participant parle dans sa langue, la plateforme traduit en direct pour tous les autres." />
          <FeatureCard title="Sous-titres traduits" text="Des sous-titres lisibles, fluides et synchronisés pour une compréhension immédiate." />
          <FeatureCard title="Résumé automatique" text="Chaque réunion se termine avec un résumé clair, structuré et exploitable." />
          <FeatureCard title="Prise de notes IA" text="Décisions, points clés et actions sont détectés automatiquement." />
          <FeatureCard title="Planification des réunions" text="Créez, organisez et partagez vos rendez-vous et réunions depuis une seule interface." />
          <FeatureCard title="Expérience premium" text="Une plateforme pensée pour les particuliers, les équipes, les entreprises et les institutions." />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#635bff] shadow-sm">
              Réservation intelligente
            </div>
            <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-[#0a2540] md:text-5xl">
              Planifiez vos rendez-vous internationaux sans friction.
            </h2>
            <p className="mt-6 text-lg leading-8 text-[#425466]">
              Instant Talk ne se limite pas à la réunion. La plateforme permet aussi de proposer des créneaux, d’organiser des rendez-vous, de préparer les échanges multilingues et de fluidifier la coordination entre équipes, clients et partenaires.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <SmallInfoCard
                title="Disponibilités claires"
                text="Montrez vos créneaux, vos réunions à venir et vos temps forts dans une interface simple."
              />
              <SmallInfoCard
                title="Rendez-vous mondiaux"
                text="Facilitez les échanges avec des personnes qui ne parlent pas votre langue."
              />
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_25px_60px_-30px_rgba(10,37,64,0.22)]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div>
                <p className="text-sm font-semibold text-[#635bff]">Calendrier de rendez-vous</p>
                <h3 className="mt-1 text-2xl font-bold text-[#0a2540]">Semaine internationale</h3>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                UTC sync
              </div>
            </div>

            <div className="mt-6 grid grid-cols-5 gap-3">
              {calendarDays.map((item) => (
                <div key={item.day} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.day}</div>
                  <div className="mt-2 text-2xl font-extrabold text-[#0a2540]">{item.date}</div>
                  <div className="mt-3 rounded-full bg-[#0a2540] px-2 py-1 text-xs font-semibold text-white">
                    {item.time}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-[#d9d6ff] bg-[#f7f6ff] p-5">
              <div className="text-sm font-bold text-[#635bff]">Réunion à venir</div>
              <div className="mt-2 text-lg font-bold text-[#0a2540]">Paris • Tokyo • Doha • New York</div>
              <div className="mt-2 text-sm leading-7 text-[#425466]">
                Les participants reçoivent un lien unique, un horaire clair et une expérience multilingue prête dès l’ouverture de la réunion.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-10 lg:grid-cols-[1.02fr_.98fr] lg:items-center">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_25px_60px_-30px_rgba(10,37,64,0.22)]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div>
                <p className="text-sm font-semibold text-[#635bff]">Lien d’invitation</p>
                <h3 className="mt-1 text-2xl font-bold text-[#0a2540]">Partage simple, accès immédiat</h3>
              </div>
              <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Live
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Lien sécurisé</div>
              <div className="mt-3 break-all rounded-xl bg-white px-4 py-4 font-mono text-sm text-[#0a2540] shadow-sm">
                https://instant-talk.app/room/international-board-room
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <ActionPill label="Copier le lien" />
              <ActionPill label="Envoyer l’invitation" />
              <ActionPill label="Ajouter au calendrier" />
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 p-5">
              <div className="text-sm font-bold text-[#0a2540]">Ce que voit l’invité</div>
              <p className="mt-2 text-sm leading-7 text-[#425466]">
                Un accès clair, une entrée simple dans la réunion, une promesse de communication sans barrière linguistique et une expérience premium dès le premier clic.
              </p>
            </div>
          </div>

          <div>
            <div className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#635bff] shadow-sm">
              Invitation intelligente
            </div>
            <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-[#0a2540] md:text-5xl">
              Un lien d’invitation qui ne se contente pas d’ouvrir une room.
            </h2>
            <p className="mt-6 text-lg leading-8 text-[#425466]">
              Instant Talk prépare la rencontre avant même qu’elle commence. Le lien d’invitation devient une porte d’entrée vers une réunion claire, professionnelle, multilingue et prête pour des échanges internationaux de haut niveau.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <SmallInfoCard title="Partage rapide" text="Envoyez un lien unique à vos clients, équipes, partenaires ou institutions." />
              <SmallInfoCard title="Expérience crédible" text="L’invitation reflète immédiatement un produit premium, mondial et structuré." />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-[36px] border border-slate-200 bg-[#0a2540] p-8 shadow-[0_35px_90px_-35px_rgba(10,37,64,0.38)] md:p-10">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">
              Pourquoi Instant Talk va plus loin
            </div>
            <h2 className="mt-6 text-4xl font-extrabold tracking-tight text-white md:text-5xl">
              Plus qu’une réunion vidéo. Une vraie infrastructure de communication mondiale.
            </h2>
            <p className="mt-6 text-lg leading-8 text-white/70">
              Instant Talk est conçu autour d’un problème plus grand : permettre à n’importe qui dans le monde de se comprendre instantanément, naturellement et professionnellement.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {comparisonItems.map((item) => (
              <div key={item.title} className="rounded-[24px] border border-white/10 bg-white/5 p-6">
                <h3 className="text-xl font-bold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/70">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-[24px] border border-white/10 bg-white/5 p-6">
            <div className="grid gap-6 md:grid-cols-4">
              <MetricDark label="Traduction vocale" value="Instantanée" />
              <MetricDark label="Voix" value="Naturelle" />
              <MetricDark label="Sous-titres" value="Synchronisés" />
              <MetricDark label="Produit" value="Tout-en-un" />
            </div>
          </div>
        </div>
      </section>

      <TestimonialMarquee />
    </div>
  );
}

function ProofCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-7 shadow-sm">
      <h3 className="text-xl font-bold text-[#0a2540]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[#425466]">{text}</p>
    </div>
  );
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <h3 className="text-xl font-bold text-[#0a2540]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[#425466]">{text}</p>
    </div>
  );
}

function SmallInfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-bold text-[#0a2540]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#425466]">{text}</p>
    </div>
  );
}

function ActionPill({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#0a2540] shadow-sm">
      {label}
    </div>
  );
}

function MetricDark({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/5 p-5">
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">{label}</div>
      <div className="mt-3 text-2xl font-extrabold text-white">{value}</div>
    </div>
  );
}