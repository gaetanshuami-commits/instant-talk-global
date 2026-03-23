"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { HeroVideoPlayer } from "@/components/ui/HeroVideoPlayer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LANGUAGES } from "@/lib/languages";
import { translateText } from "@/lib/translate";

const subtitleSequence = [
  {
    speaker: "Marie",
    original: "Bonjour tout le monde, merci d'etre presents aujourd'hui.",
    translated: "Hello everyone, thank you for being here today."
  },
  {
    speaker: "David",
    original: "Nous allons vous montrer comment Instant Talk supprime les barrieres linguistiques.",
    translated: "We are going to show you how Instant Talk removes language barriers."
  },
  {
    speaker: "Marie",
    original: "Chaque participant peut entendre une voix traduite naturelle dans sa propre langue.",
    translated: "Each participant can hear a natural translated voice in their own language."
  },
  {
    speaker: "David",
    original: "Les sous-titres apparaissent en direct avec une latence minimale.",
    translated: "Subtitles appear live with minimal latency."
  }
];

export default function DemoPage() {
  const { t } = useLanguage();

  const [sourceText, setSourceText] = useState("Bonjour tout le monde, bienvenue sur Instant Talk.");
  const [targetLang, setTargetLang] = useState("EN");
  const [translatedText, setTranslatedText] = useState("");
  const [detectedSourceLang, setDetectedSourceLang] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [aiMessage, setAiMessage] = useState("Explain Instant Talk in one sentence.");
  const [aiReply, setAiReply] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const [subtitleIndex, setSubtitleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSubtitleIndex((prev) => (prev + 1) % subtitleSequence.length);
    }, 2600);

    return () => clearInterval(interval);
  }, []);

  async function handleTranslate() {
    try {
      setIsLoading(true);
      setError("");

      const data = await translateText(sourceText, targetLang);

      setTranslatedText(data?.translatedText || "");
      setDetectedSourceLang(data?.detectedSourceLang || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed");
      setTranslatedText("");
      setDetectedSourceLang("");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAskAI() {
    try {
      setAiLoading(true);
      setAiError("");

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: aiMessage,
          activeLanguage: targetLang
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.details || data?.error || "AI request failed");
      }

      setAiReply(data?.reply || "");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI request failed");
      setAiReply("");
    } finally {
      setAiLoading(false);
    }
  }

  const currentSubtitle = subtitleSequence[subtitleIndex];

  return (
    <div className="min-h-screen bg-[#f6f9fc] text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-16">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#635bff] shadow-sm">
            {t("demo.badge")}
          </div>

          <h1 className="mt-6 text-5xl font-extrabold leading-[1.03] tracking-tight text-[#0A2540] md:text-6xl">
            {t("demo.title")}
          </h1>

          <p className="mt-6 text-lg leading-8 text-[#425466]">
            {t("demo.text")}
          </p>
        </div>

        <div className="mt-12">
          <HeroVideoPlayer />
        </div>

        <section className="mt-8 rounded-[32px] border border-slate-200 bg-[#0A2540] p-6 text-white shadow-sm md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7c8cff]">
                Live subtitles simulation
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
                Real-time multilingual captions
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
                A premium preview of how speakers, subtitles, and translated output can feel during a live meeting.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80">
              <span className="h-2 w-2 rounded-full bg-green-400" />
              Live preview
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                Active speaker
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#635bff] text-lg font-bold text-white">
                  {currentSubtitle.speaker.slice(0, 1)}
                </div>

                <div>
                  <div className="text-lg font-semibold text-white">
                    {currentSubtitle.speaker}
                  </div>
                  <div className="text-sm text-white/60">
                    Speaking now
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-end gap-1 h-16">
                <span className="w-2 rounded-full bg-white/70 h-5 animate-pulse" />
                <span className="w-2 rounded-full bg-white/70 h-10 animate-pulse" />
                <span className="w-2 rounded-full bg-[#7c8cff] h-14 animate-pulse" />
                <span className="w-2 rounded-full bg-white/70 h-8 animate-pulse" />
                <span className="w-2 rounded-full bg-white/70 h-12 animate-pulse" />
                <span className="w-2 rounded-full bg-[#7c8cff] h-6 animate-pulse" />
                <span className="w-2 rounded-full bg-white/70 h-11 animate-pulse" />
                <span className="w-2 rounded-full bg-white/70 h-7 animate-pulse" />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                    Source
                  </div>
                  <div className="mt-2 text-sm text-white">FR</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                    Target
                  </div>
                  <div className="mt-2 text-sm text-white">{targetLang}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                  Original caption
                </div>
                <div className="mt-3 text-lg leading-8 text-white">
                  {currentSubtitle.original}
                </div>
              </div>

              <div className="rounded-[24px] border border-[#7c8cff]/30 bg-[#635bff]/10 p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b9c2ff]">
                  Translated caption
                </div>
                <div className="mt-3 text-lg leading-8 text-white">
                  {currentSubtitle.translated}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                    Subtitle latency
                  </div>
                  <div className="mt-2 text-xl font-bold text-white">0.8s</div>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                    Voice sync
                  </div>
                  <div className="mt-2 text-xl font-bold text-white">Stable</div>
                </div>
                <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                    Experience
                  </div>
                  <div className="mt-2 text-xl font-bold text-white">Premium</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#635bff]">
                Live translation demo
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#0A2540]">
                Test the translation engine now
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#425466]">
                Enter a sentence, choose a target language, and preview the translated output instantly.
              </p>
            </div>

            <button
              type="button"
              onClick={handleTranslate}
              disabled={isLoading || !sourceText.trim()}
              className="inline-flex items-center justify-center rounded-full bg-[#635bff] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Translating..." : "Translate now"}
            </button>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[24px] border border-slate-200 bg-[#f8fafc] p-5">
              <label className="mb-3 block text-sm font-semibold text-[#0A2540]">
                Source text
              </label>
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                rows={6}
                className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#635bff]"
                placeholder="Type a sentence to translate..."
              />
              <div className="mt-3 text-xs text-[#6b7280]">
                Example: Bonjour tout le monde, bienvenue sur Instant Talk.
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[24px] border border-slate-200 bg-[#f8fafc] p-5">
                <label className="mb-3 block text-sm font-semibold text-[#0A2540]">
                  Target language
                </label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#635bff]"
                >
                  {LANGUAGES.filter((lang) => lang.code !== "FR").map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label} ({lang.code})
                    </option>
                  ))}
                </select>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7280]">
                    Detection
                  </div>
                  <div className="mt-2 text-sm text-[#0A2540]">
                    {detectedSourceLang || "Waiting for translation..."}
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-[#0A2540] p-5 text-white">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                  Translated output
                </div>

                <div className="mt-4 min-h-[120px] rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-white/95">
                  {error
                    ? error
                    : translatedText || "Your translated sentence will appear here."}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#635bff]">
                AI assistant demo
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#0A2540]">
                Ask Instant Talk AI
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#425466]">
                The assistant replies in the selected target language to simulate a premium multilingual meeting experience.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAskAI}
              disabled={aiLoading || !aiMessage.trim()}
              className="inline-flex items-center justify-center rounded-full bg-[#0A2540] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#16324f] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {aiLoading ? "Thinking..." : "Ask AI"}
            </button>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[24px] border border-slate-200 bg-[#f8fafc] p-5">
              <label className="mb-3 block text-sm font-semibold text-[#0A2540]">
                Your question
              </label>
              <textarea
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                rows={5}
                className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#635bff]"
                placeholder="Ask the AI assistant something..."
              />
              <div className="mt-3 text-xs text-[#6b7280]">
                Example: Explain Instant Talk in one sentence.
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-[#eef2ff] p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#635bff]">
                AI reply ({targetLang})
              </div>

              <div className="mt-4 min-h-[150px] rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-7 text-[#0A2540]">
                {aiError
                  ? aiError
                  : aiReply || "The AI answer will appear here in the selected language."}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
            <h3 className="text-xl font-bold text-[#0A2540]">{t("demo.step1Title")}</h3>
            <p className="mt-3 text-sm leading-7 text-[#425466]">{t("demo.step1Text")}</p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
            <h3 className="text-xl font-bold text-[#0A2540]">{t("demo.step2Title")}</h3>
            <p className="mt-3 text-sm leading-7 text-[#425466]">{t("demo.step2Text")}</p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
            <h3 className="text-xl font-bold text-[#0A2540]">{t("demo.step3Title")}</h3>
            <p className="mt-3 text-sm leading-7 text-[#425466]">{t("demo.step3Text")}</p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center rounded-full bg-[#0A2540] px-7 py-4 text-base font-semibold text-white transition hover:bg-[#16324f]"
          >
            {t("demo.cta1")}
          </Link>

          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-4 text-base font-semibold text-[#0A2540] transition hover:bg-slate-50"
          >
            {t("demo.cta2")}
          </Link>
        </div>
      </main>
    </div>
  );
}
