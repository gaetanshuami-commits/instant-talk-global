"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { TestimonialMarquee } from "@/components/ui/TestimonialMarquee";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { HeroVideoPlayer } from "@/components/ui/HeroVideoPlayer";

/* ── Photo data ─────────────────────────────────────────────────────────────── */
const heroPhotos = [
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=80",
];

const useCasePhotos = [
  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1434626881859-194d67b2b86f?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80",
];

/* ── Live translation demo strings ─────────────────────────────────────────── */
const demoLines = [
  { speaker: "Marie (FR)", text: "Bonjour, nous lançons le projet aujourd'hui.", translated: "Hello, we are launching the project today.", code: "FR", tcode: "EN" },
  { speaker: "Kenji (JP)", text: "プロジェクトを本日開始します。", translated: "We are starting the project today.", code: "JP", tcode: "EN" },
  { speaker: "Ahmed (AR)", text: "نطلق المشروع اليوم.", translated: "Nous lançons le projet aujourd'hui.", code: "AR", tcode: "FR" },
  { speaker: "Sofia (ES)", text: "Estamos lanzando el proyecto hoy.", translated: "We are launching the project today.", code: "ES", tcode: "EN" },
];

/* ── Feature icons ──────────────────────────────────────────────────────────── */
function IconVoice() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
      <path strokeLinecap="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
    </svg>
  );
}
function IconSubtitles() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75h16.5M3.75 8.25h16.5M3.75 12.75H12m-8.25 4.5h8.25m4.5 0h3.75m-7.5 0h-3.75" />
    </svg>
  );
}
function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );
}
function IconSummary() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

const featureIcons = [IconVoice, IconSubtitles, IconGlobe, IconSummary, IconCalendar, IconShield];
const featureColors = [
  "bg-violet-50 text-violet-600",
  "bg-sky-50 text-sky-600",
  "bg-emerald-50 text-emerald-600",
  "bg-amber-50 text-amber-600",
  "bg-rose-50 text-rose-600",
  "bg-indigo-50 text-indigo-600",
];

/* ── 26-language polyglot demo data ─────────────────────────────────────────── */
const polyglotLanguages = [
  { code: "FR", name: "Français",    flag: "🇫🇷", phrase: "Bonjour, bienvenue dans notre réunion internationale." },
  { code: "EN", name: "English",     flag: "🇬🇧", phrase: "Hello, welcome to our international meeting today." },
  { code: "ES", name: "Español",     flag: "🇪🇸", phrase: "Hola, bienvenidos a nuestra reunión internacional." },
  { code: "DE", name: "Deutsch",     flag: "🇩🇪", phrase: "Guten Tag, willkommen zu unserem internationalen Meeting." },
  { code: "IT", name: "Italiano",    flag: "🇮🇹", phrase: "Buongiorno, benvenuti alla nostra riunione internazionale." },
  { code: "PT", name: "Português",   flag: "🇧🇷", phrase: "Bom dia, bem-vindos à nossa reunião internacional." },
  { code: "NL", name: "Nederlands",  flag: "🇳🇱", phrase: "Goedemorgen, welkom bij onze internationale vergadering." },
  { code: "ZH", name: "中文",        flag: "🇨🇳", phrase: "你好，欢迎参加我们今天的国际会议。" },
  { code: "JP", name: "日本語",      flag: "🇯🇵", phrase: "おはようございます。国際会議へようこそ。" },
  { code: "AR", name: "العربية",     flag: "🇸🇦", phrase: "مرحباً، أهلاً بكم في اجتماعنا الدولي اليوم." },
  { code: "KO", name: "한국어",      flag: "🇰🇷", phrase: "안녕하세요, 오늘 국제 회의에 오신 것을 환영합니다." },
  { code: "HI", name: "हिन्दी",     flag: "🇮🇳", phrase: "नमस्ते, हमारी अंतर्राष्ट्रीय बैठक में आपका स्वागत है।" },
  { code: "TR", name: "Türkçe",      flag: "🇹🇷", phrase: "Merhaba, uluslararası toplantımıza hoş geldiniz." },
  { code: "RU", name: "Русский",     flag: "🇷🇺", phrase: "Добрый день, добро пожаловать на международную встречу." },
  { code: "PL", name: "Polski",      flag: "🇵🇱", phrase: "Dzień dobry, witamy na naszym międzynarodowym spotkaniu." },
  { code: "SV", name: "Svenska",     flag: "🇸🇪", phrase: "God morgon, välkommen till vårt internationella möte." },
  { code: "EL", name: "Ελληνικά",   flag: "🇬🇷", phrase: "Καλημέρα, καλώς ήρθατε στη διεθνή μας συνάντηση." },
  { code: "CS", name: "Čeština",     flag: "🇨🇿", phrase: "Dobré ráno, vítejte na našem mezinárodním setkání." },
  { code: "RO", name: "Română",      flag: "🇷🇴", phrase: "Bună dimineața, bine ați venit la ședința noastră internațională." },
  { code: "HU", name: "Magyar",      flag: "🇭🇺", phrase: "Jó reggelt, üdvözlöm önöket a nemzetközi megbeszélésünkön." },
  { code: "SW", name: "Kiswahili",   flag: "🇰🇪", phrase: "Habari ya asubuhi, karibu katika mkutano wetu wa kimataifa." },
  { code: "TH", name: "ภาษาไทย",    flag: "🇹🇭", phrase: "สวัสดีตอนเช้า ยินดีต้อนรับสู่การประชุมนานาชาติของเรา" },
  { code: "VI", name: "Tiếng Việt",  flag: "🇻🇳", phrase: "Chào buổi sáng, chào mừng đến với cuộc họp quốc tế của chúng ta." },
  { code: "DA", name: "Dansk",       flag: "🇩🇰", phrase: "God morgen, velkommen til vores internationale møde." },
  { code: "FI", name: "Suomi",       flag: "🇫🇮", phrase: "Hyvää huomenta, tervetuloa kansainväliseen kokoukseemme." },
  { code: "NO", name: "Norsk",       flag: "🇳🇴", phrase: "God morgen, velkommen til vårt internasjonale møte." },
];

const waveHeights = [4, 8, 14, 10, 6, 12, 16, 8, 5, 11, 15, 9, 7, 13, 6, 10, 14, 8, 5, 12];

/* ── Polyglot cinematic demo section ─────────────────────────────────────────── */
function PolyglotDemoSection() {
  const { t } = useLanguage();
  const [activeLang, setActiveLang] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setActiveLang((p) => (p + 1) % polyglotLanguages.length);
        setVisible(true);
      }, 500);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  const lang = polyglotLanguages[activeLang];

  function selectLang(i: number) {
    setVisible(false);
    setTimeout(() => { setActiveLang(i); setVisible(true); }, 300);
  }

  return (
    <section className="relative overflow-hidden border-y border-slate-200 py-24">
      {/* Dark cinematic background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,#0a2540_0%,#1a1060_50%,#0d2b4e_100%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="pointer-events-none absolute left-1/4 top-0 h-80 w-80 rounded-full bg-violet-600/25 blur-[120px]" />
      <div className="pointer-events-none absolute right-1/4 bottom-0 h-60 w-60 rounded-full bg-sky-500/20 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-violet-300">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            {t("polyglot.badge")}
          </div>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            {t("polyglot.title")}{" "}
            <span className="bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
              {t("polyglot.titleAccent")}
            </span>{" "}
            {t("polyglot.titleEnd")}
          </h2>
          <p className="mt-4 text-base leading-7 text-white/60">
            {t("polyglot.sub")}
          </p>
        </div>

        {/* Demo grid */}
        <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
          {/* Left — cinematic video call UI */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] backdrop-blur-md">
              {/* Title bar */}
              <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-5 py-3.5">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-rose-400/70" />
                  <div className="h-3 w-3 rounded-full bg-amber-400/70" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400/70" />
                </div>
                <span className="mx-auto text-[11px] font-semibold text-white/40">
                  Instant Talk Global — International Summit
                </span>
                <div className="flex items-center gap-1.5 rounded-full bg-violet-500/20 px-2.5 py-1 text-[10px] font-bold text-violet-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                  AI Active
                </div>
              </div>

              {/* Video area */}
              <div className="relative min-h-[340px] bg-gradient-to-br from-slate-900 to-slate-800 p-8">
                {/* Subtitle bar (top) */}
                <div className="absolute left-4 right-4 top-4">
                  <div
                    className="rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-center text-sm text-white backdrop-blur-sm transition-opacity duration-500"
                    style={{ opacity: visible ? 1 : 0.2 }}
                  >
                    <span className="mr-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
                      {t("polyglot.subtitles")}
                    </span>
                    {lang.phrase}
                  </div>
                </div>

                {/* Speaker */}
                <div className="flex h-full flex-col items-center justify-center gap-6 pt-10">
                  {/* Avatar with speaking ring */}
                  <div className="relative">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-500 to-sky-500 p-[2px] shadow-[0_0_30px_rgba(99,91,255,0.5)]">
                      <img
                        src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80"
                        alt="Speaker"
                        className="h-full w-full rounded-full object-cover"
                      />
                    </div>
                    <div
                      className="absolute -inset-2 rounded-full border-2 border-violet-400/50 animate-ping"
                      style={{ animationDuration: "1.4s" }}
                    />
                  </div>

                  {/* Language + phrase */}
                  <div
                    className="text-center transition-all duration-500"
                    style={{
                      opacity: visible ? 1 : 0,
                      transform: visible ? "translateY(0) scale(1)" : "translateY(10px) scale(0.97)",
                    }}
                  >
                    <div className="mb-3 flex items-center justify-center gap-2">
                      <span className="text-3xl">{lang.flag}</span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white/60">
                        {lang.code}
                      </span>
                      <span className="text-sm font-semibold text-white/40">{lang.name}</span>
                    </div>
                    <p className="max-w-md text-center text-[17px] font-semibold leading-7 text-white">
                      {lang.phrase}
                    </p>
                  </div>

                  {/* Animated waveform — pure CSS, no JS re-renders */}
                  <style>{`
                    @keyframes wave-bar {
                      0%, 100% { transform: scaleY(0.25); }
                      50%       { transform: scaleY(1); }
                    }
                  `}</style>
                  <div className="flex items-end gap-[3px]" style={{ height: 48 }}>
                    {waveHeights.map((h, i) => (
                      <div
                        key={i}
                        className="w-1.5 rounded-full bg-gradient-to-t from-violet-500 to-sky-400"
                        style={{
                          height: `${visible ? Math.max(4, h) : 3}px`,
                          transformOrigin: "bottom",
                          animation: visible
                            ? `wave-bar ${0.7 + (i % 6) * 0.11}s ease-in-out infinite`
                            : "none",
                          animationDelay: `${i * 0.055}s`,
                          transition: "height 0.4s ease",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Corner stats */}
                <div className="absolute bottom-4 left-4 rounded-xl bg-black/50 px-3 py-2 backdrop-blur-sm">
                  <div className="text-[10px] font-medium text-white/40">Latence</div>
                  <div className="text-sm font-extrabold text-emerald-400">&lt; 400 ms</div>
                </div>
                <div className="absolute bottom-4 right-4 rounded-xl bg-black/50 px-3 py-2 backdrop-blur-sm">
                  <div className="text-[10px] font-medium text-white/40">Moteur IA</div>
                  <div className="text-sm font-extrabold text-sky-400">Azure + ElevenLabs</div>
                </div>
              </div>
            </div>

            {/* Floating language counter */}
            <div className="absolute -left-4 top-1/3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 shadow-xl backdrop-blur-sm">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/30">{t("polyglot.langLabel")}</div>
              <div className="mt-0.5 text-lg font-extrabold text-white">
                {activeLang + 1}
                <span className="text-sm font-medium text-white/40"> / 26</span>
              </div>
            </div>
          </div>

          {/* Right — clickable language grid */}
          <div>
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white/30">
              {t("polyglot.clickLang")}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {polyglotLanguages.map((l, i) => (
                <button
                  key={l.code}
                  onClick={() => selectLang(i)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 ${
                    i === activeLang
                      ? "border-violet-400/50 bg-violet-500/20 shadow-[0_0_20px_rgba(99,91,255,0.2)]"
                      : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/15"
                  }`}
                >
                  <span className="text-base leading-none">{l.flag}</span>
                  <div className="min-w-0">
                    <div className="truncate text-[11px] font-bold text-white/80">{l.name}</div>
                    <div className="text-[9px] font-medium text-white/30">{l.code}</div>
                  </div>
                  {i === activeLang && (
                    <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400 animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom proof line */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-8 border-t border-white/10 pt-10">
          {[
            { label: t("proof.tag1") },
            { label: t("proof.tag2") },
            { label: t("proof.tag3") },
            { label: t("proof.tag4") },
          ].map(({ label }) => (
            <div key={label} className="flex items-center gap-2 text-sm font-medium text-white/40">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-emerald-400">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Animated translation card ──────────────────────────────────────────────── */
function LiveTranslationDemo() {
  const { t } = useLanguage();
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setActive((p) => (p + 1) % demoLines.length);
        setVisible(true);
      }, 400);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  const line = demoLines[active];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_40px_-12px_rgba(10,37,64,0.18)]">
      <div className="mb-4 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">
          {t("polyglot.activeLabel")}
        </span>
        <span className="ml-auto rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-600 uppercase tracking-wider">
          &lt; 400 ms
        </span>
      </div>

      <div
        className="transition-all duration-400"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(6px)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex h-5 w-7 items-center justify-center rounded bg-slate-100 text-[9px] font-bold tracking-wider text-slate-500">{line.code}</span>
          <span className="text-xs font-semibold text-slate-400">{line.speaker}</span>
        </div>
        <p className="text-[15px] font-semibold text-[#0a2540] leading-6">
          {line.text}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-violet-600">
              <path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.925A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.896 28.896 0 0 0 15.293-7.154.75.75 0 0 0 0-1.115A28.897 28.897 0 0 0 3.105 2.289Z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <span className="inline-flex h-4 w-6 items-center justify-center rounded bg-violet-100 text-[8px] font-bold text-violet-500">{line.tcode}</span>
              Traduction instantanée
            </div>
            <p className="text-sm font-semibold text-violet-700 leading-5">{line.translated}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-1.5">
        {demoLines.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === active ? "w-8 bg-violet-500" : "w-2 bg-slate-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Hero image carousel ─────────────────────────────────────────────────────── */
function HeroCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((p) => (p + 1) % heroPhotos.length), 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative h-[460px] overflow-hidden rounded-[28px] border border-slate-200 shadow-[0_40px_100px_-30px_rgba(10,37,64,0.25)]">
      {heroPhotos.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ${
            i === active ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
        />
      ))}
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a2540]/70 via-transparent to-transparent" />
      {/* Bottom card */}
      <div className="absolute bottom-4 left-4 right-4">
        <LiveTranslationDemo />
      </div>
    </div>
  );
}

/* ── Stat badge ─────────────────────────────────────────────────────────────── */
function StatBadge({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
      <span className="text-2xl font-extrabold text-[#0a2540]">{value}</span>
      <span className="text-[11px] font-medium text-slate-500">{label}</span>
    </div>
  );
}

/* ── How it works step ───────────────────────────────────────────────────────── */
function HowStep({ n, title, text, color }: { n: string; title: string; text: string; color: string }) {
  return (
    <div className="flex gap-5">
      <div className={`shrink-0 flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-extrabold ${color}`}>
        {n}
      </div>
      <div>
        <h3 className="text-lg font-bold text-[#0a2540]">{title}</h3>
        <p className="mt-1.5 text-sm leading-7 text-slate-500">{text}</p>
      </div>
    </div>
  );
}

/* ── Feature card ───────────────────────────────────────────────────────────── */
function FeatureCard({ Icon, color, title, text }: { Icon: React.FC; color: string; title: string; text: string }) {
  return (
    <div className="card-hover group rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
        <Icon />
      </div>
      <h3 className="text-base font-bold text-[#0a2540]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-500">{text}</p>
    </div>
  );
}

/* ── Use-case card ──────────────────────────────────────────────────────────── */
function UseCaseCard({ photo, title, text }: { photo: string; title: string; text: string }) {
  return (
    <div className="card-hover group overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
      <div className="relative h-40 overflow-hidden">
        <img
          src={photo}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a2540]/40 to-transparent" />
      </div>
      <div className="p-5">
        <h3 className="text-base font-bold text-[#0a2540]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
      </div>
    </div>
  );
}

/* ── Pricing preview card ───────────────────────────────────────────────────── */
function PricingPreviewCard({
  name, price, period, desc, features, cta, href, highlight,
}: {
  name: string; price: string; period: string; desc: string;
  features: string[]; cta: string; href: string; highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col rounded-[26px] border p-7 shadow-sm transition ${
        highlight
          ? "border-violet-400/50 bg-gradient-to-b from-violet-50 to-white ring-2 ring-violet-200/50"
          : "border-slate-200 bg-white"
      }`}
    >
      {highlight && (
        <div className="mb-4 inline-flex w-fit rounded-full bg-violet-600 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
          Recommandé
        </div>
      )}
      <h3 className="text-xl font-extrabold text-[#0a2540]">{name}</h3>
      <p className="mt-1.5 text-sm text-slate-500">{desc}</p>
      <div className="mt-5 flex items-end gap-1.5">
        <span className="text-4xl font-extrabold text-[#0a2540]">{price}</span>
        {period && <span className="mb-1 text-sm text-slate-400">{period}</span>}
      </div>
      <Link
        href={href}
        className={`mt-5 flex items-center justify-center rounded-2xl px-5 py-3.5 text-sm font-semibold transition ${
          highlight
            ? "bg-violet-600 text-white hover:bg-violet-700"
            : "bg-[#0a2540] text-white hover:bg-[#16324f]"
        }`}
      >
        {cta}
      </Link>
      <ul className="mt-6 space-y-3">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm leading-6 text-slate-600">
            <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
            </svg>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────────── */
export default function HomePage() {
  const { t } = useLanguage();
  const fKeys = ["f1","f2","f3","f4","f5","f6"] as const;

  return (
    <div className="min-h-screen bg-[#f6f9fc] text-slate-900 antialiased">
      <Navbar />

      {/* ─────────────────────────────── HERO ──────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-slate-200/60 bg-[linear-gradient(180deg,#ffffff_0%,#f6f9fc_100%)]">
        {/* Background radial glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-violet-100/60 blur-[120px]" />
          <div className="absolute -right-20 top-20 h-[400px] w-[400px] rounded-full bg-sky-100/50 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-12 lg:pt-16">
          {/* Photo strip */}
          <div className="mb-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
            <div className="hero-strip">
              {[...heroPhotos, ...heroPhotos].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="h-24 w-40 shrink-0 rounded-2xl border border-slate-200 object-cover shadow-sm"
                />
              ))}
            </div>
          </div>

          {/* Main grid */}
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left — copy */}
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-600 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
                {t("hero.badge")}
              </div>

              <h1 className="text-5xl font-extrabold leading-[1.06] tracking-tight text-[#0a2540] md:text-[64px]">
                {t("hero.title")}{" "}
                <span className="gradient-text">{t("hero.titleAccent")}</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-500">
                {t("hero.subtitle")}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/pricing"
                  className="shimmer-btn inline-flex items-center justify-center rounded-full px-7 py-4 text-[15px] font-semibold text-white shadow-[0_8px_30px_-8px_rgba(99,91,255,0.5)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_36px_-8px_rgba(99,91,255,0.6)]"
                >
                  {t("hero.cta")}
                  <svg viewBox="0 0 20 20" fill="currentColor" className="ml-2 h-4 w-4">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                  </svg>
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-4 text-[15px] font-semibold text-[#0a2540] transition hover:border-slate-400 hover:bg-slate-50"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5 text-violet-500">
                    <path d="M6.3 2.84A1.5 1.5 0 0 0 4 4.11v11.78a1.5 1.5 0 0 0 2.3 1.27l9.344-5.891a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
                  </svg>
                  {t("hero.demo")}
                </Link>
              </div>

              <p className="mt-4 text-xs text-slate-400">{t("hero.trust")}</p>

              {/* Stats */}
              <div className="mt-8 flex flex-wrap gap-3">
                <StatBadge value={t("hero.stat1")} label={t("hero.stat1sub")} />
                <StatBadge value={t("hero.stat2")} label={t("hero.stat2sub")} />
                <StatBadge value={t("hero.stat3")} label={t("hero.stat3sub")} />
              </div>

              {/* Trust badges */}
              <div className="mt-8 flex items-center gap-4 flex-wrap">
                {["Infrastructure cloud souveraine", "Chiffrement E2E", "Conforme RGPD"].map((b) => (
                  <span key={b} className="text-[11px] font-semibold text-slate-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">{b}</span>
                ))}
              </div>
            </div>

            {/* Right — product visual */}
            <div className="relative">
              {/* Floating glow behind */}
              <div className="absolute -inset-6 rounded-[40px] bg-gradient-to-br from-violet-200/30 to-sky-200/20 blur-2xl" />
              <HeroCarousel />
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────── PROBLEM ───────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left — image */}
          <div className="relative order-2 lg:order-1">
            <img
              src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80"
              alt="International meeting"
              className="rounded-[28px] object-cover shadow-[0_30px_80px_-30px_rgba(10,37,64,0.2)] w-full h-80 lg:h-auto"
            />
            {/* Floating stat card */}
            <div className="absolute -bottom-4 -right-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl lg:-right-8">
              <div className="text-3xl font-extrabold text-[#0a2540]">87%</div>
              <div className="mt-0.5 text-xs font-medium text-slate-500 max-w-[140px]">
                des pros ont perdu un contrat à cause de la langue
              </div>
            </div>
          </div>
          {/* Right — text */}
          <div className="order-1 lg:order-2">
            <div className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-rose-500 shadow-sm">
              {t("problem.badge")}
            </div>
            <h2 className="mt-5 text-4xl font-extrabold tracking-tight text-[#0a2540] md:text-5xl">
              {t("problem.title")}
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-500">
              {t("problem.text")}
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {(["s1","s2","s3","s4"] as const).map((k) => (
                <div key={k} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="mt-0.5 shrink-0 text-rose-400">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className="text-sm leading-6 text-slate-600">{t(`problem.${k}`)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────── HOW IT WORKS ──────────────────────────── */}
      <section className="border-y border-slate-200 bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex rounded-full border border-slate-200 bg-[#f6f9fc] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#635bff] shadow-sm">
              {t("how.badge")}
            </div>
            <h2 className="mt-5 text-4xl font-extrabold tracking-tight text-[#0a2540] md:text-5xl">
              {t("how.title")}
            </h2>
          </div>

          <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:items-center">
            {/* Steps */}
            <div className="flex flex-col gap-8">
              <HowStep
                n="01"
                title={t("how.step1Title")}
                text={t("how.step1Text")}
                color="bg-violet-100 text-violet-600"
              />
              <div className="ml-5 h-8 w-px bg-slate-200" />
              <HowStep
                n="02"
                title={t("how.step2Title")}
                text={t("how.step2Text")}
                color="bg-sky-100 text-sky-600"
              />
              <div className="ml-5 h-8 w-px bg-slate-200" />
              <HowStep
                n="03"
                title={t("how.step3Title")}
                text={t("how.step3Text")}
                color="bg-emerald-100 text-emerald-600"
              />
            </div>

            {/* Live demo widget */}
            <div className="rounded-[32px] border border-slate-200 bg-[#f6f9fc] p-6 shadow-[0_20px_60px_-30px_rgba(10,37,64,0.15)]">
              <div className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Simulation en direct
              </div>
              <div className="flex flex-col gap-3">
                {/* User A */}
                <div className="flex items-start gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80"
                    alt=""
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-white"
                  />
                  <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 shadow-sm text-sm text-[#0a2540] font-medium border border-slate-100">
                    <span className="mr-1.5 inline-flex h-4 w-6 items-center justify-center rounded bg-slate-100 text-[8px] font-bold tracking-wider text-slate-500">FR</span>&ldquo;Bonjour, voici notre proposition pour ce trimestre.&rdquo;
                  </div>
                </div>
                {/* AI bar */}
                <div className="mx-auto flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-[11px] font-bold text-violet-600 uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
                  Traduction instantanée IA
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
                </div>
                {/* User B */}
                <div className="flex items-start gap-3 flex-row-reverse">
                  <img
                    src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&q=80"
                    alt=""
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-white"
                  />
                  <div className="rounded-2xl rounded-tr-sm bg-[#635bff] px-4 py-2.5 shadow-sm text-sm text-white font-medium">
                    <span className="mr-1.5 inline-flex h-4 w-6 items-center justify-center rounded bg-white/20 text-[8px] font-bold tracking-wider text-white/80">JP</span>&ldquo;今四半期のご提案ありがとうございます。&rdquo;
                  </div>
                </div>
                {/* Subtitles bar */}
                <div className="mt-1 rounded-xl border border-slate-200 bg-white p-3 text-center text-xs text-slate-500">
                  <span className="font-semibold text-[#0a2540]">Sous-titres :</span>{" "}
                  &ldquo;Hello, here is our proposal for this quarter.&rdquo;
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────── FEATURES ────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-extrabold tracking-tight text-[#0a2540] md:text-5xl">
            {t("features.title")}
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-500">
            {t("features.description")}
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {fKeys.map((k, i) => {
            const Icon = featureIcons[i];
            return (
              <FeatureCard
                key={k}
                Icon={Icon}
                color={featureColors[i]}
                title={t(`features.${k}Title`)}
                text={t(`features.${k}Text`)}
              />
            );
          })}
        </div>
      </section>

      {/* ──────────────────────────── USE CASES ────────────────────────────── */}
      <section className="border-y border-slate-200 bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-slate-200 bg-[#f6f9fc] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#635bff] shadow-sm">
                {t("usecases.badge")}
              </div>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-[#0a2540] md:text-5xl">
                {t("usecases.title")}
              </h2>
            </div>
            <Link href="/pricing" className="shrink-0 text-sm font-semibold text-[#635bff] hover:underline">
              Voir toutes les offres →
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(["u1","u2","u3","u4","u5","u6"] as const).map((k, i) => (
              <UseCaseCard
                key={k}
                photo={useCasePhotos[i]}
                title={t(`usecases.${k}Title`)}
                text={t(`usecases.${k}Text`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────── VIDEO SECTION ────────────────────────── */}
      <section className="border-t border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <div className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-violet-600 shadow-sm">
              {t("video.badge")}
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0a2540] md:text-4xl">
              {t("video.title")}
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-500">
              {t("video.sub")}
            </p>
          </div>
          <HeroVideoPlayer />
        </div>
      </section>

      {/* ─────────────────────────── LANGUAGES GLOBE ───────────────────────── */}
      <section className="relative overflow-hidden py-20">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#635bff08_0%,#00b4d808_100%)]" />
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#0a2540] md:text-4xl">
              {t("langs.title")}
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-500">
              {t("langs.sub")}
            </p>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-2.5">
            {[
              "Français", "English", "Español", "Deutsch", "Italiano", "Português",
              "Nederlands", "中文", "日本語", "العربية", "한국어", "हिन्दी",
              "Türkçe", "Русский", "Polski", "Svenska", "Ελληνικά", "Čeština",
              "Română", "Magyar", "Kiswahili", "ภาษาไทย", "Tiếng Việt", t("langs.more"),
            ].map((name) => (
              <div
                key={name}
                className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────── TESTIMONIALS ─────────────────────────── */}
      <TestimonialMarquee />

      {/* ─────────────────────────── PRICING PREVIEW ───────────────────────── */}
      <section className="border-t border-slate-200 bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="inline-flex rounded-full border border-slate-200 bg-[#f6f9fc] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#635bff] shadow-sm">
              {t("nav.pricing")}
            </div>
            <h2 className="mt-5 text-4xl font-extrabold tracking-tight text-[#0a2540] md:text-5xl">
              {t("pricing.title")}
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-500">{t("pricing.sub")}</p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <PricingPreviewCard
              name={t("pricing.premium")}
              price="24€"
              period={t("pricing.perMonth")}
              desc={t("pricing.premiumDesc")}
              features={[
                t("features.f1Title"),
                t("features.f2Title"),
                t("features.f3Title"),
                t("proof.p3Title"),
              ]}
              cta={t("pricing.premiumCta")}
              href="/pricing"
            />
            <PricingPreviewCard
              name={t("pricing.business")}
              price="99€"
              period={t("pricing.perMonth")}
              desc={t("pricing.businessDesc")}
              features={[
                t("features.f1Title"),
                t("features.f4Title"),
                t("features.f5Title"),
                t("features.f6Title"),
              ]}
              cta={t("pricing.businessCta")}
              href="/pricing"
              highlight
            />
            <PricingPreviewCard
              name={t("pricing.enterprise")}
              price={t("pricing.enterprisePrice")}
              period=""
              desc={t("pricing.enterpriseDesc")}
              features={[
                t("pricing.enterpriseF2"),
                t("pricing.enterpriseF6"),
                t("pricing.enterpriseF5"),
                t("pricing.enterpriseF4"),
              ]}
              cta={t("pricing.enterpriseCta")}
              href="/contact"
            />
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#635bff] hover:underline"
            >
              {t("pricing.compareAll")}
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────── PRODUCT GUIDE / ONBOARDING ────────────────── */}
      <section className="border-y border-slate-200 bg-[#f6f9fc] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <div className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-violet-600 shadow-sm">
              {t("guide.badge")}
            </div>
            <h2 className="mt-5 text-4xl font-extrabold tracking-tight text-[#0a2540] md:text-5xl">
              {t("guide.title")}
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-500">
              {t("guide.sub")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[
              {
                num: "01",
                color: "bg-violet-100 text-violet-700",
                title: t("guide.c1title"),
                steps: [t("guide.c1s1"), t("guide.c1s2"), t("guide.c1s3")],
              },
              {
                num: "02",
                color: "bg-sky-100 text-sky-700",
                title: t("guide.c2title"),
                steps: [t("guide.c2s1"), t("guide.c2s2"), t("guide.c2s3")],
              },
              {
                num: "03",
                color: "bg-emerald-100 text-emerald-700",
                title: t("guide.c3title"),
                steps: [t("guide.c3s1"), t("guide.c3s2"), t("guide.c3s3")],
              },
              {
                num: "04",
                color: "bg-amber-100 text-amber-700",
                title: t("guide.c4title"),
                steps: [t("guide.c4s1"), t("guide.c4s2"), t("guide.c4s3")],
              },
              {
                num: "05",
                color: "bg-rose-100 text-rose-700",
                title: t("guide.c5title"),
                steps: [t("guide.c5s1"), t("guide.c5s2"), t("guide.c5s3")],
              },
              {
                num: "06",
                color: "bg-indigo-100 text-indigo-700",
                title: t("guide.c6title"),
                steps: [t("guide.c6s1"), t("guide.c6s2"), t("guide.c6s3")],
              },
            ].map((item) => (
              <div key={item.num} className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className={`mb-4 inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-extrabold ${item.color}`}>
                  {item.num}
                </div>
                <h3 className="mb-4 text-base font-bold text-[#0a2540]">{item.title}</h3>
                <ol className="space-y-2.5">
                  {item.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm leading-6 text-slate-500">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-400">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-[#635bff] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:bg-[#5247ff]"
            >
              {t("guide.cta")}
            </Link>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────── CTA ──────────────────────────────── */}
      <section className="relative overflow-hidden py-24">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#0a2540_0%,#1a1060_50%,#0a2540_100%)]" />
        {/* Grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Glow orbs */}
        <div className="pointer-events-none absolute left-1/4 top-0 h-72 w-72 rounded-full bg-violet-500/20 blur-[100px]" />
        <div className="pointer-events-none absolute right-1/4 bottom-0 h-60 w-60 rounded-full bg-sky-500/15 blur-[80px]" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">
            {t("pricing.finalBadge")}
          </div>
          <h2 className="mt-5 text-4xl font-extrabold tracking-tight text-white md:text-6xl">
            {t("pricing.finalTitle")}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/65">
            {t("pricing.finalText")}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-[15px] font-semibold text-[#0a2540] shadow-xl transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              {t("pricing.finalCta1")}
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-8 py-4 text-[15px] font-semibold text-white transition hover:bg-white/15"
            >
              {t("pricing.finalCta2")}
            </Link>
          </div>
          <p className="mt-5 text-sm text-white/40">{t("hero.trust")}</p>
        </div>
      </section>

      {/* ──────────────────────────────── FOOTER ───────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid gap-10 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#635bff]">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" />
                    <path d="M8 12h8M12 8v8" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-base font-extrabold text-[#0a2540]">
                  Instant<span className="text-[#635bff]">Talk</span>
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-500">
                {t("footer.tagline")}
              </p>
            </div>

            {/* Links */}
            {[
              {
                heading: t("footer.product"),
                links: [
                  { label: t("footer.features"), href: "/#features" },
                  { label: t("footer.pricing"),  href: "/pricing" },
                  { label: t("footer.demo"),     href: "/demo" },
                ],
              },
              {
                heading: t("footer.company"),
                links: [
                  { label: t("footer.contact"),  href: "/contact" },
                  { label: t("footer.about"),    href: "/about" },
                ],
              },
              {
                heading: t("footer.legal"),
                links: [
                  { label: t("footer.privacy"),  href: "/contact" },
                  { label: t("footer.terms"),    href: "/contact" },
                ],
              },
            ].map((col) => (
              <div key={col.heading}>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  {col.heading}
                </div>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-sm text-slate-500 transition hover:text-slate-900">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Extra links */}
          <div className="mt-8 mb-4 flex flex-wrap gap-x-6 gap-y-2 justify-center">
            {[
              { href: "/status",        label: "● Statut" },
              { href: "/device-check",  label: "Test appareil" },
              { href: "/pricing",       label: "Tarifs" },
              { href: "/contact",       label: "Contact" },
              { href: "/dashboard",     label: "Dashboard" },
            ].map(({ href, label }) => (
              <a key={href} href={href} style={{ fontSize: "12px", color: "rgba(148,163,184,0.7)", textDecoration: "none" }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#e2e8f0")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(148,163,184,0.7)")}
              >{label}</a>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-7 sm:flex-row">
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Instant Talk Global. {t("footer.rights")}
            </p>
            <div className="flex gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" /></svg>
                RGPD
              </span>
              <span className="flex items-center gap-1">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path fillRule="evenodd" d="M9.661 2.237a.531.531 0 0 1 .678 0 11.947 11.947 0 0 0 7.078 2.749.5.5 0 0 1 .479.425c.069.52.104 1.05.104 1.589 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 0 1-.332 0C5.26 16.563 2 12.162 2 7a11.8 11.8 0 0 1 .104-1.589.5.5 0 0 1 .48-.425 11.947 11.947 0 0 0 7.077-2.749Z" clipRule="evenodd" /></svg>
                Chiffrement E2E
              </span>
              <span className="flex items-center gap-1">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-1.503.204A6.5 6.5 0 1 1 9.68 3.55a.5.5 0 0 1 .357-.042l.02.005c.737.165 1.643.878 2.06 2.215.28.898.256 1.83-.123 2.626a3.016 3.016 0 0 1-.44.608c-.022.025-.044.05-.066.076-.206.232-.274.407-.286.539-.012.133.007.265.044.394.075.256.234.527.413.808.207.324.435.68.566 1.056.09.258.127.547.048.828-.082.29-.275.506-.538.66a.5.5 0 0 1-.236.062Z" clipRule="evenodd" /></svg>
                Infrastructure mondiale
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

