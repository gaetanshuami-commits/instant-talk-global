"use client";

import React, { useEffect, useRef, useState } from "react";
import { VolumeX, Volume2 } from "lucide-react";

const translationScenes = [
  {
    speaker: "Marie",
    code: "FR",
    lang: "Français",
    original: "Bonjour, démarrons cette réunion internationale.",
    translated: "Hello, let's start this international meeting.",
    tlang: "English",
  },
  {
    speaker: "Kenji",
    code: "JP",
    lang: "日本語",
    original: "皆さん、本日もよろしくお願いします。",
    translated: "Bonjour à tous. Merci d'être là aujourd'hui.",
    tlang: "Français",
  },
  {
    speaker: "Ahmed",
    code: "AR",
    lang: "العربية",
    original: "يسعدني التعاون معكم في هذا المشروع.",
    translated: "I'm delighted to collaborate on this project.",
    tlang: "English",
  },
  {
    speaker: "Sofia",
    code: "PT",
    lang: "Português",
    original: "Nossa equipe está pronta para avançar.",
    translated: "Unser Team ist bereit, voranzukommen.",
    tlang: "Deutsch",
  },
];

export function HeroVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const video = videoRef.current;
    async function safePlay() {
      if (!video) return;
      try {
        const p = video.play();
        if (p && typeof p.then === "function") await p;
      } catch (e: any) {
        if (cancelled) return;
        if (e?.name === "AbortError" || e?.name === "NotAllowedError") return;
      }
    }
    safePlay();
    return () => {
      cancelled = true;
      try { video?.pause(); } catch {}
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setSceneIdx((i) => (i + 1) % translationScenes.length);
        setVisible(true);
      }, 400);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = async () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !isMuted;
    video.muted = next;
    setIsMuted(next);
    if (!next) { try { await video.play(); } catch {} }
  };

  const scene = translationScenes[sceneIdx];

  return (
    <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] border border-slate-200 bg-[#0A2540] p-3 shadow-[0_35px_90px_-35px_rgba(10,37,64,0.38)]">
      <div className="relative aspect-video overflow-hidden rounded-[26px] bg-slate-950">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          preload="metadata"
          poster="https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=1600&q=80"
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        >
          <source src="https://cdn.coverr.co/videos/coverr-business-meeting-2544/1080p.mp4" type="video/mp4" />
        </video>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A2540]/90 via-[#0A2540]/20 to-transparent" />

        {/* World participants bar — top */}
        <div className="absolute left-5 right-5 top-5 z-20 flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-[#0A2540]/70 px-3 py-1.5 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-white/80">4 participants</span>
          </div>
          <div className="flex gap-1.5">
            {translationScenes.map((s, i) => (
              <button
                key={s.code}
                onClick={() => { setVisible(false); setTimeout(() => { setSceneIdx(i); setVisible(true); }, 200); }}
                className={`flex h-7 items-center justify-center rounded-full border px-2 text-[10px] font-bold tracking-wider transition ${
                  i === sceneIdx
                    ? "border-white/60 bg-white/20 text-white"
                    : "border-white/10 bg-white/5 text-white/60 opacity-60 hover:opacity-100"
                }`}
                title={s.speaker}
              >
                {s.code}
              </button>
            ))}
          </div>
        </div>

        {/* Sound toggle */}
        <div className="absolute right-5 top-16 z-20">
          <button
            onClick={toggleSound}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>

        {/* Translation overlay — bottom */}
        <div
          className="absolute bottom-5 left-5 right-5 z-20 rounded-2xl border border-white/15 bg-white/95 p-5 shadow-xl backdrop-blur transition-all duration-400"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(6px)" }}
        >
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-8 items-center justify-center rounded bg-slate-100 text-[10px] font-bold tracking-wider text-slate-500">{scene.code}</span>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{scene.lang}</div>
                <div className="text-xs font-semibold text-[#0A2540]">{scene.speaker}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </div>
          </div>

          {/* Speech */}
          <div className="text-sm font-semibold text-[#0A2540] leading-6">
            {scene.original}
          </div>

          {/* Translation arrow */}
          <div className="my-2 flex items-center gap-2">
            <div className="h-px flex-1 bg-slate-200" />
            <div className="flex items-center gap-1 text-[10px] font-bold text-[#635bff] uppercase tracking-wider">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                <path d="M7.293 14.707a1 1 0 0 1 0-1.414L10.586 10 7.293 6.707a1 1 0 0 1 1.414-1.414l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414 0Z" />
              </svg>
              {scene.tlang}
            </div>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Translated text */}
          <div className="text-sm font-medium text-[#635bff]">
            {scene.translated}
          </div>
        </div>
      </div>
    </div>
  );
}
