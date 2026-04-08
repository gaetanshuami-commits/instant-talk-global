"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ILocalAudioTrack,
  ILocalVideoTrack,
} from "agora-rtc-sdk-ng"

import LanguageSelector from "@/components/LanguageSelector"
import VoiceSelector    from "@/components/VoiceSelector"
import type { VoiceGender } from "@/core/voiceEngine"
import type { PlanCapabilities } from "@/lib/planCapabilities"

// ─── Lazy voiceEngine — SDK loaded at room join (warmup), not at mount ────────
type VoiceEngineModule = typeof import("@/core/voiceEngine")
let _ve: VoiceEngineModule | null = null
async function getVE(): Promise<VoiceEngineModule> {
  if (!_ve) _ve = await import("@/core/voiceEngine")
  return _ve
}

type Subtitle = { lang: string; text: string; final: boolean }

// ─── Component ────────────────────────────────────────────────────────────────

export default function RoomClient({ roomId }: { roomId: string }) {
  const [isMicOn, setIsMicOn]             = useState(true)
  const [isCamOn, setIsCamOn]             = useState(true)
  const [sourceLang, setSourceLang]       = useState("fr")
  const [targetLang, setTargetLang]       = useState("en")
  const [voiceGender, setVoiceGender]     = useState<VoiceGender>("female")
  const [isTranslating, setIsTranslating] = useState(false)
  const [subtitle, setSubtitle]           = useState<Subtitle | null>(null)
  const [remoteUsers, setRemoteUsers]     = useState<IAgoraRTCRemoteUser[]>([])
  const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | null>(null)
  const [netStatus, setNetStatus]         = useState<"ok" | "reconnecting" | "error">("ok")

  const clientRef      = useRef<IAgoraRTCClient | null>(null)
  const tracksRef      = useRef<{ audio: ILocalAudioTrack; video: ILocalVideoTrack } | null>(null)
  const interpreterRef = useRef<ILocalAudioTrack | null>(null)
  const isInitializing = useRef(false)
  const subtitleTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const remoteUsersRef = useRef<IAgoraRTCRemoteUser[]>([])
  const restartSeq     = useRef(0)
  const agoraTokenRef  = useRef<string>("")
  const agoraUidRef    = useRef<number | null>(null)
  // Plan capabilities returned by /api/agora-token — used for language + participant limits
  const planCapsRef    = useRef<PlanCapabilities | null>(null)

  // Keep a live ref to remote users for voiceEngine callback (no stale closure)
  useEffect(() => { remoteUsersRef.current = remoteUsers }, [remoteUsers])

  // ─── Cleanup ────────────────────────────────────────────────────────────────

  const cleanup = useCallback(async () => {
    if (_ve) await _ve.stopTranslation().catch(() => {})

    if (interpreterRef.current) {
      try { await clientRef.current?.unpublish(interpreterRef.current) } catch {}
      try { interpreterRef.current.close() } catch {}
      interpreterRef.current = null
    }

    if (tracksRef.current) {
      try { tracksRef.current.video.stop()  } catch {}
      try { tracksRef.current.video.close() } catch {}
      try { tracksRef.current.audio.stop()  } catch {}
      try { tracksRef.current.audio.close() } catch {}
      tracksRef.current = null
      setLocalVideoTrack(null)
    }

    if (clientRef.current) {
      try { clientRef.current.removeAllListeners() } catch {}
      try { await clientRef.current.leave()        } catch {}
      clientRef.current = null
    }
  }, [])

  // ─── Manual rejoin after SDK gives up ───────────────────────────────────────

  const rejoin = useCallback(async (client: IAgoraRTCClient) => {
    if (!agoraTokenRef.current) return
    setNetStatus("reconnecting")
    try {
      await client.join(
        process.env.NEXT_PUBLIC_AGORA_APP_ID!,
        roomId,
        agoraTokenRef.current,
        agoraUidRef.current
      )
      if (tracksRef.current) {
        await client.publish([tracksRef.current.audio, tracksRef.current.video])
      }
      if (interpreterRef.current) {
        await client.publish(interpreterRef.current)
      }
      setNetStatus("ok")
    } catch (err) {
      console.error("[REJOIN]", err)
      setNetStatus("error")
    }
  }, [roomId])

  // ─── Agora init ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isInitializing.current) return
    isInitializing.current = true
    let cancelled = false

    const start = async () => {
      try {
        const res  = await fetch(`/api/agora-token?channel=${encodeURIComponent(roomId)}`)
        const data = await res.json()
        if (cancelled) return

        // Subscription / participant-limit gate
        if (!res.ok) {
          const reason = data.code === "ROOM_FULL"
            ? `Salle complète — votre plan autorise jusqu'à ${data.maxParticipants} participants.`
            : (data.error || "Accès refusé. Vérifiez votre abonnement.")
          console.error("[ROOM ACCESS]", reason)
          setNetStatus("error")
          return
        }

        agoraTokenRef.current = data.token
        agoraUidRef.current   = data.uid
        // Store plan capabilities for language enforcement in startTrans
        if (data.caps) planCapsRef.current = data.caps

        // h264: hardware-accelerated encoding on most GPUs/CPUs (Intel QSV,
        // AMD VCE, Qualcomm). Frees significant CPU vs software VP8 encode,
        // leaving more headroom for Azure STT + TTS pipelines.
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "h264" })
        clientRef.current = client

        // Cloud Proxy mode 5 (TCP 443) — survives firewalls + background tabs
        try { await client.startProxyServer(5) } catch {}

        // ── User media events ─────────────────────────────────────────────
        client.on("user-published", async (user, mediaType) => {
          try { await client.subscribe(user, mediaType) }
          catch (err) { console.warn("[subscribe]", err); return }

          if (mediaType === "video") {
            try {
              client.setStreamFallbackOption(
                user.uid,
                2 as Parameters<typeof client.setStreamFallbackOption>[1]
              )
            } catch {}
            setRemoteUsers((prev) =>
              prev.find((u) => u.uid === user.uid) ? prev : [...prev, user]
            )
            // rAF retry: waits for React to render the container div.
            // Uses `user` directly from the event closure — avoids the
            // stale client.remoteUsers lookup that caused race conditions.
            let n = 0
            const go = () => {
              if (document.getElementById(`rv-${user.uid}`)) {
                try { user.videoTrack?.play(`rv-${user.uid}`) } catch {}
              } else if (n++ < 40) requestAnimationFrame(go)
            }
            requestAnimationFrame(go)
          }
          if (mediaType === "audio") {
            try { user.audioTrack?.play() } catch {}
          }
        })

        client.on("user-unpublished", (user, mediaType) => {
          if (mediaType === "video")
            setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid))
        })

        client.on("user-left", (user) => {
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid))
        })

        client.on("connection-state-change", (cur, prev) => {
          console.info(`[Agora] ${prev} → ${cur}`)
          if (cur === "RECONNECTING") setNetStatus("reconnecting")
          else if (cur === "CONNECTED") setNetStatus("ok")
          else if (cur === "DISCONNECTED" && !cancelled) {
            setTimeout(() => {
              if (!cancelled && clientRef.current === client) void rejoin(client)
            }, 3000)
          }
        })

        client.on("exception", (evt) => {
          console.warn("[Agora exception]", evt.code, evt.msg)
        })

        // ── Camera + mic ──────────────────────────────────────────────────
        // Video: 1080p, 30fps, bitrateMin 1000, bitrateMax 3000 (as specified).
        // optimizationMode "motion" keeps frame-rate stable under CPU load.
        // Mic: AEC + ANS + AGC + high-quality profile for better STT accuracy.
        const [audio, video] = await AgoraRTC.createMicrophoneAndCameraTracks(
          {
            AEC: true,
            // ANS removed: Azure STT performs server-side noise suppression.
            // Agora's local ANS was over-compressing the signal → AUDIO_INPUT_LEVEL_TOO_LOW
            // (exception 2001) → STT missed words → bad translation.
            AGC: true,
            encoderConfig: "speech_low_quality", // 16 kHz 24 kbps — optimised for voice/STT
          },
          {
            optimizationMode: "motion",
            encoderConfig: {
              width:      { min: 1280, ideal: 1920 },
              height:     { min: 720,  ideal: 1080 },
              frameRate:  30,
              bitrateMin: 1000,
              bitrateMax: 3000,
            },
          }
        )

        // Belt-and-suspenders: set motion mode on the track object too
        try { (video as any).setOptimizationMode?.("motion") } catch {} // eslint-disable-line @typescript-eslint/no-explicit-any

        if (cancelled) {
          try { video.close() } catch {}
          try { audio.close() } catch {}
          return
        }

        tracksRef.current = { audio, video }
        setLocalVideoTrack(video)

        await client.join(
          process.env.NEXT_PUBLIC_AGORA_APP_ID!,
          roomId,
          data.token,
          data.uid
        )
        // Ensure tracks are enabled before publish — React StrictMode double-effect
        // or a race on createMicrophoneAndCameraTracks can leave them in disabled state,
        // causing TRACK_IS_DISABLED at publish time.
        try { if (!audio.enabled) await audio.setEnabled(true) } catch {}
        try { if (!video.enabled) await video.setEnabled(true) } catch {}
        await client.publish([audio, video])
        // enableDualStream removed: it doubles the encode workload (CPU) with
        // no benefit in a 2-person call. For N>2, Agora's SFU handles
        // adaptive bitrate without needing dual stream from the sender.

        setNetStatus("ok")

        // ── Warmup Azure Speech SDK in background (Correction 5) ─────────
        // Loads the SDK + fetches auth token while the user sees the video.
        // When user clicks "Traduire", recognition starts in < 100 ms.
        void getVE().then((ve) => ve.warmupSDK())

      } catch (err) {
        console.error("[ROOM INIT]", err)
        setNetStatus("error")
      } finally {
        isInitializing.current = false
      }
    }

    start()
    return () => {
      cancelled = true
      isInitializing.current = false
      void cleanup()
    }
  }, [roomId, cleanup, rejoin])

  // Re-inject local video track after Fast Refresh
  useEffect(() => {
    if (!localVideoTrack) return
    localVideoTrack.play("local-video-renderer")
  }, [localVideoTrack])

  // Background-tab reconnect: browsers throttle WS keepalives in hidden tabs
  useEffect(() => {
    const onVisible = () => {
      if (document.hidden || !clientRef.current) return
      if (clientRef.current.connectionState === "DISCONNECTED") {
        void rejoin(clientRef.current)
      }
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [rejoin])

  // ─── Interpreter track (TTS → Agora) ────────────────────────────────────────

  const publishInterpreter = useCallback(async () => {
    if (interpreterRef.current || !clientRef.current) return
    try {
      const ve     = await getVE()
      const stream = ve.getTTSMediaStream()
      const track  = stream.getAudioTracks()[0]
      if (!track) return
      const interpTrack = AgoraRTC.createCustomAudioTrack({ mediaStreamTrack: track })
      interpreterRef.current = interpTrack
      await clientRef.current.publish(interpTrack)
    } catch (err) {
      console.warn("[Interpreter]", err)
    }
  }, [])

  // ─── Subtitles ───────────────────────────────────────────────────────────────

  const showSubtitle = useCallback((lang: string, text: string, final: boolean) => {
    setSubtitle({ lang, text, final })
    if (subtitleTimer.current) clearTimeout(subtitleTimer.current)
    if (final) subtitleTimer.current = setTimeout(() => setSubtitle(null), 5000)
  }, [])

  // ─── Translation ─────────────────────────────────────────────────────────────

  const startTrans = useCallback(async (
    src: string, tgt: string, gender: VoiceGender
  ) => {
    const ve = await getVE()
    await publishInterpreter()
    await ve.startTranslation(
      src, [tgt],
      {
        onPartial: (lang, text) => showSubtitle(lang, text, false),
        onFinal:   (lang, text) => showSubtitle(lang, text, true),
        onError:   (err) => console.error("[VoiceEngine]", err),
      },
      tgt,
      gender,
      // Solo guard: 0 remote users → TTS skipped (no self-translation)
      () => remoteUsersRef.current.length,
      // Plan language whitelist — null means all allowed (enterprise)
      planCapsRef.current?.allowedLangs ?? null
    )
  }, [publishInterpreter, showSubtitle])

  const toggleTranslation = useCallback(async () => {
    if (isTranslating) {
      const ve = await getVE()
      await ve.stopTranslation()
      setIsTranslating(false)
      setSubtitle(null)
      return
    }
    try {
      await startTrans(sourceLang, targetLang, voiceGender)
      setIsTranslating(true)
    } catch (err) {
      console.error("[Translation start]", err)
    }
  }, [isTranslating, sourceLang, targetLang, voiceGender, startTrans])

  // Restart with guard when lang/gender changes mid-session
  useEffect(() => {
    if (!isTranslating) return
    const seq = ++restartSeq.current
    void (async () => {
      const ve = await getVE()
      await ve.stopTranslation()
      if (seq !== restartSeq.current) return
      try {
        await startTrans(sourceLang, targetLang, voiceGender)
      } catch (err) {
        if (seq !== restartSeq.current) return
        console.error("[Translation restart]", err)
        setIsTranslating(false)
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceLang, targetLang, voiceGender])

  // ─── Layout ──────────────────────────────────────────────────────────────────

  const total = 1 + remoteUsers.length

  // Responsive grid: 1 col on mobile, 2 on sm+, 3 on lg+ when ≥ 3 participants
  const gridCols =
    total === 1 ? "grid-cols-1"
    : total === 2 ? "grid-cols-1 sm:grid-cols-2"
    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col overflow-hidden">

      {/* ── Global video CSS — injected once, never re-created on re-render ──
           object-fit: contain  → full frame, no zoom, no crop
           will-change/translateZ → GPU layer per video element
           aspect-ratio         → tiles always 16:9 when alone
         ──────────────────────────────────────────────────────────────────── */}
      <style>{`
        .video-tile video,
        .video-tile-local video {
          width: 100%; height: 100%;
          object-fit: contain;
          background: #111;
          will-change: transform;
          transform: translateZ(0);
        }
        .video-tile-local video {
          transform: scaleX(-1) translateZ(0);
        }
      `}</style>

      {/* Network banner */}
      {netStatus !== "ok" && (
        <div className={`shrink-0 text-center text-xs py-1.5 font-medium tracking-wide ${
          netStatus === "reconnecting"
            ? "bg-amber-600/80 text-amber-100"
            : "bg-red-700/80 text-red-100"
        }`}>
          {netStatus === "reconnecting" ? "⟳ Reconnexion…" : "⚠ Connexion perdue"}
        </div>
      )}

      {/* ── Video grid ─────────────────────────────────────────────────────── */}
      <main className="flex-1 relative min-h-0 p-2">
        <div
          className={`grid ${gridCols} gap-2 h-full`}
          style={{ gridAutoRows: "1fr" }}
        >
          {/* Local tile */}
          <div className="video-tile-local relative bg-[#111] rounded-2xl overflow-hidden border border-white/8 min-h-0">
            <div id="local-video-renderer" className="absolute inset-0" />
            {!isCamOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
                <span className="text-6xl opacity-40">👤</span>
              </div>
            )}
            <span className="absolute bottom-2 left-3 text-xs text-white/35 z-10 select-none">Vous</span>
          </div>

          {/* Remote tiles */}
          {remoteUsers.map((user) => (
            <div
              key={user.uid}
              className="video-tile relative bg-[#111] rounded-2xl overflow-hidden border border-white/8 min-h-0"
            >
              <div id={`rv-${user.uid}`} className="absolute inset-0" />
              <span className="absolute bottom-2 left-3 text-xs text-white/35 z-10 select-none">
                #{String(user.uid).slice(-4)}
              </span>
            </div>
          ))}
        </div>

        {/* Subtitles */}
        {subtitle && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[75%] text-center pointer-events-none z-20">
            <div className={`inline-block px-5 py-2.5 rounded-2xl font-medium
              backdrop-blur-md shadow-xl transition-all duration-100 ${
              subtitle.final
                ? "bg-black/80 text-white text-base"
                : "bg-black/50 text-white/65 italic text-sm"
            }`}>
              {subtitle.text}
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="shrink-0 bg-[#0d0d0d] border-t border-white/5">
        <div className="text-center pt-2 pb-0.5 text-[9px] uppercase tracking-widest text-white/15 select-none">
          {roomId}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-2.5">

          {/* Mic */}
          <button
            title={isMicOn ? "Couper le micro" : "Activer le micro"}
            onClick={async () => {
              if (!tracksRef.current) return
              const next = !isMicOn
              await tracksRef.current.audio.setEnabled(next)
              setIsMicOn(next)
            }}
            className={`w-11 h-11 flex items-center justify-center rounded-xl text-lg transition-colors ${
              isMicOn ? "bg-zinc-800 hover:bg-zinc-700" : "bg-red-600 hover:bg-red-500 ring-2 ring-red-400/40"
            }`}
          >{isMicOn ? "🎙️" : "🔇"}</button>

          {/* Camera */}
          <button
            title={isCamOn ? "Couper la caméra" : "Activer la caméra"}
            onClick={async () => {
              if (!tracksRef.current) return
              const next = !isCamOn
              await tracksRef.current.video.setEnabled(next)
              setIsCamOn(next)
            }}
            className={`w-11 h-11 flex items-center justify-center rounded-xl text-lg transition-colors ${
              isCamOn ? "bg-zinc-800 hover:bg-zinc-700" : "bg-red-600 hover:bg-red-500 ring-2 ring-red-400/40"
            }`}
          >{isCamOn ? "📹" : "📷"}</button>

          <div className="w-px h-7 bg-white/10 mx-1 hidden sm:block" />

          <LanguageSelector title="Je parle"   value={sourceLang}  onChange={setSourceLang} />
          <LanguageSelector title="Traduit en" value={targetLang}  onChange={setTargetLang} />
          <VoiceSelector    value={voiceGender} onChange={setVoiceGender} />

          <div className="w-px h-7 bg-white/10 mx-1 hidden sm:block" />

          <button
            onClick={toggleTranslation}
            className={`h-11 px-5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
              isTranslating
                ? "bg-blue-600 hover:bg-blue-500 text-white ring-2 ring-blue-400/30"
                : "bg-zinc-800 hover:bg-zinc-700 text-white/75"
            }`}
          >{isTranslating ? "⏹ Arrêter" : "🌐 Traduire"}</button>

          <button
            onClick={() => { void cleanup(); window.location.href = "/" }}
            className="h-11 px-5 rounded-xl text-sm font-semibold bg-red-700 hover:bg-red-600 transition-colors whitespace-nowrap"
          >Quitter</button>

        </div>
      </footer>

    </div>
  )
}
