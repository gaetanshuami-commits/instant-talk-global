"use client"

import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react"
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ILocalAudioTrack,
  ILocalVideoTrack,
} from "agora-rtc-sdk-ng"
import dynamic from "next/dynamic"

// Silence Agora SDK internal logs completely — only actual errors surface.
// 4 = ERROR (0=DEBUG 1=INFO 2=WARN 3=ERROR 4=NONE in some builds; 4 suppresses all)
AgoraRTC.setLogLevel(4)

import LanguageSelector from "@/components/LanguageSelector"
import VoiceSelector    from "@/components/VoiceSelector"
import type { VoiceGender } from "@/core/voiceEngine"
import type { PlanCapabilities } from "@/lib/planCapabilities"

const AICompanion = dynamic(() => import("@/components/AICompanion"), { ssr: false })
const Whiteboard  = dynamic(() => import("@/components/Whiteboard"),  { ssr: false })

// ─── Lazy voiceEngine — SDK loaded at room join (warmup), not at mount ────────
type VoiceEngineModule = typeof import("@/core/voiceEngine")
let _ve: VoiceEngineModule | null = null
async function getVE(): Promise<VoiceEngineModule> {
  if (!_ve) _ve = await import("@/core/voiceEngine")
  return _ve
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RoomClient({ roomId }: { roomId: string }) {
  const [isMicOn, setIsMicOn]             = useState(true)
  const [isCamOn, setIsCamOn]             = useState(true)
  const [sourceLang, setSourceLang]       = useState("fr")
  const [targetLang, setTargetLang]       = useState("en")
  const [voiceGender, setVoiceGender]     = useState<VoiceGender>("female")
  const [isTranslating, setIsTranslating] = useState(false)
  const [remoteUsers, setRemoteUsers]     = useState<IAgoraRTCRemoteUser[]>([])
  const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | null>(null)
  const [netStatus, setNetStatus]         = useState<"ok" | "reconnecting" | "error">("ok")

  // ── New feature state ──────────────────────────────────────────────────────
  const [isScreenSharing, setIsScreenSharing]   = useState(false)
  const [showWhiteboard,  setShowWhiteboard]    = useState(false)
  const [showAICompanion, setShowAICompanion]   = useState(false)
  const [isANS,           setIsANS]             = useState(false)
  const [ttsProvider,     setTtsProvider]       = useState<"elevenlabs" | "azure">("elevenlabs")
  const [transcript,      setTranscript]        = useState<string[]>([])
  const [cloneStatus, setCloneStatus]           = useState<"idle"|"recording"|"cloning"|"ready"|"error">("idle")
  const [translationError, setTranslationError] = useState<string | null>(null)
  const [isFallbackActive, setIsFallbackActive] = useState(false)
  const [isJoining,       setIsJoining]         = useState(true)
  const [joinError,       setJoinError]         = useState<string | null>(null)
  const [transStep,       setTransStep]         = useState<string | null>(null)
  const screenTrackRef   = useRef<ILocalVideoTrack | null>(null)
  const cloneVoiceIdRef  = useRef<string | null>(null)
  const cloneRecorderRef = useRef<MediaRecorder | null>(null)

  const clientRef      = useRef<IAgoraRTCClient | null>(null)
  const tracksRef      = useRef<{ audio: ILocalAudioTrack; video: ILocalVideoTrack } | null>(null)
  const interpreterRef = useRef<ILocalAudioTrack | null>(null)
  const isInitializing = useRef(false)
  const subtitleRef    = useRef<SubtitleOverlayHandle | null>(null)
  const remoteUsersRef = useRef<IAgoraRTCRemoteUser[]>([])
  const restartSeq     = useRef(0)
  const agoraTokenRef  = useRef<string>("")
  const agoraUidRef    = useRef<number | null>(null)

  // Tab-unique session ID — prevents two tabs sharing the same customerRef
  // from getting the same Agora UID and conflicting in the same channel.
  const sessionIdRef = useRef<string>(
    typeof sessionStorage !== "undefined"
      ? (() => {
          const key = "itg_sid"
          const existing = sessionStorage.getItem(key)
          if (existing) return existing
          const id = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
          sessionStorage.setItem(key, id)
          return id
        })()
      : Math.random().toString(36).slice(2)
  )
  // Plan capabilities returned by /api/agora-token — used for language + participant limits
  const planCapsRef    = useRef<PlanCapabilities | null>(null)
  // Ref to latest startTrans — lets the join effect call it without TDZ / stale-closure issues
  // (startTrans is declared after the join useEffect due to dependency ordering in the file).
  const startTransRef  = useRef<((src: string, tgt: string, gender: VoiceGender) => Promise<void>) | null>(null)

  // Keep a live ref to remote users for voiceEngine callback (no stale closure)
  useEffect(() => { remoteUsersRef.current = remoteUsers }, [remoteUsers])

  // Live ref for isTranslating — lets the restart useEffect read the current value
  // even though isTranslating is intentionally excluded from its deps.
  const isTranslatingRef = useRef(isTranslating)
  useEffect(() => { isTranslatingRef.current = isTranslating }, [isTranslating])

  // ── Mount-time SDK warmup ─────────────────────────────────────────────────────
  // Pre-loads the Azure Speech SDK bundle (~200 kB) and fetches the Azure token
  // in parallel with the Agora join sequence so that the first startTranslation()
  // call has no extra latency (SDK + token are already cached).
  useEffect(() => {
    void getVE().then(ve => {
      ve.warmupSDK()
      ve.setTTSProvider("elevenlabs")
    })
  }, [])

  // ─── Cleanup ────────────────────────────────────────────────────────────────

  const cleanup = useCallback(async () => {
    if (_ve) {
      await _ve.stopTranslation().catch(() => {})
      _ve.setClonedVoiceId(null)
      _ve.closeAudioContext()  // release AudioContext so next room join gets a fresh one
    }

    // Stop recording if in progress
    if (cloneRecorderRef.current?.state === "recording") {
      try { cloneRecorderRef.current.stop() } catch {}
    }
    cloneRecorderRef.current = null

    // Delete the cloned voice from ElevenLabs to free the slot
    if (cloneVoiceIdRef.current) {
      fetch(`/api/clone-voice/${cloneVoiceIdRef.current}`, { method: "DELETE", keepalive: true }).catch(() => {})
      cloneVoiceIdRef.current = null
    }

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

    // Free the RoomSlot immediately — channel in URL so no body parsing needed
    const leaveUrl = `/api/room-leave?channel=${encodeURIComponent(roomId)}&sid=${sessionIdRef.current}`
    const beaconSent = typeof navigator !== "undefined" && navigator.sendBeacon(leaveUrl)
    if (!beaconSent) {
      fetch(leaveUrl, { method: "POST", keepalive: true }).catch(() => {})
    }
  }, [roomId])

  // ─── Manual rejoin after SDK gives up ───────────────────────────────────────

  // ─── Restore video display + remote subscriptions after any reconnect ────────
  // Called after both automatic reconnect (RECONNECTING → CONNECTED) and manual
  // rejoin. Agora's SDK does NOT re-inject the local video element after reconnect,
  // and may or may not re-fire user-published for remote users depending on version.

  const restoreAfterReconnect = useCallback(async (client: IAgoraRTCClient) => {
    // 1. Re-play local video — the Agora video element inside local-video-renderer
    //    loses its srcObject binding during reconnect; re-calling play() restores it.
    if (tracksRef.current?.video) {
      try { tracksRef.current.video.play("local-video-renderer") } catch {}
    }

    // 2. Re-subscribe to every remote user currently reported by the SDK.
    //    user-published may not re-fire for users who were already subscribed
    //    before the disconnect — so we explicitly re-subscribe each one.
    for (const user of client.remoteUsers) {
      if (user.hasVideo) {
        try { await client.subscribe(user, "video") } catch {}
      }
      if (user.hasAudio) {
        try { await client.subscribe(user, "audio") } catch {}
        try { user.audioTrack?.play() } catch {}
      }
    }

    // 3. Sync React state: replace stale list with SDK's ground truth.
    //    This re-creates tiles for users whose user-unpublished fired during disconnect.
    const currentVideoUsers = client.remoteUsers.filter(u => u.hasVideo)
    setRemoteUsers(currentVideoUsers)

    // 4. Play each remote video — rAF retry waits for React to render new tiles.
    for (const user of currentVideoUsers) {
      const uid   = user.uid
      const track = user.videoTrack
      let n = 0
      const go = () => {
        if (document.getElementById(`rv-${uid}`)) {
          try { track?.play(`rv-${uid}`) } catch {}
        } else if (n++ < 40) requestAnimationFrame(go)
      }
      requestAnimationFrame(go)
    }
  }, [])

  const rejoin = useCallback(async (client: IAgoraRTCClient) => {
    if (!agoraTokenRef.current) return
    // Agora's own reconnect may have already restored the connection — skip if so.
    if (client.connectionState !== "DISCONNECTED") return
    setNetStatus("reconnecting")
    try {
      await client.join(
        process.env.NEXT_PUBLIC_AGORA_APP_ID!,
        roomId,
        agoraTokenRef.current,
        agoraUidRef.current
      )
      if (tracksRef.current) {
        // Tracks are left disabled after a disconnect — must re-enable before publish.
        try { if (!tracksRef.current.audio.enabled) await tracksRef.current.audio.setEnabled(true) } catch {}
        try { if (!tracksRef.current.video.enabled) await tracksRef.current.video.setEnabled(true) } catch {}
        await client.publish([tracksRef.current.audio, tracksRef.current.video])
      }
      if (interpreterRef.current) {
        try { if (!interpreterRef.current.enabled) await interpreterRef.current.setEnabled(true) } catch {}
        await client.publish(interpreterRef.current)
      }
      setNetStatus("ok")
      // Restore video display and remote subscriptions after manual rejoin
      void restoreAfterReconnect(client)
    } catch (err) {
      console.error("[REJOIN]", err)
      setNetStatus("error")
    }
  }, [roomId, restoreAfterReconnect])

  // ─── Agora init ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isInitializing.current) return
    isInitializing.current = true
    let cancelled = false

    const start = async () => {
      try {
        setIsJoining(true)
        setJoinError(null)

        // ── Camera and token fetch in parallel ────────────────────────────
        // KEY FIX: camera result triggers setLocalVideoTrack() the moment the
        // device grants access — BEFORE the token fetch (2 DB queries) completes.
        // This eliminates the black screen that lasted as long as the DB took.
        setTransStep("Accès caméra…")

        const cameraPromise = AgoraRTC.createMicrophoneAndCameraTracks(
          { AEC: true, AGC: true, encoderConfig: { sampleRate: 16000, stereo: false, bitrate: 40 } },
          { optimizationMode: "motion", encoderConfig: { width: { min: 640, ideal: 1280 }, height: { min: 360, ideal: 720 }, frameRate: { min: 15, ideal: 30 }, bitrateMin: 200, bitrateMax: 1000 } }
        ).catch(err => {
          console.error("[Camera/Mic init]", err)
          return null  // camera failure is recoverable; channel join can still proceed
        })

        const tokenPromise = fetch(`/api/agora-token?channel=${encodeURIComponent(roomId)}&sid=${sessionIdRef.current}`)
          .then(async r => ({ ok: r.ok, data: await r.json() }))

        // Show camera as soon as the device is ready — does NOT wait for the token.
        void cameraPromise.then(tracks => {
          if (cancelled || !tracks) return
          const [audio, video] = tracks
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          try { (video as any).setOptimizationMode?.("motion") } catch {}
          tracksRef.current = { audio, video }
          setLocalVideoTrack(video)
          setTransStep("Connexion…")

          // Track-ended recovery (USB disconnect / OS device revoke)
          video.on("track-ended", () => {
            void (async () => {
              try {
                const nv = await AgoraRTC.createCameraVideoTrack({ optimizationMode: "motion", encoderConfig: { width: { min: 640, ideal: 1280 }, height: { min: 360, ideal: 720 }, frameRate: { min: 15, ideal: 30 }, bitrateMin: 200, bitrateMax: 1000 } })
                if (!tracksRef.current || !clientRef.current) { nv.close(); return }
                try { await clientRef.current.unpublish(tracksRef.current.video) } catch {}
                try { tracksRef.current.video.close() } catch {}
                tracksRef.current = { ...tracksRef.current, video: nv }
                setLocalVideoTrack(nv)
                if (clientRef.current.connectionState === "CONNECTED") await clientRef.current.publish(nv)
              } catch (e) { console.warn("[CAMERA RECOVERY]", e) }
            })()
          })
          audio.on("track-ended", () => {
            void (async () => {
              try {
                const na = await AgoraRTC.createMicrophoneAudioTrack({ AEC: true, AGC: true, encoderConfig: { sampleRate: 16000, stereo: false, bitrate: 40 } })
                if (!tracksRef.current || !clientRef.current) { na.close(); return }
                try { await clientRef.current.unpublish(tracksRef.current.audio) } catch {}
                try { tracksRef.current.audio.close() } catch {}
                tracksRef.current = { ...tracksRef.current, audio: na }
                if (clientRef.current.connectionState === "CONNECTED") await clientRef.current.publish(na)
              } catch (e) { console.warn("[MIC RECOVERY]", e) }
            })()
          })
        })

        // Wait for both before joining the channel
        const [tracksResult, tokenResult] = await Promise.all([cameraPromise, tokenPromise])

        if (cancelled) {
          if (tracksResult) { try { tracksResult[0].close() } catch {} ; try { tracksResult[1].close() } catch {} }
          return
        }

        // ── Token validation ──────────────────────────────────────────────
        const { ok, data } = tokenResult
        if (!ok) {
          const reason = data.code === "ROOM_FULL"
            ? `Salle complète (max ${data.maxParticipants} participants).`
            : (data.error || "Accès refusé. Vérifiez votre abonnement.")
          setJoinError(reason)
          setNetStatus("error")
          setIsJoining(false)
          setTransStep(null)
          return
        }

        agoraTokenRef.current = data.token
        agoraUidRef.current   = data.uid
        if (data.caps) planCapsRef.current = data.caps

        // ── Agora client + events ─────────────────────────────────────────
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "h264" })
        clientRef.current = client

        if (cancelled) return

        client.on("user-published", async (user, mediaType) => {
          if (client.connectionState !== "CONNECTED") return
          try { await client.subscribe(user, mediaType) } catch { return }
          if (mediaType === "video") {
            try { client.setStreamFallbackOption(user.uid, 2 as Parameters<typeof client.setStreamFallbackOption>[1]) } catch {}
            setRemoteUsers(prev => prev.find(u => u.uid === user.uid) ? prev : [...prev, user])
            let n = 0
            const go = () => {
              if (document.getElementById(`rv-${user.uid}`)) { try { user.videoTrack?.play(`rv-${user.uid}`) } catch {} }
              else if (n++ < 40) requestAnimationFrame(go)
            }
            requestAnimationFrame(go)
          }
          if (mediaType === "audio") { try { user.audioTrack?.play() } catch {} }
        })
        client.on("user-unpublished", (user, mediaType) => {
          if (mediaType === "video") setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid))
        })
        client.on("user-left", (user) => {
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid))
        })
        client.on("connection-state-change", (cur, prev) => {
          if (cur === "RECONNECTING") setNetStatus("reconnecting")
          else if (cur === "CONNECTED") {
            setNetStatus("ok")
            if (prev === "RECONNECTING") void restoreAfterReconnect(client)
          } else if (cur === "DISCONNECTED" && !cancelled) {
            setTimeout(() => { if (!cancelled && clientRef.current === client) void rejoin(client) }, 3000)
          }
        })
        client.on("exception", (evt) => {
          if (evt.code === 1005 && evt.uid != null && client.connectionState === "CONNECTED") {
            const bad = client.remoteUsers.find(u => u.uid === evt.uid)
            if (bad?.hasVideo) {
              void (async () => {
                try {
                  await client.unsubscribe(bad, "video")
                  await new Promise<void>(r => setTimeout(r, 500))
                  if (client.connectionState !== "CONNECTED") return
                  await client.subscribe(bad, "video")
                  bad.videoTrack?.play(`rv-${bad.uid}`)
                } catch {}
              })()
            }
          }
        })
        client.on("network-quality", () => { /* silent telemetry */ })
        client.on("token-privilege-will-expire", () => {
          void (async () => {
            try {
              const r2 = await fetch(`/api/agora-token?channel=${encodeURIComponent(roomId)}&sid=${sessionIdRef.current}`)
              const d2 = await r2.json()
              if (d2.token) { agoraTokenRef.current = d2.token; await client.renewToken(d2.token) }
            } catch (e) { console.warn("[TOKEN RENEWAL]", e) }
          })()
        })

        // ── Join + publish ────────────────────────────────────────────────
        await client.join(process.env.NEXT_PUBLIC_AGORA_APP_ID!, roomId, data.token, data.uid)

        if (tracksResult) {
          const [audio, video] = tracksResult
          try { if (!audio.enabled) await audio.setEnabled(true) } catch {}
          try { if (!video.enabled) await video.setEnabled(true) } catch {}
          await client.publish([audio, video])
        }

        setIsJoining(false)
        setTransStep(null)
        setNetStatus("ok")

        // ── Background tasks ──────────────────────────────────────────────
        void startVoiceClone()

        // ── Auto-start translation ────────────────────────────────────────
        // SDK is already pre-warmed (warmupSDK() ran at mount), so Azure STT
        // connects in < 300 ms. Translation starts automatically — no button click needed.
        // startTransRef holds the latest startTrans callback (set just below its declaration).
        if (startTransRef.current) {
          try {
            setTranslationError(null)
            setTransStep("Démarrage traduction…")
            await startTransRef.current(sourceLang, targetLang, voiceGender)
            setIsTranslating(true)
          } catch (err) {
            // Surface errors so the user knows what's wrong.
            // Normalize cryptic Azure/provider messages into user-readable text.
            const raw = err instanceof Error ? err.message : String(err)
            let msg = raw
            if (/azure speech token|speech token|speech key/i.test(raw)) {
              msg = "Clé Azure Speech invalide ou region incorrecte — vérifiez AZURE_SPEECH_KEY et AZURE_SPEECH_REGION."
            } else if (/missing azure|missing.*key/i.test(raw)) {
              msg = "Clé Azure Speech manquante dans la configuration serveur."
            } else if (raw.length > 90) {
              msg = raw.slice(0, 90) + "…"
            }
            setTranslationError(msg)
          } finally {
            setTransStep(null)
          }
        }

      } catch (err) {
        console.error("[ROOM INIT]", err)
        setNetStatus("error")
        setIsJoining(false)
        setTransStep(null)
        setJoinError("Impossible de rejoindre la salle. Vérifiez votre connexion.")
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
  }, [roomId, cleanup, rejoin, restoreAfterReconnect])

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

  // Subtitle updates are pushed imperatively to SubtitleOverlay so that
  // partial results (every ~300 ms) don't re-render the video grid at all.
  const showSubtitle = useCallback((lang: string, text: string, final: boolean) => {
    subtitleRef.current?.show(lang, text, final)
    if (final) {
      // Accumulate transcript for AI Companion (last 120 lines)
      setTranscript(prev => [...prev, `[${lang.toUpperCase()}] ${text}`].slice(-120))
    }
  }, [])

  // ── Screen share ────────────────────────────────────────────────────────────
  const toggleScreenShare = useCallback(async () => {
    if (!clientRef.current) return
    if (isScreenSharing) {
      if (screenTrackRef.current) {
        try { await clientRef.current.unpublish(screenTrackRef.current) } catch {}
        try { screenTrackRef.current.close() } catch {}
        screenTrackRef.current = null
      }
      // Re-publish camera
      if (tracksRef.current?.video) {
        try { await clientRef.current.publish(tracksRef.current.video) } catch {}
      }
      setIsScreenSharing(false)
    } else {
      try {
        const track = await AgoraRTC.createScreenVideoTrack(
          { encoderConfig: { width: 1920, height: 1080, frameRate: 15, bitrateMin: 600, bitrateMax: 1500 } },
          "disable"
        ) as ILocalVideoTrack
        if (tracksRef.current?.video) {
          try { await clientRef.current.unpublish(tracksRef.current.video) } catch {}
        }
        await clientRef.current.publish(track)
        screenTrackRef.current = track
        setIsScreenSharing(true)
        // Auto-stop when user dismisses native browser dialog
        track.on("track-ended", () => {
          void toggleScreenShare()
        })
      } catch (err) {
        console.warn("[ScreenShare]", err)
      }
    }
  }, [isScreenSharing])

  // ── Smart Audio (ANS toggle) — recreate mic track ────────────────────────────
  const toggleANS = useCallback(async () => {
    if (!clientRef.current || !tracksRef.current) return
    const next = !isANS
    try {
      // Unpublish current audio
      await clientRef.current.unpublish(tracksRef.current.audio)
      tracksRef.current.audio.stop()
      tracksRef.current.audio.close()
      // Recreate with ANS setting — same 16 kHz / 40 kbps encoder as main init
      const audio = await AgoraRTC.createMicrophoneAudioTrack({
        AEC: true, AGC: true, ANS: next,
        encoderConfig: { sampleRate: 16000, stereo: false, bitrate: 40 },
      })
      tracksRef.current = { ...tracksRef.current, audio }
      if (!audio.enabled) await audio.setEnabled(true)
      await clientRef.current.publish(audio)
      setIsANS(next)
    } catch (err) {
      console.warn("[SmartAudio]", err)
    }
  }, [isANS])

  // ─── TTS provider toggle ─────────────────────────────────────────────────────

  const toggleTTSProvider = useCallback(async () => {
    const next = ttsProvider === "elevenlabs" ? "azure" : "elevenlabs"
    setTtsProvider(next)
    if (_ve) _ve.setTTSProvider(next)
  }, [ttsProvider])

  // ─── Voice cloning — silent 60s capture after room join ─────────────────────

  const startVoiceClone = useCallback(async () => {
    // Only one clone session per room join; skip if already running or done
    if (cloneStatus !== "idle") return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 44100, echoCancellation: true, noiseSuppression: true },
      })

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm"

      const chunks: Blob[] = []
      const recorder = new MediaRecorder(stream, { mimeType })
      cloneRecorderRef.current = recorder

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        cloneRecorderRef.current = null

        const blob = new Blob(chunks, { type: mimeType })
        if (blob.size < 50_000) { setCloneStatus("error"); return }

        try {
          setCloneStatus("cloning")
          const body = new FormData()
          body.append("audio", blob, "voice_sample.webm")

          const res  = await fetch("/api/clone-voice", { method: "POST", body })
          const data = await res.json()
          if (!res.ok || !data.voiceId) throw new Error("No voiceId")

          cloneVoiceIdRef.current = data.voiceId
          const ve = await getVE()
          ve.setClonedVoiceId(data.voiceId)
          setCloneStatus("ready")
        } catch {
          setCloneStatus("error")
        }
      }

      setCloneStatus("recording")
      recorder.start(1000) // collect chunks every 1s
      setTimeout(() => {
        if (recorder.state === "recording") recorder.stop()
      }, 60_000)

    } catch {
      // getUserMedia denied or browser limitation — non-fatal
      setCloneStatus("idle")
    }
  }, [cloneStatus])

  // ─── Translation ─────────────────────────────────────────────────────────────

  const startTrans = useCallback(async (
    src: string, tgt: string, gender: VoiceGender
  ) => {
    const ve = await getVE()
    // Pre-resume AudioContext so first TTS plays without the suspended-context delay.
    void ve.warmAudioContext()
    await publishInterpreter()
    setTranslationError(null)
    setIsFallbackActive(false)   // reset before each (re)start — cleared if Azure succeeds
    await ve.startTranslation(
      src, [tgt],
      {
        onPartial:  (lang, text) => showSubtitle(lang, text, false),
        onFinal:    (lang, text) => showSubtitle(lang, text, true),
        onFallback: () => setIsFallbackActive(true),
        onError:   (err) => {
          console.error("[VoiceEngine]", err)
          // Auth errors are fatal and must be surfaced to the user.
          // Quota-exceeded errors are handled transparently by the Web Speech API
          // fallback inside voiceEngine — only surface them if the fallback also fails.
          const isAuthFatal = /authentication error|authentication failed|auth:|401|403|unauthorized/i.test(err)
          const isQuotaFinal = /quota exceeded.*chrome not available|browser stt.*not available/i.test(err)
          if (isAuthFatal || isQuotaFinal) {
            setIsTranslating(false)
            subtitleRef.current?.reset()
            setTranslationError(
              isAuthFatal
                ? "Erreur d'authentification Azure. Vérifiez vos clés API."
                : "Quota Azure dépassé et navigateur STT indisponible. Réessayez avec Chrome."
            )
          }
        },
      },
      tgt,
      gender,
      () => remoteUsersRef.current.length,
      // Dev: bypass plan restriction client-side too (planCapsRef may be stale after HMR)
      process.env.NODE_ENV === "development" ? null : (planCapsRef.current?.allowedLangs ?? null)
    )
  }, [publishInterpreter, showSubtitle])
  // Keep ref current — allows the join useEffect to call startTrans without TDZ issue
  startTransRef.current = startTrans

  const toggleTranslation = useCallback(async () => {
    if (isTranslating) {
      const ve = await getVE()
      await ve.stopTranslation()
      setIsTranslating(false)
      setTranslationError(null)
      setIsFallbackActive(false)
      subtitleRef.current?.reset()
      return
    }
    try {
      setTranslationError(null)
      await startTrans(sourceLang, targetLang, voiceGender)
      setIsTranslating(true)
    } catch (err) {
      console.error("[Translation start]", err)
      setTranslationError("Impossible de démarrer la traduction. Vérifiez le micro et les clés Azure.")
    }
  }, [isTranslating, sourceLang, targetLang, voiceGender, startTrans])

  // Restart with guard when lang/gender changes mid-session.
  // 600 ms debounce: prevents rapid language-switch from hammering Azure STT
  // with back-to-back WebSocket opens that trigger rate-limit quota errors.
  // Uses isTranslatingRef (not the closed-over isTranslating) so that a Stop()
  // during the 600 ms window is correctly honoured — fixes "button non fonctionnel".
  useEffect(() => {
    if (!isTranslatingRef.current) return
    const seq = ++restartSeq.current
    const t = setTimeout(async () => {
      if (seq !== restartSeq.current) return
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
    }, 600)
    return () => clearTimeout(t)
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

            {/* Join progress overlay — shows transStep or joinError while connecting */}
            {(isJoining || joinError) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20 gap-2">
                {joinError ? (
                  <span className="text-xs font-semibold text-red-400 text-center px-4">{joinError}</span>
                ) : (
                  <>
                    <svg className="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 24, height: 24, opacity: 0.6 }}>
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                    </svg>
                    {transStep && <span className="text-[11px] text-white/60 font-medium">{transStep}</span>}
                  </>
                )}
              </div>
            )}

            {isScreenSharing && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/60 z-10 pointer-events-none">
                <span className="text-xs text-white/50 bg-black/60 px-3 py-1.5 rounded-full">Partage d&apos;ecran actif</span>
              </div>
            )}
            {!isCamOn && !isScreenSharing && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl font-black shadow-lg">V</div>
              </div>
            )}
            {/* Name tag */}
            <div className="absolute bottom-0 left-0 right-0 z-10 px-3 py-2" style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.75) 0%, transparent 100%)" }}>
              <span className="text-xs font-bold text-white/90">Vous</span>
              {isANS && <span className="ml-2 text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded-full font-semibold">Filtre actif</span>}
            </div>
          </div>

          {/* Remote tiles */}
          {remoteUsers.map((user) => (
            <div
              key={user.uid}
              className="video-tile relative bg-[#111] rounded-2xl overflow-hidden border border-white/8 min-h-0"
            >
              <div id={`rv-${user.uid}`} className="absolute inset-0" />
              {/* Name tag */}
              <div className="absolute bottom-0 left-0 right-0 z-10 px-3 py-2" style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.75) 0%, transparent 100%)" }}>
                <span className="text-xs font-bold text-white/90">Participant</span>
                <span className="ml-2 text-[10px] text-white/40">#{String(user.uid).slice(-4)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Subtitles — isolated component; updates don't re-render the video grid */}
        <SubtitleOverlay ref={subtitleRef} />

        {/* AI Companion panel */}
        {showAICompanion && (
          <AICompanion
            transcript={transcript}
            defaultLang={targetLang}
            onClose={() => setShowAICompanion(false)}
          />
        )}

        {/* Whiteboard overlay */}
        {showWhiteboard && (
          <Whiteboard roomId={roomId} onClose={() => setShowWhiteboard(false)} />
        )}
      </main>

      {/* ── Control Bar ────────────────────────────────────────────────────── */}
      <footer className="shrink-0 select-none" style={{ background: "rgba(6,6,10,0.98)", borderTop: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>

        {/* Fallback mode banner */}
        {isFallbackActive && isTranslating && (
          <div className="flex items-center justify-between gap-2 px-4 py-1 bg-amber-700/50 text-amber-200 text-xs font-medium">
            <span>⚡ Mode fallback actif — reconnaissance vocale navigateur (Azure indisponible)</span>
          </div>
        )}

        {/* Translation error banner */}
        {translationError && (
          <div className="flex items-center justify-between gap-2 px-4 py-1.5 bg-red-900/60 text-red-200 text-xs font-medium">
            <span>⚠ {translationError}</span>
            <button onClick={() => setTranslationError(null)} className="text-red-300 hover:text-white shrink-0">✕</button>
          </div>
        )}

        {/* Room ID micro-label */}
        <div className="text-center pt-1" style={{ fontSize: "9px", letterSpacing: "0.18em", opacity: 0.18, fontWeight: 600, textTransform: "uppercase" }}>
          {roomId}
        </div>

        {/* ── MOBILE layout (< sm): stacked rows ─────────────────────────── */}
        <div className="flex sm:hidden flex-col gap-1 px-3 py-2">

          {/* Row 1: Translation controls — centered, full width */}
          <div className="flex items-center justify-center gap-2 rounded-2xl py-1.5 px-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <LanguageSelector title="Je parle"   value={sourceLang}  onChange={setSourceLang} compact />
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 12, height: 12, opacity: 0.3, flexShrink: 0 }}><path strokeLinecap="round" d="M2 8h12M10 4l4 4-4 4"/></svg>
            <LanguageSelector title="Traduit en" value={targetLang}  onChange={setTargetLang} compact />
            <VoiceSelector value={voiceGender} onChange={setVoiceGender} compact />
            <button
              onClick={toggleTranslation}
              disabled={isJoining}
              style={{
                height: 32, padding: "0 12px", borderRadius: "10px", border: 0,
                background: isJoining
                  ? "rgba(255,255,255,0.12)"
                  : isTranslating
                  ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                  : "linear-gradient(135deg, #6366f1, #7c3aed)",
                color: isJoining ? "rgba(255,255,255,0.3)" : "white",
                fontWeight: 700, fontSize: "12px",
                cursor: isJoining ? "not-allowed" : "pointer",
                whiteSpace: "nowrap", flexShrink: 0,
                boxShadow: isJoining ? "none" : isTranslating ? "0 3px 10px rgba(37,99,235,0.45)" : "0 3px 10px rgba(99,102,241,0.45)",
              }}
            >
              {isJoining ? "…" : isTranslating ? "Stop" : "Traduire"}
            </button>
          </div>

          {/* Row 2: Media controls */}
          <div className="flex items-center justify-between gap-1">
            {/* Left cluster: essential media controls */}
            <div className="flex gap-1 flex-wrap">
              <CtrlBtn label={isMicOn ? "Micro" : "Micro off"} active={!isMicOn} activeColor="#dc2626"
                onClick={async () => { if (!tracksRef.current) return; const n = !isMicOn; await tracksRef.current.audio.setEnabled(n); setIsMicOn(n) }}
                icon={isMicOn
                  ? <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}><path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4zm-3.25 7.5a.75.75 0 01.75.75A5.5 5.5 0 0010 17.75a5.5 5.5 0 005.5-5.5.75.75 0 011.5 0A7 7 0 0110 19.25a7 7 0 01-7-7 .75.75 0 01.75-.75z"/></svg>
                  : <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16, color: "#fca5a5" }}><path d="M5.293 1.293a1 1 0 011.414 0l8 8a1 1 0 010 1.414l-8 8a1 1 0 01-1.414-1.414L12.586 10 5.293 2.707a1 1 0 010-1.414z"/></svg>}
                small
              />
              <CtrlBtn label={isCamOn ? "Cam" : "Cam off"} active={!isCamOn} activeColor="#dc2626"
                onClick={async () => { if (!tracksRef.current) return; const n = !isCamOn; await tracksRef.current.video.setEnabled(n); setIsCamOn(n) }}
                icon={isCamOn
                  ? <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}><path d="M3.5 7A1.5 1.5 0 002 8.5v5A1.5 1.5 0 003.5 15h8A1.5 1.5 0 0013 13.5v-1.3l2.15 1.43A.75.75 0 0016.5 13V9a.75.75 0 00-1.35-.45L13 9.9V8.5A1.5 1.5 0 0011.5 7h-8z"/></svg>
                  : <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16, color: "#fca5a5" }}><path fillRule="evenodd" d="M4.28 3.22a.75.75 0 00-1.06 1.06l.19.19C3.15 4.7 3 5.09 3 5.5v7A2.5 2.5 0 005.5 15h7c.41 0 .8-.15 1.09-.41l1.12 1.12a.75.75 0 101.06-1.06L4.28 3.22zm3.53 8.66l5.79 5.79A2.5 2.5 0 0015 14.5v-7c0-.5-.19-.97-.5-1.32l-6.69 6.7z" clipRule="evenodd"/></svg>}
                small
              />
              <CtrlBtn label={isScreenSharing ? "Écran✓" : "Écran"} active={isScreenSharing} activeColor="#0891b2"
                onClick={() => void toggleScreenShare()}
                icon={<svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}><path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0v7.5c0 .414.336.75.75.75h11.5a.75.75 0 00.75-.75v-7.5a.75.75 0 00-.75-.75H4.25a.75.75 0 00-.75.75z" clipRule="evenodd"/></svg>}
                small
              />
              <CtrlBtn label={isANS ? "Filtre✓" : "Filtre"} active={isANS} activeColor="#15803d"
                onClick={() => void toggleANS()}
                icon={<svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}><path d="M10.5 3.75a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5zM14.78 5.72a.75.75 0 00-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zm1.47 3.53a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5h1.5zm-3.78 5.06a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 00-1.06 1.06l1.06 1.06zm-6.5-1.06a.75.75 0 00-1.06 1.06l1.06 1.06a.75.75 0 001.06-1.06l-1.06-1.06zM4.75 10a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5h1.5zm1.47-5.28a.75.75 0 00-1.06 1.06l1.06 1.06a.75.75 0 001.06-1.06L6.22 4.72zM10 6.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z"/></svg>}
                small
              />
            </div>

            {/* Right cluster: tools + quit */}
            <div className="flex gap-1 items-center">
              <CtrlBtn label="Board" active={showWhiteboard} activeColor="#7c3aed"
                onClick={() => setShowWhiteboard(!showWhiteboard)}
                icon={<svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}><path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H4zm0 2h12v8H4V7z" clipRule="evenodd"/><path d="M7 9.5a.5.5 0 01.5-.5h5a.5.5 0 010 1h-5a.5.5 0 01-.5-.5zm0 2a.5.5 0 01.5-.5h3a.5.5 0 010 1h-3a.5.5 0 01-.5-.5z"/></svg>}
                small
              />
              <CtrlBtn label="IA" active={showAICompanion} activeColor="#4f46e5"
                onClick={() => setShowAICompanion(!showAICompanion)}
                icon={<svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}><path d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z"/></svg>}
                small
              />
              <button
                onClick={() => { void cleanup(); window.location.href = "/" }}
                style={{ height: 32, padding: "0 10px", borderRadius: "9px", border: "1px solid rgba(220,38,38,0.3)", background: "rgba(220,38,38,0.18)", color: "#fca5a5", fontWeight: 700, fontSize: "11px", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                Quitter
              </button>
            </div>
          </div>
        </div>

        {/* ── DESKTOP layout (≥ sm): three-column row ─────────────────────── */}
        <div className="hidden sm:grid" style={{ gridTemplateColumns: "1fr auto 1fr", alignItems: "center", padding: "8px 20px 12px", gap: "12px" }}>

          {/* LEFT — Media controls */}
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-start" }}>
            <CtrlBtn
              label={isMicOn ? "Micro" : "Micro off"} active={!isMicOn} activeColor="#dc2626"
              onClick={async () => { if (!tracksRef.current) return; const n = !isMicOn; await tracksRef.current.audio.setEnabled(n); setIsMicOn(n) }}
              icon={isMicOn
                ? <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18 }}><path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4zm-3.25 7.5a.75.75 0 01.75.75A5.5 5.5 0 0010 17.75a5.5 5.5 0 005.5-5.5.75.75 0 011.5 0A7 7 0 0110 19.25a7 7 0 01-7-7 .75.75 0 01.75-.75z"/></svg>
                : <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18, color: "#fca5a5" }}><path d="M5.293 1.293a1 1 0 011.414 0l8 8a1 1 0 010 1.414l-8 8a1 1 0 01-1.414-1.414L12.586 10 5.293 2.707a1 1 0 010-1.414z"/></svg>}
            />
            <CtrlBtn
              label={isCamOn ? "Camera" : "Camera off"} active={!isCamOn} activeColor="#dc2626"
              onClick={async () => { if (!tracksRef.current) return; const n = !isCamOn; await tracksRef.current.video.setEnabled(n); setIsCamOn(n) }}
              icon={isCamOn
                ? <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18 }}><path d="M3.5 7A1.5 1.5 0 002 8.5v5A1.5 1.5 0 003.5 15h8A1.5 1.5 0 0013 13.5v-1.3l2.15 1.43A.75.75 0 0016.5 13V9a.75.75 0 00-1.35-.45L13 9.9V8.5A1.5 1.5 0 0011.5 7h-8z"/></svg>
                : <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18, color: "#fca5a5" }}><path fillRule="evenodd" d="M4.28 3.22a.75.75 0 00-1.06 1.06l.19.19C3.15 4.7 3 5.09 3 5.5v7A2.5 2.5 0 005.5 15h7c.41 0 .8-.15 1.09-.41l1.12 1.12a.75.75 0 101.06-1.06L4.28 3.22zm3.53 8.66l5.79 5.79A2.5 2.5 0 0015 14.5v-7c0-.5-.19-.97-.5-1.32l-6.69 6.7z" clipRule="evenodd"/></svg>}
            />
            <CtrlBtn
              label={isScreenSharing ? "Partage actif" : "Ecran"} active={isScreenSharing} activeColor="#0891b2"
              onClick={() => void toggleScreenShare()}
              icon={<svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18 }}><path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0v7.5c0 .414.336.75.75.75h11.5a.75.75 0 00.75-.75v-7.5a.75.75 0 00-.75-.75H4.25a.75.75 0 00-.75.75z" clipRule="evenodd"/></svg>}
            />
            <CtrlBtn
              label={isANS ? "Filtre ON" : "Filtre bruit"} active={isANS} activeColor="#15803d"
              onClick={() => void toggleANS()}
              icon={<svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18 }}><path d="M10.5 3.75a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5zM14.78 5.72a.75.75 0 00-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zm1.47 3.53a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5h1.5zm-3.78 5.06a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 00-1.06 1.06l1.06 1.06zm-6.5-1.06a.75.75 0 00-1.06 1.06l1.06 1.06a.75.75 0 001.06-1.06l-1.06-1.06zM4.75 10a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5h1.5zm1.47-5.28a.75.75 0 00-1.06 1.06l1.06 1.06a.75.75 0 001.06-1.06L6.22 4.72zM10 6.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z"/></svg>}
            />
          </div>

          {/* CENTER — Translation controls */}
          <div style={{ display: "flex", gap: "7px", alignItems: "center", padding: "6px 14px", borderRadius: "18px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <LanguageSelector title="Je parle"   value={sourceLang}  onChange={setSourceLang} />
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14, opacity: 0.3, flexShrink: 0 }}><path strokeLinecap="round" d="M2 8h12M10 4l4 4-4 4"/></svg>
            <LanguageSelector title="Traduit en" value={targetLang}  onChange={setTargetLang} />
            <VoiceSelector value={voiceGender} onChange={setVoiceGender} />
            <button
              onClick={toggleTranslation}
              disabled={isJoining}
              style={{
                height: 34, padding: "0 14px", borderRadius: "10px", border: 0,
                background: isJoining
                  ? "rgba(255,255,255,0.12)"
                  : isTranslating
                  ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
                  : "linear-gradient(135deg, #6366f1, #7c3aed)",
                color: isJoining ? "rgba(255,255,255,0.3)" : "white",
                fontWeight: 700, fontSize: "12.5px",
                cursor: isJoining ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
                boxShadow: isJoining ? "none" : isTranslating ? "0 4px 14px rgba(37,99,235,0.45)" : "0 4px 14px rgba(99,102,241,0.45)",
                transition: "all 0.2s",
              }}
            >
              {isJoining ? "…" : isTranslating ? "Arreter" : "Traduire"}
            </button>
          </div>

          {/* RIGHT — Tools + Leave */}
          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", alignItems: "center" }}>
            <CtrlBtn
              label={ttsProvider === "elevenlabs" ? "Voix HD" : "Voix Std"}
              active={ttsProvider === "elevenlabs"} activeColor="#ec4899"
              onClick={() => void toggleTTSProvider()}
              icon={<svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18 }}><path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-2.09c-1.29-1.329-2.258-2.956-2.258-4.88C3.627 6.68 5.348 5 7.5 5c1.139 0 2.16.543 2.836 1.388 1.155-.953 2.7-1.492 4.086-.777.93.483 1.578 1.373 1.578 2.389 0 2.3-2.67 4.26-4.346 5.915z"/></svg>}
            />
            <CtrlBtn
              label="Board" active={showWhiteboard} activeColor="#7c3aed"
              onClick={() => setShowWhiteboard(!showWhiteboard)}
              icon={<svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18 }}><path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H4zm0 2h12v8H4V7z" clipRule="evenodd"/><path d="M7 9.5a.5.5 0 01.5-.5h5a.5.5 0 010 1h-5a.5.5 0 01-.5-.5zm0 2a.5.5 0 01.5-.5h3a.5.5 0 010 1h-3a.5.5 0 01-.5-.5z"/></svg>}
            />
            <CtrlBtn
              label="IA" active={showAICompanion} activeColor="#4f46e5"
              onClick={() => setShowAICompanion(!showAICompanion)}
              icon={<svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18 }}><path d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z"/></svg>}
            />
            <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.09)", margin: "0 4px" }} />
            <button
              onClick={() => { void cleanup(); window.location.href = "/" }}
              style={{ height: 38, padding: "0 16px", borderRadius: "11px", border: "1px solid rgba(220,38,38,0.25)", background: "rgba(220,38,38,0.15)", color: "#fca5a5", fontWeight: 700, fontSize: "13px", cursor: "pointer", transition: "background 0.15s", whiteSpace: "nowrap" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.3)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.15)" }}
            >
              Quitter
            </button>
          </div>
        </div>
      </footer>

    </div>
  )
}

// ─── Subtitle overlay — isolated component so subtitle state changes never ────
// re-render the parent RoomClient (and thus never stall the video grid).
// Uses direct DOM manipulation (no React state) to eliminate any re-render
// flash between partial and final subtitles.
type SubtitleOverlayHandle = {
  show: (lang: string, text: string, final: boolean) => void
  reset: () => void
}

const SubtitleOverlay = forwardRef<SubtitleOverlayHandle, object>(
  function SubtitleOverlay(_, ref) {
    const wrapRef  = useRef<HTMLDivElement | null>(null)
    const boxRef   = useRef<HTMLDivElement | null>(null)
    const textRef  = useRef<HTMLSpanElement | null>(null)
    const timer    = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastText = useRef("")

    useImperativeHandle(ref, () => ({
      show(lang, text, final) {
        if (!wrapRef.current || !boxRef.current || !textRef.current) return

        // Clear the auto-hide timer unconditionally.
        if (timer.current) { clearTimeout(timer.current); timer.current = null }

        // Update text only when it actually changed — avoids the visual "doublon"
        // that occurs when Azure fires recognizing+recognized with identical text.
        if (text !== lastText.current) {
          textRef.current.textContent = text
          lastText.current = text
        }

        // Apply style: final = solid white, partial = muted italic
        if (final) {
          boxRef.current.className =
            "inline-block px-5 py-2.5 rounded-2xl font-semibold backdrop-blur-md shadow-xl bg-black/85 text-white text-[15px] leading-snug"
        } else {
          boxRef.current.className =
            "inline-block px-5 py-2 rounded-2xl font-normal backdrop-blur-md shadow-lg bg-black/55 text-white/70 text-sm italic leading-snug"
        }

        // Show the overlay
        wrapRef.current.style.display = "block"

        // Auto-hide 5 s after a final result; partials stay until replaced.
        if (final) {
          timer.current = setTimeout(() => {
            if (wrapRef.current) wrapRef.current.style.display = "none"
            lastText.current = ""
          }, 5000)
        }
      },
      reset() {
        if (timer.current) { clearTimeout(timer.current); timer.current = null }
        if (wrapRef.current) wrapRef.current.style.display = "none"
        lastText.current = ""
      },
    }), [])

    return (
      <div
        ref={wrapRef}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[80%] text-center pointer-events-none z-20"
        style={{ display: "none" }}
      >
        <div ref={boxRef}>
          <span ref={textRef} />
        </div>
      </div>
    )
  }
)

// ─── Shared control button ────────────────────────────────────────────────────
function CtrlBtn({
  label, icon, active, activeColor, onClick, small,
}: {
  label: string
  icon: React.ReactNode
  active?: boolean
  activeColor?: string
  onClick: () => void
  small?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: small ? "2px" : "4px",
        padding: small ? "5px 8px" : "6px 10px",
        borderRadius: "12px", border: "1px solid",
        borderColor: active ? (activeColor ?? "#6366f1") + "55" : "rgba(255,255,255,0.07)",
        background: active ? (activeColor ?? "#6366f1") + "22" : "rgba(255,255,255,0.04)",
        color: active ? "white" : "rgba(255,255,255,0.65)",
        cursor: "pointer", transition: "all 0.15s",
        minWidth: small ? "40px" : "52px",
      }}
      onMouseEnter={e => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)"
      }}
      onMouseLeave={e => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"
      }}
    >
      {icon}
      <span style={{ fontSize: small ? "8.5px" : "9.5px", fontWeight: 700, letterSpacing: "0.02em", whiteSpace: "nowrap", opacity: active ? 1 : 0.6 }}>
        {label}
      </span>
    </button>
  )
}
