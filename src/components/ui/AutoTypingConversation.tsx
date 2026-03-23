"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type Bubble = {
  role: "speaker" | "translation";
  text: string;
  color: string;
};

const sequences: Record<string, Bubble[]> = {
  fr: [
    { role: "speaker", text: "Bonjour, nous lançons le projet aujourd’hui.", color: "text-[#0A2540]" },
    { role: "translation", text: "Hello, we are launching the project today.", color: "text-[#635bff]" },
    { role: "translation", text: "今日はプロジェクトを開始します。", color: "text-emerald-600" },
    { role: "translation", text: "نطلق المشروع اليوم", color: "text-fuchsia-600" }
  ],
  en: [
    { role: "speaker", text: "Hello, we are launching the project today.", color: "text-[#0A2540]" },
    { role: "translation", text: "Bonjour, nous lançons le projet aujourd’hui.", color: "text-[#635bff]" },
    { role: "translation", text: "今日はプロジェクトを開始します。", color: "text-emerald-600" },
    { role: "translation", text: "نطلق المشروع اليوم", color: "text-fuchsia-600" }
  ],
  es: [
    { role: "speaker", text: "Hola, lanzamos el proyecto hoy.", color: "text-[#0A2540]" },
    { role: "translation", text: "Hello, we are launching the project today.", color: "text-[#635bff]" },
    { role: "translation", text: "Bonjour, nous lançons le projet aujourd’hui.", color: "text-emerald-600" },
    { role: "translation", text: "今日はプロジェクトを開始します。", color: "text-fuchsia-600" }
  ],
  de: [
    { role: "speaker", text: "Hallo, wir starten das Projekt heute.", color: "text-[#0A2540]" },
    { role: "translation", text: "Hello, we are launching the project today.", color: "text-[#635bff]" },
    { role: "translation", text: "Bonjour, nous lançons le projet aujourd’hui.", color: "text-emerald-600" },
    { role: "translation", text: "今日はプロジェクトを開始します。", color: "text-fuchsia-600" }
  ],
  it: [
    { role: "speaker", text: "Ciao, lanciamo il progetto oggi.", color: "text-[#0A2540]" },
    { role: "translation", text: "Hello, we are launching the project today.", color: "text-[#635bff]" },
    { role: "translation", text: "Bonjour, nous lançons le projet aujourd’hui.", color: "text-emerald-600" },
    { role: "translation", text: "今日はプロジェクトを開始します。", color: "text-fuchsia-600" }
  ],
  pt: [
    { role: "speaker", text: "Olá, lançamos o projeto hoje.", color: "text-[#0A2540]" },
    { role: "translation", text: "Hello, we are launching the project today.", color: "text-[#635bff]" },
    { role: "translation", text: "Bonjour, nous lançons le projet aujourd’hui.", color: "text-emerald-600" },
    { role: "translation", text: "今日はプロジェクトを開始します。", color: "text-fuchsia-600" }
  ],
  nl: [
    { role: "speaker", text: "Hallo, we lanceren vandaag het project.", color: "text-[#0A2540]" },
    { role: "translation", text: "Hello, we are launching the project today.", color: "text-[#635bff]" },
    { role: "translation", text: "Bonjour, nous lançons le projet aujourd’hui.", color: "text-emerald-600" },
    { role: "translation", text: "今日はプロジェクトを開始します。", color: "text-fuchsia-600" }
  ],
  zh: [
    { role: "speaker", text: "大家好，我们今天启动这个项目。", color: "text-[#0A2540]" },
    { role: "translation", text: "Hello, we are launching the project today.", color: "text-[#635bff]" },
    { role: "translation", text: "Bonjour, nous lançons le projet aujourd’hui.", color: "text-emerald-600" },
    { role: "translation", text: "今日はプロジェクトを開始します。", color: "text-fuchsia-600" }
  ],
  ja: [
    { role: "speaker", text: "こんにちは。本日このプロジェクトを開始します。", color: "text-[#0A2540]" },
    { role: "translation", text: "Hello, we are launching the project today.", color: "text-[#635bff]" },
    { role: "translation", text: "Bonjour, nous lançons le projet aujourd’hui.", color: "text-emerald-600" },
    { role: "translation", text: "نطلق المشروع اليوم", color: "text-fuchsia-600" }
  ],
  ar: [
    { role: "speaker", text: "مرحباً، نطلق المشروع اليوم.", color: "text-[#0A2540]" },
    { role: "translation", text: "Hello, we are launching the project today.", color: "text-[#635bff]" },
    { role: "translation", text: "Bonjour, nous lançons le projet aujourd’hui.", color: "text-emerald-600" },
    { role: "translation", text: "今日はプロジェクトを開始します。", color: "text-fuchsia-600" }
  ]
};

function useTypingSequence(items: Bubble[]) {
  const [bubbleIndex, setBubbleIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    setBubbleIndex(0);
    setCharIndex(0);
  }, [items]);

  useEffect(() => {
    const current = items[bubbleIndex];
    if (!current) return;

    if (charIndex < current.text.length) {
      const timer = setTimeout(() => setCharIndex((v) => v + 1), 28);
      return () => clearTimeout(timer);
    }

    const pause = setTimeout(() => {
      if (bubbleIndex < items.length - 1) {
        setBubbleIndex((v) => v + 1);
        setCharIndex(0);
      } else {
        setTimeout(() => {
          setBubbleIndex(0);
          setCharIndex(0);
        }, 900);
      }
    }, 850);

    return () => clearTimeout(pause);
  }, [bubbleIndex, charIndex, items]);

  return items.map((item, index) => {
    if (index < bubbleIndex) return item.text;
    if (index > bubbleIndex) return "";
    return item.text.slice(0, charIndex);
  });
}

export function AutoTypingConversation() {
  const { lang } = useLanguage();
  const items = useMemo(() => sequences[lang] || sequences.fr, [lang]);
  const typed = useTypingSequence(items);

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_40px_90px_-30px_rgba(10,37,64,0.22)]">
      <div className="relative h-[520px] overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,91,255,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_26%)]" />

        <div className="absolute left-5 right-5 top-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#635bff]">
              Traduction vocale instantanée • voix naturelle
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-500">
              Simulation conversation multilingue
            </div>
          </div>

          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
            Live
          </div>
        </div>

        <div className="absolute inset-x-5 bottom-5 top-28 space-y-4">
          {items.map((item, index) => {
            const isSpeaker = item.role === "speaker";
            const visible = typed[index];

            return (
              <div
                key={index}
                className={
                  isSpeaker
                    ? "mr-12 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    : "ml-12 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm"
                }
              >
                <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  {isSpeaker ? "Speaker" : "Translation"}
                </div>
                <div className={`text-[15px] font-semibold leading-8 ${item.color}`}>
                  {visible}
                  {index === typed.findIndex((x) => x.length < (items[typed.findIndex((y) => y.length < items[typed.findIndex((z)=>true)]?.text.length)]?.text.length || 0)) ? (
                    <span className="ml-0.5 inline-block h-5 w-[2px] animate-pulse bg-current align-middle opacity-70" />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}