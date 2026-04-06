"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import AgoraRTC, {
  IAgoraRTCClient,
  ILocalAudioTrack,
  ILocalVideoTrack,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
  UID,
} from "agora-rtc-sdk-ng"
import LanguageSelector from "@/components/LanguageSelector"
import { startVoiceTranslation, stopVoiceTranslation } from "@/core/voiceEngine"

type TileUser = {
  uid: UID
  isLocal: boolean
  hasVideo: boolean
  hasAudio: boolean
  videoTrack: ILocalVideoTrack | IRemoteVideoTrack | null
  audioTrack: ILocalAudioTrack | IRemoteAudioTrack | null
}

export default function RoomClient({ roomId }: { roomId: string }) {
  const [users, setUsers] = useState<TileUser[]>([])
  const [joined, setJoined] = useState(false)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCamOn, setIsCamOn] = useState(true)
  const [recognizedText, setRecognizedText] = useState("")
  const [translatedText, setTranslatedText] = useState("")
  const [selectedSourceLanguage, setSelectedSourceLanguage] = useState("fr")
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState("en")

  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const localAudioTrackRef = useRef<ILocalAudioTrack | null>(null)
  const localVideoTrackRef = useRef<ILocalVideoTrack | null>(null)
  const recognizerRef = useRef<any>(null)
  const cleanupPromiseRef = useRef<Promise<void> | null>(null)
  const initRunIdRef = useRef(0)
  const joinedRef = useRef(false)
  const mountedRef = useRef(false)
  const subtitleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const upsertUser = (incoming: TileUser) => {
    setUsers((prev) => {
      const index = prev.findIndex((u) => String(u.uid) === String(incoming.uid))
      if (index === -1) return [...prev, incoming]

      const next = [...prev]
      next[index] = {
        ...next[index],
        ...incoming,
      }
      return next
    })
  }

  const removeUser = (uid: UID) => {
    setUsers((prev) => prev.filter((u) => String(u.uid) !== String(uid)))
  }

  const clearSubtitleTimer = () => {
    if (subtitleTimerRef.current) {
      clearTimeout(subtitleTimerRef.current)
      subtitleTimerRef.current = null
    }
  }

  const keepSubtitleVisible = () => {
    clearSubtitleTimer()
    subtitleTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return
      setRecognizedText("")
      setTranslatedText("")
    }, 6000)
  }

  const stopRecognizerSafely = async () => {
    const recognizer = recognizerRef.current
    recognizerRef.current = null
    await stopVoiceTranslation(recognizer)
  }

  const safeCleanup = async () => {
    const client = clientRef.current
    const mic = localAudioTrackRef.current
    const cam = localVideoTrackRef.current

    try {
      await stopRecognizerSafely()

      if (mic) {
        try {
          mic.stop()
        } catch {}
        try {
          mic.close()
        } catch {}
        localAudioTrackRef.current = null
      }

      if (cam) {
        try {
          cam.stop()
        } catch {}
        try {
          cam.close()
        } catch {}
        localVideoTrackRef.current = null
      }

      if (client) {
        try {
          client.removeAllListeners()
        } catch {}

        if (joinedRef.current) {
          try {
            await client.leave()
          } catch {}
        }
      }
    } finally {
      clientRef.current = null
      joinedRef.current = false
      clearSubtitleTimer()

      if (mountedRef.current) {
        setJoined(false)
        setUsers([])
        setRecognizedText("")
        setTranslatedText("")
      }
    }
  }

  useEffect(() => {
    mountedRef.current = true
    let cancelled = false
    const runId = ++initRunIdRef.current

    const init = async () => {
      if (cleanupPromiseRef.current) {
        await cleanupPromiseRef.current
      }

      if (cancelled || runId !== initRunIdRef.current) return
      if (clientRef.current || joinedRef.current) return

      const client = AgoraRTC.createClient({
        mode: "rtc",
        codec: "vp8",
      })

      clientRef.current = client

      const handleUserPublished = async (user: any, mediaType: "audio" | "video") => {
        if (cancelled || runId !== initRunIdRef.current) return

        try {
          await client.subscribe(user, mediaType)
        } catch (error) {
          console.error("Subscribe error:", error)
          return
        }

        if (cancelled || runId !== initRunIdRef.current) return

        const existing = client.remoteUsers.find((u) => String(u.uid) === String(user.uid))

        upsertUser({
          uid: user.uid,
          isLocal: false,
          hasVideo: !!existing?.videoTrack,
          hasAudio: !!existing?.audioTrack,
          videoTrack: (existing?.videoTrack as IRemoteVideoTrack | null) ?? null,
          audioTrack: (existing?.audioTrack as IRemoteAudioTrack | null) ?? null,
        })

        if (mediaType === "audio" && user.audioTrack) {
          try {
            ;(user.audioTrack as IRemoteAudioTrack).play()
          } catch (error) {
            console.error("Remote audio play error:", error)
          }
        }
      }

      const handleUserUnpublished = (user: any, mediaType: "audio" | "video") => {
        setUsers((prev) =>
          prev.map((u) => {
            if (String(u.uid) !== String(user.uid)) return u

            if (mediaType === "video") {
              return {
                ...u,
                hasVideo: false,
                videoTrack: null,
              }
            }

            return {
              ...u,
              hasAudio: false,
              audioTrack: null,
            }
          })
        )
      }

      const handleUserLeft = (user: any) => {
        removeUser(user.uid)
      }

      try {
        const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID
        if (!appId) {
          throw new Error("NEXT_PUBLIC_AGORA_APP_ID manquant")
        }

        const tokenRes = await fetch(`/api/agora-token?roomId=${encodeURIComponent(roomId)}`, {
          cache: "no-store",
        })

        if (!tokenRes.ok) {
          throw new Error(`Token Agora introuvable (${tokenRes.status})`)
        }

        const { token, uid } = await tokenRes.json()

        const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
          {
            AEC: true,
            ANS: true,
            encoderConfig: "music_standard",
          },
          {
            encoderConfig: {
              width: 1280,
              height: 720,
              frameRate: 24,
              bitrateMin: 700,
              bitrateMax: 1600,
            },
            optimizationMode: "motion",
          }
        )

        if (cancelled || runId !== initRunIdRef.current) {
          micTrack.close()
          camTrack.close()
          return
        }

        localAudioTrackRef.current = micTrack
        localVideoTrackRef.current = camTrack

        client.on("user-published", handleUserPublished)
        client.on("user-unpublished", handleUserUnpublished)
        client.on("user-left", handleUserLeft)

        await client.join(appId, roomId, token ?? null, uid ?? null)

        if (cancelled || runId !== initRunIdRef.current) {
          await safeCleanup()
          return
        }

        joinedRef.current = true

        await client.publish([micTrack, camTrack])

        if (cancelled || runId !== initRunIdRef.current) {
          await safeCleanup()
          return
        }

        upsertUser({
          uid,
          isLocal: true,
          hasVideo: true,
          hasAudio: true,
          videoTrack: camTrack,
          audioTrack: micTrack,
        })

        if (mountedRef.current) {
          setJoined(true)
        }
      } catch (error) {
        console.error("Room init error:", error)
        await safeCleanup()
      }
    }

    init()

    return () => {
      cancelled = true
      cleanupPromiseRef.current = safeCleanup()
    }
  }, [roomId])

  useEffect(() => {
    let cancelled = false

    const bootTranslation = async () => {
      if (!joined) return
      if (!selectedSourceLanguage || !selectedTargetLanguage) return

      try {
        await stopRecognizerSafely()

        const recognizer = await startVoiceTranslation(
          selectedSourceLanguage,
          selectedTargetLanguage,
          (translated) => {
            if (cancelled || !mountedRef.current) return
            setTranslatedText(translated)
            keepSubtitleVisible()
          },
          () => {},
          {
            onRecognized: (text) => {
              if (cancelled || !mountedRef.current) return
              setRecognizedText(text)
              keepSubtitleVisible()
            },
            onTranslated: (text) => {
              if (cancelled || !mountedRef.current) return
              setTranslatedText(text)
              keepSubtitleVisible()
            },
          }
        )

        if (cancelled) {
          await stopVoiceTranslation(recognizer)
          return
        }

        recognizerRef.current = recognizer
      } catch (error) {
        console.error("Realtime translation error:", error)
      }
    }

    bootTranslation()

    return () => {
      cancelled = true
      void stopRecognizerSafely()
    }
  }, [joined, selectedSourceLanguage, selectedTargetLanguage])

  const toggleMic = async () => {
    const mic = localAudioTrackRef.current
    if (!mic) return
    const next = !isMicOn
    await mic.setEnabled(next)
    setIsMicOn(next)

    setUsers((prev) =>
      prev.map((u) =>
        u.isLocal
          ? {
              ...u,
              hasAudio: next,
            }
          : u
      )
    )
  }

  const toggleCam = async () => {
    const cam = localVideoTrackRef.current
    if (!cam) return
    const next = !isCamOn
    await cam.setEnabled(next)
    setIsCamOn(next)

    setUsers((prev) =>
      prev.map((u) =>
        u.isLocal
          ? {
              ...u,
              hasVideo: next,
              videoTrack: next ? cam : null,
            }
          : u
      )
    )
  }

  const leaveRoom = async () => {
    await safeCleanup()
    window.location.href = "/"
  }

  const displayUsers = useMemo(() => {
    const local = users.find((u) => u.isLocal)
    const remotes = users.filter((u) => !u.isLocal)
    return local ? [local, ...remotes] : remotes
  }, [users])

  const gridClass = useMemo(() => {
    const count = displayUsers.length
    if (count <= 1) return "grid-cols-1"
    if (count === 2) return "grid-cols-1 xl:grid-cols-2"
    if (count <= 4) return "grid-cols-1 md:grid-cols-2"
    if (count <= 9) return "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
    return "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
  }, [displayUsers.length])

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top,#0f2442_0%,#0c1525_40%,#09111d_100%)] text-white">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="text-base font-semibold tracking-tight text-white/95">
            Instant Talk Global
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            Salle {roomId}
          </div>
        </div>

        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
          {joined ? "Connecté" : "Connexion..."}
        </div>
      </header>

      <main className="min-h-0 flex-1 px-5 pb-24">
        <div className={`grid h-full min-h-0 gap-4 ${gridClass}`}>
          {displayUsers.map((user) => (
            <VideoTile key={String(user.uid)} user={user} />
          ))}
        </div>
      </main>

      <div className="pointer-events-none absolute bottom-24 left-1/2 z-30 w-[92%] max-w-4xl -translate-x-1/2">
        {recognizedText ? (
          <div className="mb-2 rounded-2xl border border-white/10 bg-black/55 px-4 py-2 text-center text-sm text-white shadow-lg backdrop-blur-md">
            {recognizedText}
          </div>
        ) : null}

        {translatedText ? (
          <div className="rounded-2xl border border-white/10 bg-blue-600/85 px-5 py-3 text-center text-sm font-medium text-white shadow-xl backdrop-blur-md md:text-base">
            {translatedText}
          </div>
        ) : null}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-6">
        <div className="pointer-events-auto rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(42,49,64,0.92)_0%,rgba(23,28,38,0.92)_100%)] px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <LanguageSelector
              title="Langue parlée"
              value={selectedSourceLanguage}
              onChange={setSelectedSourceLanguage}
            />
            <LanguageSelector
              title="Langue traduite"
              value={selectedTargetLanguage}
              onChange={setSelectedTargetLanguage}
            />
            <ControlButton
              active={isMicOn}
              label={isMicOn ? "Micro activé" : "Micro coupé"}
              onClick={toggleMic}
            />
            <ControlButton
              active={isCamOn}
              label={isCamOn ? "Caméra active" : "Caméra coupée"}
              onClick={toggleCam}
            />
            <button
              type="button"
              onClick={leaveRoom}
              className="rounded-full border border-red-400/30 bg-[linear-gradient(180deg,#ff6a5e_0%,#ea4335_100%)] px-6 py-3 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_10px_24px_rgba(234,67,53,0.35)] transition hover:brightness-105 active:translate-y-[1px]"
            >
              Quitter
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ControlButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void | Promise<void>
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-5 py-3 text-sm font-semibold transition active:translate-y-[1px] ${
        active
          ? "border border-white/10 bg-[linear-gradient(180deg,#424b5d_0%,#2a3140_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_10px_24px_rgba(0,0,0,0.28)] hover:brightness-110"
          : "border border-red-400/25 bg-[linear-gradient(180deg,#7a2e37_0%,#581d25_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_24px_rgba(0,0,0,0.28)] hover:brightness-110"
      }`}
    >
      {label}
    </button>
  )
}

function VideoTile({ user }: { user: TileUser }) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.innerHTML = ""

    if (user.hasVideo && user.videoTrack) {
      try {
        user.videoTrack.play(container)
      } catch (error) {
        console.error("Video play error:", error)
      }
    }

    return () => {
      if (container) {
        container.innerHTML = ""
      }
    }
  }, [user.hasVideo, user.videoTrack])

  const isWaitingRemote = !user.isLocal && !user.hasVideo

  return (
    <div className="relative min-h-[280px] overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(29,40,58,0.96)_0%,rgba(20,28,40,0.96)_100%)] shadow-[0_20px_50px_rgba(0,0,0,0.32)]">
      {user.hasVideo && user.videoTrack ? (
        <div ref={containerRef} className="h-full w-full" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-2xl font-semibold text-white/85">
              {user.isLocal ? "Vous" : String(user.uid).slice(0, 1).toUpperCase()}
            </div>
            <div className="text-sm text-white/70">
              {isWaitingRemote ? "Participant en attente" : "Caméra désactivée"}
            </div>
          </div>
        </div>
      )}

      <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-md">
        {user.isLocal ? "Vous" : "Participant"}
      </div>
    </div>
  )
}
