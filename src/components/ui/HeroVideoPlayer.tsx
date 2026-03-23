"use client";

import React, { useEffect, useRef, useState } from "react";

export function HeroVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const video = videoRef.current;

    async function safePlay() {
      if (!video) return;
      try {
        const promise = video.play();
        if (promise && typeof promise.then === "function") {
          await promise;
        }
      } catch (error: any) {
        if (cancelled) return;
        if (error?.name === "AbortError") return;
        if (error?.name === "NotAllowedError") return;
      }
    }

    safePlay();

    return () => {
      cancelled = true;
      if (video) {
        try { video.pause(); } catch {}
      }
    };
  }, []);

  const toggleSound = async () => {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);

    if (!nextMuted) {
      try {
        await video.play();
      } catch (error: any) {}
    }
  };

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
          className="absolute inset-0 h-full w-full object-cover opacity-95"
        >
          <source src="https://cdn.coverr.co/videos/coverr-business-meeting-2544/1080p.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-t from-[#0A2540]/85 via-[#0A2540]/15 to-transparent" />

        <div className="absolute right-5 top-5 z-20">
          <button
            onClick={toggleSound}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
          >
            {isMuted ? "🔇" : "🔊"}
          </button>
        </div>

        <div className="absolute bottom-5 left-5 right-5 z-20 rounded-2xl border border-white/15 bg-white/92 p-5 shadow-xl backdrop-blur">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#635bff]">
            Traduction vocale instantanée • voix naturelle
          </div>
          <div className="mt-3 text-sm font-semibold text-slate-500">
            Speaker • Français
          </div>
          <div className="mt-1 text-lg font-semibold text-[#0A2540]">
            Bonjour à tous, nous pouvons démarrer la réunion internationale.
          </div>
          <div className="mt-1 text-sm font-semibold text-[#635bff]">
            Hello everyone, we can start the international meeting.
          </div>
        </div>
      </div>
    </div>
  );
}