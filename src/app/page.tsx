"use client";

// ─────────────────────────────────────────────────────────────────────────────
// app/page.tsx  —  Instant Talk  |  Production-grade conference UI
//
// PRIORITIES IMPLEMENTED:
//   P1 → VideoGrid STRICTE : CSS grid inline figé, pas de LiveKit controls,
//         native mic totalement désactivé (audio={false} sur <LiveKitRoom>)
//   P2 → Deepgram STT ultra-rapide : WebSocket direct, ScriptProcessorNode
//         16kHz, endpointing dynamique, changement de langue hot-reload
//   P3 → AudioQueue asynchrone : promise-chain séquentielle, non-bloquante,
//         injection LiveKit via MediaStreamDestinationNode
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from "react";
import {
  LiveKitRoom,
  useTracks,
  VideoTrack,
  useRoomContext,
} from "@livekit/components-react";
import { Track, LocalAudioTrack } from "livekit-client";

// ─── LANGUAGE REGISTRY ───────────────────────────────────────────────────────
const LANGUAGES = [
  { code: "fr",    label: "Français",   flag: "🇫🇷", dg: "fr",    gemini: "French"     },
  { code: "en",    label: "English",    flag: "🇺🇸", dg: "en-US", gemini: "English"    },
  { code: "ja",    label: "日本語",      flag: "🇯🇵", dg: "ja",    gemini: "Japanese"   },
  { code: "es",    label: "Español",    flag: "🇪🇸", dg: "es",    gemini: "Spanish"    },
  { code: "de",    label: "Deutsch",    flag: "🇩🇪", dg: "de",    gemini: "German"     },
  { code: "zh",    label: "中文",        flag: "🇨🇳", dg: "zh-CN", gemini: "Chinese"    },
  { code: "ar",    label: "العربية",    flag: "🇸🇦", dg: "ar",    gemini: "Arabic"     },
  { code: "pt",    label: "Português",  flag: "🇧🇷", dg: "pt-BR", gemini: "Portuguese" },
  { code: "ko",    label: "한국어",      flag: "🇰🇷", dg: "ko",    gemini: "Korean"     },
  { code: "it",    label: "Italiano",   flag: "🇮🇹", dg: "it",    gemini: "Italian"    },
  { code: "ru",    label: "Русский",    flag: "🇷🇺", dg: "ru",    gemini: "Russian"    },
  { code: "hi",    label: "हिन्दी",     flag: "🇮🇳", dg: "hi",    gemini: "Hindi"      },
] as const;

type LangConfig = (typeof LANGUAGES)[number];

// ─── PRIORITY 3 — AUDIO QUEUE ────────────────────────────────────────────────
//
// Sequential async playback via a Promise chain.
// Audio routes exclusively to a MediaStreamDestinationNode → LiveKit.
// Local speakers are NEVER triggered (this is the translated voice for
// the REMOTE participant, not for local monitoring).
//
class AudioQueue {
  readonly audioCtx: AudioContext;
  readonly destination: MediaStreamAudioDestinationNode;
  readonly stream: MediaStream;

  private chain: Promise<void> = Promise.resolve();
  private _queueLength = 0;

  constructor() {
    this.audioCtx = new (
      window.AudioContext ?? (window as any).webkitAudioContext
    )({ sampleRate: 48000 });
    this.destination = this.audioCtx.createMediaStreamDestination();
    this.stream = this.destination.stream;
  }

  get queueLength(): number {
    return this._queueLength;
  }

  /** Non-blocking enqueue. Returns immediately. */
  enqueue(base64: string): void {
    this._queueLength++;
    this.chain = this.chain.then(async () => {
      try {
        await this.play(base64);
      } catch (err) {
        console.warn("[AudioQueue] playback error — skipping segment", err);
      } finally {
        this._queueLength--;
      }
    });
  }

  /** Drop all pending audio (e.g., on language switch). */
  flush(): void {
    // Replace the chain with a resolved promise; pending items will
    // still fire but subsequent enqueue()s will chain from the new tail.
    this.chain = Promise.resolve();
    this._queueLength = 0;
  }

  async resume(): Promise<void> {
    if (this.audioCtx.state === "suspended") {
      await this.audioCtx.resume();
    }
  }

  private play(base64: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.audioCtx.state === "suspended") await this.audioCtx.resume();

        // base64 → ArrayBuffer
        const raw = atob(base64);
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);

        // Decode compressed audio (mp3) → PCM buffer
        const decoded = await this.audioCtx.decodeAudioData(bytes.buffer.slice(0));

        const src = this.audioCtx.createBufferSource();
        src.buffer = decoded;
        // Route ONLY to the MediaStream node → LiveKit.
        // Do NOT connect to audioCtx.destination (would play locally).
        src.connect(this.destination);
        src.onended = () => resolve();
        src.start(0);
      } catch (e) {
        reject(e);
      }
    });
  }
}

// ─── UTILITY ─────────────────────────────────────────────────────────────────

function float32ToInt16(f32: Float32Array): Int16Array {
  const out = new Int16Array(f32.length);
  for (let i = 0; i < f32.length; i++) {
    const s = Math.max(-1, Math.min(1, f32[i]));
    out[i] = s < 0 ? s * 32768 : s * 32767;
  }
  return out;
}

// ─── PRIORITY 1 — AI AUDIO INJECTOR ─────────────────────────────────────────
//
// Invisible component. Publishes the AudioQueue's MediaStream as a
// LiveKit LocalAudioTrack. Must live INSIDE <LiveKitRoom> to access context.
//
function AIAudioInjector({ queue }: { queue: AudioQueue | null }) {
  const room = useRoomContext();
  const publishedTrack = useRef<LocalAudioTrack | null>(null);

  useEffect(() => {
    if (!queue || !room) return;
    let cancelled = false;

    (async () => {
      const mediaTrack = queue.stream.getAudioTracks()[0];
      if (!mediaTrack || cancelled) return;

      // userProvidedTrack=true → LiveKit won't attempt to recreate/manage it
      const local = new LocalAudioTrack(mediaTrack, undefined, true);
      publishedTrack.current = local;

      await room.localParticipant.publishTrack(local, {
        name: "ai-voice",
        source: Track.Source.Microphone, // treated as mic by remote participants
      });
    })().catch(console.error);

    return () => {
      cancelled = true;
      if (publishedTrack.current) {
        room.localParticipant
          .unpublishTrack(publishedTrack.current)
          .catch(() => {});
        publishedTrack.current = null;
      }
    };
  }, [queue, room]);

  return null;
}

// ─── PRIORITY 1 — VIDEO GRID (STRICT / FROZEN) ───────────────────────────────
//
// Inline styles enforce the grid. No Tailwind dynamic classes that could
// shift layout. No LiveKit ActiveSpeaker, no controls, no overlays.
//
function VideoGrid() {
  const tracks = useTracks(
    [Track.Source.Camera],
    { onlySubscribed: false }
  );

  return (
    <div
      style={{
        display: "grid",
        width: "100%",
        height: "100%",
        // 1 participant → full screen  |  2+ → equal-width columns (never shrink)
        gridTemplateColumns: tracks.length > 1 ? "repeat(2, 1fr)" : "1fr",
        gridTemplateRows: "1fr",
        gap: "10px",
        // No transitions, no animations — ever
        transition: "none",
      }}
    >
      {tracks.map((trackRef) => (
        <div
          key={trackRef.participant.identity}
          style={{
            position: "relative",
            borderRadius: "14px",
            overflow: "hidden",
            background: "#111113",
            border: "1px solid rgba(255,255,255,0.06)",
            minWidth: 0,   // Prevent grid blowout
            minHeight: 0,
          }}
        >
          <VideoTrack
            trackRef={trackRef}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
          {/* Participant label — no hover effects, no controls */}
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              left: "12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(0,0,0,0.62)",
              backdropFilter: "blur(8px)",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 500,
              padding: "4px 12px 4px 8px",
              borderRadius: "999px",
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#34d399",
                flexShrink: 0,
              }}
            />
            {trackRef.participant.identity}
          </div>
        </div>
      ))}

      {tracks.length === 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#52525b",
            fontSize: "14px",
          }}
        >
          En attente des participants…
        </div>
      )}
    </div>
  );
}

// ─── PRIORITY 2 — DEEPGRAM STT HOOK ─────────────────────────────────────────
//
// • Captures mic at 16kHz → ScriptProcessorNode → Int16 chunks → WebSocket
// • Callbacks stored in Refs → language switch reconnects WS, not on every render
// • On speech_final → flush buffer → trigger translation
// • On UtteranceEnd → backup flush for long pauses
// • Auto-reconnect on unexpected close
//
function useDeepgramSTT({
  myLang,
  enabled,
  onInterim,
  onSpeechFinal,
}: {
  myLang: LangConfig;
  enabled: boolean;
  onInterim: (text: string) => void;
  onSpeechFinal: (text: string) => void;
}) {
  // Keep callbacks in refs → stable references across renders
  const onInterimRef = useRef(onInterim);
  const onSpeechFinalRef = useRef(onSpeechFinal);
  useEffect(() => { onInterimRef.current = onInterim; }, [onInterim]);
  useEffect(() => { onSpeechFinalRef.current = onSpeechFinal; }, [onSpeechFinal]);

  const wsRef         = useRef<WebSocket | null>(null);
  const audioCtxRef   = useRef<AudioContext | null>(null);
  const processorRef  = useRef<ScriptProcessorNode | null>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const finalBufRef   = useRef<string>("");
  const activeRef     = useRef(false);
  const myLangRef     = useRef(myLang);
  useEffect(() => { myLangRef.current = myLang; }, [myLang]);

  const teardown = useCallback(() => {
    activeRef.current = false;
    try { processorRef.current?.disconnect(); } catch {}
    audioCtxRef.current?.close().catch(() => {});
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close(1000, "teardown");
    }
    wsRef.current = null;
    audioCtxRef.current = null;
    processorRef.current = null;
    streamRef.current = null;
    finalBufRef.current = "";
  }, []);

  const connect = useCallback(async () => {
    teardown();
    activeRef.current = true;

    // ── 1. Fetch ephemeral Deepgram key ───────────────────────────────────
    let dgKey: string;
    try {
      const res = await fetch("/api/deepgram-token");
      if (!res.ok) throw new Error("token fetch failed");
      ({ key: dgKey } = await res.json());
    } catch (e) {
      console.error("[STT] Cannot get Deepgram token", e);
      return;
    }

    // ── 2. Capture mic stream ──────────────────────────────────────────────
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000,
        },
      });
    } catch (e) {
      console.error("[STT] getUserMedia failed", e);
      return;
    }

    if (!activeRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }
    streamRef.current = stream;

    // ── 3. AudioContext → ScriptProcessor at 16kHz ────────────────────────
    // 16kHz = minimal bandwidth, sufficient for speech
    const audioCtx = new AudioContext({ sampleRate: 16000 });
    audioCtxRef.current = audioCtx;
    const micSource = audioCtx.createMediaStreamSource(stream);

    // 4096 samples @ 16kHz ≈ 256ms per callback
    const processor = audioCtx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    // Silent gain: Chrome requires ScriptProcessor to be connected to
    // destination to fire onaudioprocess — but we don't want to hear the mic.
    const silentGain = audioCtx.createGain();
    silentGain.gain.value = 0;
    micSource.connect(processor);
    processor.connect(silentGain);
    silentGain.connect(audioCtx.destination);

    // ── 4. Deepgram WebSocket ──────────────────────────────────────────────
    const lang = myLangRef.current;
    const params = new URLSearchParams({
      model:              "nova-2",
      language:           lang.dg,
      encoding:           "linear16",
      sample_rate:        "16000",
      channels:           "1",
      endpointing:        "600",   // ms of silence to trigger speech_final
      interim_results:    "true",
      smart_format:       "true",
      punctuate:          "true",
      utterance_end_ms:   "1500",  // backup UtteranceEnd trigger
    });

    const ws = new WebSocket(
      `wss://api.deepgram.com/v1/listen?${params.toString()}`,
      ["token", dgKey]
    );
    wsRef.current = ws;

    ws.onopen = () => {
      if (!activeRef.current) { ws.close(1000, "stale"); return; }

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const f32 = e.inputBuffer.getChannelData(0);
        const i16 = float32ToInt16(f32);
        ws.send(i16.buffer);
      };
    };

    ws.onmessage = (evt) => {
      let msg: any;
      try { msg = JSON.parse(evt.data as string); } catch { return; }

      // ── UtteranceEnd: backup flush after long silence ─────────────────
      if (msg.type === "UtteranceEnd") {
        const buf = finalBufRef.current.trim();
        if (buf) {
          onSpeechFinalRef.current(buf);
          finalBufRef.current = "";
          onInterimRef.current("");
        }
        return;
      }

      if (msg.type !== "Results") return;

      const transcript = msg.channel?.alternatives?.[0]?.transcript as string | undefined;
      if (!transcript) return;

      const isFinal: boolean    = msg.is_final;
      const speechFinal: boolean = msg.speech_final;

      if (!isFinal) {
        // Interim: display live, don't accumulate
        onInterimRef.current((finalBufRef.current + " " + transcript).trimStart());
      } else {
        // Confirmed segment: accumulate
        finalBufRef.current = (finalBufRef.current + " " + transcript).trim();
        onInterimRef.current(finalBufRef.current);

        if (speechFinal && finalBufRef.current) {
          onSpeechFinalRef.current(finalBufRef.current);
          finalBufRef.current = "";
          onInterimRef.current("");
        }
      }
    };

    ws.onerror = (e) => console.error("[STT] WS error", e);

    ws.onclose = ({ code, reason }) => {
      if (activeRef.current && code !== 1000) {
        // Abnormal close → reconnect after 800ms
        console.warn(`[STT] WS closed (${code} ${reason}), reconnecting…`);
        setTimeout(() => { if (activeRef.current) connect(); }, 800);
      }
    };
  }, [teardown]); // myLang handled via ref inside

  // Effect: (re)connect when enabled or myLang changes
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      teardown();
    }
    return teardown;
  }, [enabled, myLang, connect, teardown]); // myLang in dep → triggers reconnect on change
}

// ─── CONFERENCE ROOM INNER ────────────────────────────────────────────────────
//
// Lives inside <LiveKitRoom> context.
//
function ConferenceRoomInner({
  username,
  myLang,
  targetLang,
  onMyLangChange,
  onTargetLangChange,
  onLeave,
}: {
  username: string;
  myLang: LangConfig;
  targetLang: LangConfig;
  onMyLangChange: (l: LangConfig) => void;
  onTargetLangChange: (l: LangConfig) => void;
  onLeave: () => void;
}) {
  const [sttEnabled, setSttEnabled] = useState(true);
  const [interimText, setInterimText] = useState("");
  const [lastTranslation, setLastTranslation] = useState<{ original: string; translated: string } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [audioQueue, setAudioQueue] = useState<AudioQueue | null>(null);

  // Initialise AudioQueue once on mount (client-side only)
  useEffect(() => {
    const q = new AudioQueue();
    setAudioQueue(q);
  }, []);

  // Sequential translation chain — guarantees in-order audio delivery
  const translationChain = useRef<Promise<void>>(Promise.resolve());

  const handleSpeechFinal = useCallback(
    (text: string) => {
      if (!text.trim()) return;

      // Chain this translation after the previous one completes
      translationChain.current = translationChain.current.then(async () => {
        setIsTranslating(true);
        try {
          const res = await fetch("/api/agent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text,
              sourceLang: myLang.gemini,
              targetLang: targetLang.gemini,
            }),
          });

          if (!res.ok) throw new Error(`Agent API error ${res.status}`);

          const { translatedText, audioBase64 } = await res.json();

          setLastTranslation({ original: text, translated: translatedText });

          if (audioBase64 && audioQueue) {
            await audioQueue.resume();
            audioQueue.enqueue(audioBase64);
          }
        } catch (err) {
          console.error("[ConferenceRoom] translation failed", err);
        } finally {
          setIsTranslating(false);
        }
      });
    },
    [myLang, targetLang, audioQueue]
  );

  useDeepgramSTT({
    myLang,
    enabled: sttEnabled,
    onInterim: setInterimText,
    onSpeechFinal: handleSpeechFinal,
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#09090b",
        color: "#fff",
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(9,9,11,0.95)",
          flexShrink: 0,
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "18px",
              fontWeight: 700,
              background: "linear-gradient(135deg, #a78bfa, #22d3ee)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Instant Talk
          </span>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "#34d399",
              background: "rgba(52,211,153,0.12)",
              padding: "2px 7px",
              borderRadius: "999px",
              border: "1px solid rgba(52,211,153,0.3)",
              letterSpacing: "0.05em",
            }}
          >
            LIVE
          </span>
        </div>

        {/* Language controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {/* My language */}
          <LangSelector
            label="Je parle"
            value={myLang.code}
            onChange={(code) => {
              const l = LANGUAGES.find((x) => x.code === code)!;
              onMyLangChange(l);
              setInterimText("");
              setLastTranslation(null);
            }}
          />

          <span style={{ color: "#3f3f46", fontSize: "16px" }}>→</span>

          {/* Target language */}
          <LangSelector
            label="Traduit en"
            value={targetLang.code}
            onChange={(code) => {
              const l = LANGUAGES.find((x) => x.code === code)!;
              onTargetLangChange(l);
              audioQueue?.flush(); // Drop pending audio for old language
              setLastTranslation(null);
            }}
          />

          {/* STT toggle */}
          <button
            onClick={() => setSttEnabled((v) => !v)}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
              background: sttEnabled ? "rgba(167,139,250,0.2)" : "rgba(63,63,70,0.5)",
              color: sttEnabled ? "#a78bfa" : "#71717a",
              transition: "none",
            }}
          >
            {sttEnabled ? "🎙 ON" : "🎙 OFF"}
          </button>

          {/* Leave */}
          <button
            onClick={onLeave}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              border: "1px solid rgba(239,68,68,0.3)",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
              background: "rgba(239,68,68,0.1)",
              color: "#f87171",
              transition: "none",
            }}
          >
            Quitter
          </button>
        </div>
      </header>

      {/* ── VIDEO GRID ─────────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: "12px", minHeight: 0, overflow: "hidden" }}>
        <VideoGrid />
      </main>

      {/* ── TRANSCRIPT BAR ──────────────────────────────────────────────── */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(9,9,11,0.9)",
          backdropFilter: "blur(12px)",
          flexShrink: 0,
        }}
      >
        {/* Interim (live transcription) */}
        <div
          style={{
            padding: "8px 20px",
            minHeight: "36px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {interimText ? (
            <>
              <span style={{ fontSize: "11px", color: "#a78bfa", fontWeight: 600, whiteSpace: "nowrap" }}>
                {username} :
              </span>
              <span style={{ fontSize: "13px", color: "#d4d4d8", fontStyle: "italic", flex: 1 }}>
                {interimText}
              </span>
              {isTranslating && <TranslatingDots />}
            </>
          ) : isTranslating ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <TranslatingDots />
              <span style={{ fontSize: "11px", color: "#52525b" }}>Traduction en cours…</span>
            </div>
          ) : null}
        </div>

        {/* Last translation */}
        {lastTranslation && (
          <div
            style={{
              padding: "6px 20px 10px",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
            }}
          >
            <span style={{ fontSize: "11px", color: "#22d3ee", fontWeight: 600, whiteSpace: "nowrap", marginTop: "2px" }}>
              {targetLang.flag} {targetLang.label} :
            </span>
            <span style={{ fontSize: "13px", color: "#67e8f9", flex: 1 }}>
              {lastTranslation.translated}
            </span>
          </div>
        )}
      </div>

      {/* ── AI AUDIO INJECTOR (invisible) ───────────────────────────────── */}
      {audioQueue && <AIAudioInjector queue={audioQueue} />}
    </div>
  );
}

// ─── LANGUAGE SELECTOR SUB-COMPONENT ─────────────────────────────────────────
function LangSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (code: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        background: "rgba(39,39,42,0.8)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "10px",
        padding: "5px 10px",
      }}
    >
      <span style={{ fontSize: "11px", color: "#71717a" }}>{label} :</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "transparent",
          border: "none",
          color: "#e4e4e7",
          fontSize: "13px",
          fontWeight: 500,
          outline: "none",
          cursor: "pointer",
          WebkitAppearance: "none",
        }}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} style={{ background: "#18181b" }}>
            {l.flag} {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── TRANSLATING INDICATOR ────────────────────────────────────────────────────
function TranslatingDots() {
  return (
    <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          style={{
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: "#22d3ee",
            animation: "bounce 0.9s ease-in-out infinite",
            animationDelay: `${delay}ms`,
            display: "inline-block",
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── LOBBY ────────────────────────────────────────────────────────────────────
function Lobby({ onJoin }: { onJoin: (username: string, room: string) => void }) {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("instant-talk-global");
  const [loading, setLoading] = useState(false);

  const handleJoin = () => {
    if (!username.trim() || loading) return;
    setLoading(true);
    onJoin(username.trim(), room.trim() || "instant-talk-global");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#09090b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "42px",
              fontWeight: 800,
              margin: "0 0 8px",
              background: "linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Instant Talk
          </h1>
          <p style={{ color: "#71717a", fontSize: "14px", margin: 0 }}>
            Communication mondiale. Sans barrières linguistiques.
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#111113",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "20px",
            padding: "28px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <LobbyInput
            label="Votre nom"
            value={username}
            onChange={setUsername}
            placeholder="ex : Marie Dupont"
            onEnter={handleJoin}
          />
          <LobbyInput
            label="Salle"
            value={room}
            onChange={setRoom}
            placeholder="ex : meeting-fr-jp-2025"
            onEnter={handleJoin}
          />

          <button
            onClick={handleJoin}
            disabled={!username.trim() || loading}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: "12px",
              border: "none",
              cursor: !username.trim() || loading ? "not-allowed" : "pointer",
              background: !username.trim() || loading
                ? "rgba(167,139,250,0.2)"
                : "linear-gradient(135deg, #7c3aed, #0891b2)",
              color: !username.trim() || loading ? "#71717a" : "#fff",
              fontSize: "14px",
              fontWeight: 600,
              marginTop: "4px",
            }}
          >
            {loading ? "Connexion…" : "Rejoindre →"}
          </button>
        </div>

        <p style={{ textAlign: "center", fontSize: "11px", color: "#3f3f46", marginTop: "20px" }}>
          Propulsé par LiveKit · Deepgram · Gemini 2.5 Flash · ElevenLabs
        </p>
      </div>
    </div>
  );
}

function LobbyInput({
  label, value, onChange, placeholder, onEnter,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onEnter: () => void;
}) {
  return (
    <div>
      <label
        style={{ display: "block", fontSize: "11px", color: "#71717a", marginBottom: "6px", fontWeight: 500 }}
      >
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter()}
        placeholder={placeholder}
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: "#18181b",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: "10px",
          padding: "11px 14px",
          color: "#e4e4e7",
          fontSize: "14px",
          outline: "none",
        }}
      />
    </div>
  );
}

// ─── ROOT PAGE ────────────────────────────────────────────────────────────────
export default function Page() {
  const [phase, setPhase] = useState<"lobby" | "room">("lobby");
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [myLang, setMyLang] = useState<LangConfig>(LANGUAGES[0]);    // Français
  const [targetLang, setTargetLang] = useState<LangConfig>(LANGUAGES[2]); // 日本語

  const handleJoin = useCallback(async (name: string, room: string) => {
    const res = await fetch("/api/livekit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room, username: name }),
    });
    if (!res.ok) { alert("Impossible de rejoindre la salle."); return; }
    const { token: t } = await res.json();
    setToken(t);
    setUsername(name);
    setPhase("room");
  }, []);

  const handleLeave = useCallback(() => {
    setPhase("lobby");
    setToken("");
  }, []);

  if (phase === "lobby") return <Lobby onJoin={handleJoin} />;

  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      connect={true}
      //
      // ── PRIORITY 1 CORE ──────────────────────────────────────────────────
      // Native mic = DISABLED. Only our AIAudioInjector publishes audio.
      // Camera = enabled for video presence.
      //
      video={true}
      audio={false}
      //
      options={{
        // Stable grid: disable adaptive quality changes
        adaptiveStream: false,
        dynacast: false,
        // Ensure published video track doesn't flicker
        publishDefaults: {
          dtx: false,   // Disable discontinuous transmission
          red: false,   // Disable redundant audio encoding
          simulcast: false,
        },
      }}
      onDisconnected={handleLeave}
      // Hide LiveKit's default UI — we render our own
      style={{ display: "contents" }}
    >
      <ConferenceRoomInner
        username={username}
        myLang={myLang}
        targetLang={targetLang}
        onMyLangChange={setMyLang}
        onTargetLangChange={setTargetLang}
        onLeave={handleLeave}
      />
    </LiveKitRoom>
  );
}
