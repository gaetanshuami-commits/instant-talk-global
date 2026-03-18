"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { HeroVideoPlayer } from "@/components/ui/HeroVideoPlayer";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const heroImages = [
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80"
];

export default function HomePage() {
  const { t } = useLanguage();
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
                {t("hero.badge")}
              </div>

              <h1 className="max-w-4xl text-5xl font-extrabold leading-[1.03] tracking-tight text-[#0a2540] md:text-7xl">
                {t("hero.title")}
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#425466] md:text-xl">
                {t("hero.subtitle")}
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <a
                  href="/room/demo"
                  className="inline-flex items-center justify-center rounded-full bg-[#0a2540] px-7 py-4 text-base font-semibold text-white shadow-[0_10px_30px_-10px_rgba(10,37,64,0.45)] transition hover:-translate-y-0.5 hover:bg-[#16324f]"
                >
                  {t("hero.cta")}
                </a>

                <a
                  href="#demo"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-4 text-base font-semibold text-[#0a2540] transition hover:border-slate-400 hover:bg-slate-50"
                >
                  {t("hero.demo")}
                </a>
              </div>

              <div className="mt-10 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-bold tracking-tight text-[#0a2540]">
                  {t("showcase.title")}
                </h2>
                <p className="mt-3 text-base leading-7 text-[#425466]">
                  {t("showcase.text")}
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

                  <div className="absolute left-4 right-4 top-4 grid grid-cols-2 gap-3">
                    <MiniParticipant
                      img="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=700&q=80"
                      label="Français"
                    />
                    <MiniParticipant
                      img="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=80"
                      label="English"
                    />
                    <MiniParticipant
                      img="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=700&q=80"
                      label="日本語"
                    />
                    <MiniParticipant
                      img="https://images.unsplash.com/photo-1546961329-78bef0414d7c?auto=format&fit=crop&w=700&q=80"
                      label="العربية"
                    />
                  </div>

                  <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/20 bg-white/92 p-5 shadow-xl backdrop-blur">
                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#635bff]">
                      Traduction en temps réel
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

          <div id="demo" className="mt-16">
            <HeroVideoPlayer />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-6 md:grid-cols-3">
          <ProofCard title={t("proof.p1Title")} text={t("proof.p1Text")} />
          <ProofCard title={t("proof.p2Title")} text={t("proof.p2Text")} />
          <ProofCard title={t("proof.p3Title")} text={t("proof.p3Text")} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="max-w-3xl">
          <h2 className="text-4xl font-extrabold tracking-tight text-[#0a2540] md:text-5xl">
            {t("features.title")}
          </h2>
          <p className="mt-6 text-lg leading-8 text-[#425466]">
            {t("features.description")}
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <FeatureCard title={t("features.f1Title")} text={t("features.f1Text")} />
          <FeatureCard title={t("features.f2Title")} text={t("features.f2Text")} />
          <FeatureCard title={t("features.f3Title")} text={t("features.f3Text")} />
          <FeatureCard title={t("features.f4Title")} text={t("features.f4Text")} />
          <FeatureCard title={t("features.f5Title")} text={t("features.f5Text")} />
          <FeatureCard title={t("features.f6Title")} text={t("features.f6Text")} />
        </div>
      </section>
    </div>
  );
}

function MiniParticipant({ img, label }: { img: string; label: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/20 backdrop-blur">
      <img src={img} alt={label} className="h-28 w-full object-cover" />
      <div className="px-3 py-2 text-xs font-semibold text-white/90">{label}</div>
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