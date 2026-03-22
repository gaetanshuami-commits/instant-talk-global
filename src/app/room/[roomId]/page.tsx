"use client";

import { useEffect, useRef, useState } from "react";
import {
  Room,
  Track
} from "livekit-client";
import { useParams } from "next/navigation";

export default function RoomPage() {
  const params = useParams();
  const roomId = String(params.roomId || "");

  const [room] = useState(() => new Room());
  const [connected, setConnected] = useState(false);
  const [videoTrack, setVideoTrack] = useState<any>(null);

  const [targetLang, setTargetLang] = useState("EN");
  const [liveCaption, setLiveCaption] = useState("Live captions are ready.");
  const [translatedCaption, setTranslatedCaption] = useState("Translated captions will appear here.");
  const [captionsRunning, setCaptionsRunning] = useState(false);
  const [captionSpeaker] = useState("You");
  const [translationLoading, setTranslationLoading] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const languageOptions = [
    { code: "FR", label: "Francais" },
    { code: "EN", label: "English" },
    { code: "DE", label: "Deutsch" },
    { code: "ES", label: "Espanol" },
    { code: "IT", label: "Italiano" },
    { code: "NL", label: "Nederlands" },
    { code: "PT", label: "Portugues" },
    { code: "AR", label: "Arabic" },
    { code: "ZH", label: "Chinese" },
    { code: "JA", label: "Japanese" }
  ];

  const voiceMap: Record<string, string> = {
    FR: "fr-FR-DeniseNeural",
    EN: "en-US-JennyNeural",
    DE: "de-DE-KatjaNeural",
    ES: "es-ES-ElviraNeural",
    IT: "it-IT-ElsaNeural",
    NL: "nl-NL-ColetteNeural",
    PT: "pt-PT-RaquelNeural",
    AR: "ar-SA-ZariyahNeural",
    ZH: "zh-CN-XiaoxiaoNeural",
    JA: "ja-JP-NanamiNeural"
  };

  useEffect(() => {
    async function connectRoom() {
      try {
        const userId = "user-" + Math.floor(Math.random() * 9999);

        const res = await fetch("/api/livekit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            roomName: roomId,
            userId
          })
        });

        const data = await res.json();

        await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, data.token);
        await room.localParticipant.enableCameraAndMicrophone();

        const tracks = room.localParticipant.videoTrackPublications;

        tracks.forEach((pub) => {
          if (pub.track && pub.track.kind === Track.Kind.Video) {
            setVideoTrack(pub.track);
          }
        });

        setConnected(true);
      } catch (error) {
        console.error("ROOM ERROR", error);
      }
    }

    connectRoom();

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "close" }));
        socketRef.current.close();
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }

      room.disconnect();
    };
  }, [room, roomId]);

  useEffect(() => {
    if (!videoTrack) return;

    const el = document.getElementById("local-video") as HTMLVideoElement | null;
    if (!el) return;

    videoTrack.attach(el);

    return () => {
      videoTrack.detach(el);
    };
  }, [videoTrack]);

  useEffect(() => {
    let cancelled = false;

    async function translateCaption() {
      try {
        if (
          !liveCaption ||
          liveCaption === "Live captions are ready." ||
          liveCaption === "Listening..." ||
          liveCaption === "Opening captions..."
        ) {
          return;
        }

        if (targetLang === "FR") {
          setTranslatedCaption(liveCaption);
          return;
        }

        setTranslationLoading(true);

        const res = await fetch("/api/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text: liveCaption,
            sourceLang: "FR",
            targetLang
          })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.details || data?.error || "Translation failed");
        }

        if (!cancelled) {
          setTranslatedCaption(data?.translatedText || liveCaption);
        }
      } catch (error) {
        console.error("ROOM_TRANSLATION_ERROR", error);

        if (!cancelled) {
          setTranslatedCaption(liveCaption);
        }
      } finally {
        if (!cancelled) {
          setTranslationLoading(false);
        }
      }
    }

    translateCaption();

    return () => {
      cancelled = true;
    };
  }, [liveCaption, targetLang]);

  async function startLiveCaptions() {
    try {
      if (captionsRunning) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = async (event) => {
        try {
          if (!event.data || event.data.size < 800) return;
          if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

          const arrayBuffer = await event.data.arrayBuffer();
          socketRef.current.send(arrayBuffer);
        } catch (error) {
          console.error("RECORDER_CHUNK_ERROR", error);
        }
      };

      const socket = new WebSocket("ws://127.0.0.1:8787");
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("CAPTIONS_BROWSER_SOCKET_OPEN");
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload?.type === "status") {
            if (
              payload?.value === "deepgram-open" &&
              mediaRecorderRef.current &&
              mediaRecorderRef.current.state === "inactive"
            ) {
              mediaRecorderRef.current.start(250);
              setCaptionsRunning(true);
              setLiveCaption("Listening...");
              setTranslatedCaption(targetLang === "FR" ? "Listening..." : "Translating...");
            }
            return;
          }

          if (payload?.type === "error") {
            console.error("BRIDGE_ERROR", payload?.message);
            setLiveCaption("Live captions bridge error.");
            return;
          }

          if (payload?.type === "transcript") {
            const transcript = String(payload?.transcript || "").trim();

            if (transcript) {
              setLiveCaption(transcript);

              if (targetLang === "FR") {
                setTranslatedCaption(transcript);
              }
            }
          }
        } catch (error) {
          console.error("SOCKET_MESSAGE_ERROR", error);
        }
      };

      socket.onerror = (error) => {
        console.error("SOCKET_ERROR", error);
        setLiveCaption("Live captions connection failed.");
      };

      socket.onclose = () => {
        setCaptionsRunning(false);
      };

      setLiveCaption("Opening captions...");
      setTranslatedCaption(targetLang === "FR" ? "Opening captions..." : "Preparing translation...");
    } catch (error) {
      console.error("START_CAPTIONS_ERROR", error);
      setLiveCaption("Unable to start live captions.");
      setTranslatedCaption("Unable to start translation.");
    }
  }

  function stopLiveCaptions() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "close" }));
      socketRef.current.close();
    }

    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;
    socketRef.current = null;
    setCaptionsRunning(false);
  }

  async function playTranslatedVoice() {
    try {
      const text = translatedCaption?.trim();

      if (
        !text ||
        text === "Translated captions will appear here." ||
        text === "Translating..." ||
        text === "Preparing translation..." ||
        text === "Unable to start translation."
      ) {
        return;
      }

      setVoiceLoading(true);

      const voiceName = voiceMap[targetLang] || voiceMap.EN;

      const res = await fetch("/api/azure-tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text,
          voiceName
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.details || data?.error || "Azure TTS failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.src) {
          URL.revokeObjectURL(audioRef.current.src);
        }
      }

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
      };

      await audio.play();
    } catch (error) {
      console.error("PLAY_TRANSLATED_VOICE_ERROR", error);
    } finally {
      setVoiceLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold">Room: {roomId}</h1>

      {!connected && (
        <p className="mt-4 text-gray-400">Connecting camera...</p>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div>
          <div className="h-[300px] w-[520px] overflow-hidden rounded-2xl border border-white/10 bg-black">
            <video
              id="local-video"
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover object-center scale-x-[-1]"
            />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-indigo-300">
              Live Captions
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
              <div className="mb-2 px-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                Output language
              </div>

              <div className="flex flex-wrap gap-2">
                {languageOptions.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setTargetLang(lang.code)}
                    className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                      targetLang === lang.code
                        ? "bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,91,255,0.35)]"
                        : "bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={startLiveCaptions}
                disabled={captionsRunning}
                className="rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                Start live captions
              </button>

              <button
                type="button"
                onClick={stopLiveCaptions}
                disabled={!captionsRunning}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                Stop
              </button>
            </div>

            <div className="mt-4 text-sm text-slate-400">
              Speaker: {captionSpeaker}
            </div>

            <div className="mt-4 min-h-[120px] rounded-xl border border-white/10 bg-black/30 p-4 text-sm leading-7 text-white">
              {liveCaption}
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-400/20 bg-[#10162a] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs uppercase tracking-[0.2em] text-indigo-300">
                Translated Captions
              </div>
              <div className="rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold text-indigo-200">
                {targetLang}
              </div>
            </div>

            <div className="mt-4 min-h-[120px] rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-4 text-sm leading-7 text-white">
              {translationLoading ? "Translating..." : translatedCaption}
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={playTranslatedVoice}
                disabled={voiceLoading || translationLoading}
                className="rounded-full border border-indigo-400/30 bg-indigo-500/15 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {voiceLoading ? "Generating voice..." : "Play translated voice"}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
