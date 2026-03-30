"use client";

import { useEffect, useRef, useState } from "react";
import { type Room, RoomEvent, LocalAudioTrack } from "livekit-client";

type Props = {
  room: Room;
  muteOriginalMic: () => Promise<void>;
  unmuteOriginalMic: () => Promise<void>;
};

// LISTE COMPLÈTE RESTAURÉE (Sans Lingala)
const LANGUAGE_OPTIONS = [
  { value: "FR", label: "Français" }, { value: "EN", label: "English" },
  { value: "ES", label: "Español" }, { value: "DE", label: "Deutsch" },
  { value: "ZH", label: "Mandarin / 中文" }, { value: "AR", label: "العربية" },
  { value: "HI", label: "हिन्दी" }, { value: "PT", label: "Português" },
  { value: "RU", label: "Русский" }, { value: "JA", label: "日本語" },
  { value: "BN", label: "বাংলা" }, { value: "IT", label: "Italiano" },
  { value: "NL", label: "Nederlands" }, { value: "LB", label: "Lëtzebuergesch" },
  { value: "EL", label: "Ελληνικά" }, { value: "SV", label: "Svenska" },
  { value: "NO", label: "Norsk" }, { value: "DA", label: "Dansk" },
  { value: "FI", label: "Suomi" }, { value: "IS", label: "Íslenska" },
  { value: "PL", label: "Polski" }, { value: "UK", label: "Українська" },
  { value: "CS", label: "Čeština" }, { value: "SK", label: "Slovenčina" },
  { value: "HU", label: "Magyar" }, { value: "RO", label: "Română" },
  { value: "BG", label: "Български" }, { value: "KO", label: "한국어" },
  { value: "TR", label: "Türkçe" }, { value: "HE", label: "עברית" },
  { value: "SW", label: "Kiswahili" }
];

const VOICES: Record<string, { F: string; M: string }> = {
  FR: { F: "fr-FR-DeniseNeural", M: "fr-FR-HenriNeural" },
  EN: { F: "en-US-JennyNeural", M: "en-US-GuyNeural" },
  ES: { F: "es-ES-ElviraNeural", M: "es-ES-AlvaroNeural" },
  DE: { F: "de-DE-KatjaNeural", M: "de-DE-ConradNeural" },
  ZH: { F: "zh-CN-XiaoxiaoNeural", M: "zh-CN-YunxiNeural" },
  AR: { F: "ar-SA-ZariyahNeural", M: "ar-SA-HamedNeural" },
  HI: { F: "hi-IN-SwaraNeural", M: "hi-IN-MadhurNeural" },
  PT: { F: "pt-BR-FranciscaNeural", M: "pt-BR-AntonioNeural" },
  RU: { F: "ru-RU-SvetlanaNeural", M: "ru-RU-DmitryNeural" },
  JA: { F: "ja-JP-NanamiNeural", M: "ja-JP-KeitaNeural" },
  IT: { F: "it-IT-ElsaNeural", M: "it-IT-DiegoNeural" },
  NL: { F: "nl-NL-ColetteNeural", M: "nl-NL-MaartenNeural" },
  EL: { F: "el-GR-AthinaNeural", M: "el-GR-NestorasNeural" },
  SV: { F: "sv-SE-SofieNeural", M: "sv-SE-MattiasNeural" },
  NO: { F: "nb-NO-PernilleNeural", M: "nb-NO-FinnNeural" },
  DA: { F: "da-DK-ChristelNeural", M: "da-DK-JeppeNeural" },
  FI: { F: "fi-FI-NooraNeural", M: "fi-FI-HarriNeural" },
  PL: { F: "pl-PL-ZofiaNeural", M: "pl-PL-MarekNeural" },
  UK: { F: "uk-UA-PolinaNeural", M: "uk-UA-OstapNeural" },
  CS: { F: "cs-CZ-VlastaNeural", M: "cs-CZ-AntoninNeural" },
  SK: { F: "sk-SK-ViktoriaNeural", M: "sk-SK-LukasNeural" },
  HU: { F: "hu-HU-NoemiNeural", M: "hu-HU-TamasNeural" },
  RO: { F: "ro-RO-AlinaNeural", M: "ro-RO-EmilNeural" },
  BG: { F: "bg-BG-KalinaNeural", M: "bg-BG-BorislavNeural" },
  KO: { F: "ko-KR-SunHiNeural", M: "ko-KR-InJoonNeural" },
  TR: { F: "tr-TR-EmelNeural", M: "tr-TR-AhmetNeural" },
  HE: { F: "he-IL-HilaNeural", M: "he-IL-AvriNeural" },
  SW: { F: "sw-KE-ZuriNeural", M: "sw-KE-RafikiNeural" },
  BN: { F: "bn-IN-TanishaaNeural", M: "bn-IN-BashkarNeural" },
  LB: { F: "de-DE-KatjaNeural", M: "de-DE-ConradNeural" },
  IS: { F: "is-IS-GudrunNeural", M: "is-IS-GunnarNeural" }
};

export default function RealtimeVoiceOverlay({ room, muteOriginalMic, unmuteOriginalMic }: Props) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [targetLang, setTargetLang] = useState("EN");
  const [gender, setGender] = useState<"F" | "M">("M");
  const [status, setStatus] = useState("En attente d'activation");
  const [heardText, setHeardText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [remoteSubtitle, setRemoteSubtitle] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const subtitleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const audioQueueRef = useRef<(() => Promise<void>)[]>([]);
  const isPlayingRef = useRef(false);

  const muteRef = useRef(muteOriginalMic);
  const unmuteRef = useRef(unmuteOriginalMic);
  
  useEffect(() => {
    muteRef.current = muteOriginalMic;
    unmuteRef.current = unmuteOriginalMic;
  }, [muteOriginalMic, unmuteOriginalMic]);

  useEffect(() => {
    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const str = new TextDecoder().decode(payload);
        const data = JSON.parse(str);
        if (data.type === 'translation-subtitle' || data.type === 'translation') {
          setRemoteSubtitle(data.text);
          if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
          subtitleTimeoutRef.current = setTimeout(() => { setRemoteSubtitle(""); }, 5000);
          
          // Si on reçoit l'audio de l'autre
          if (data.type === 'translation' && data.voice) {
             playRemoteVoice(data.text, data.lang, data.voice);
          }
        }
      } catch (err) {}
    };
    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => { room.off(RoomEvent.DataReceived, handleDataReceived); };
  }, [room]);

  async function playRemoteVoice(text: string, lang: string, voiceName: string) {
      try {
        const ttsRes = await fetch("/api/azure-tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, lang, voiceName })
        });
        if (!ttsRes.ok) return;
        const arrayBuffer = await ttsRes.arrayBuffer();
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.start();
      } catch(e) {}
  }

  const processAudioQueue = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    isPlayingRef.current = true;
    while (audioQueueRef.current.length > 0) {
      const playNext = audioQueueRef.current.shift();
      if (playNext) await playNext();
    }
    isPlayingRef.current = false;
  };

  useEffect(() => {
    if (!isUnlocked) return;
    let isActive = true;
    let lastInterimTranslate = 0; 

    async function startContinuousTranslation() {
      try {
        setStatus("Connexion Haut Débit...");

        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
        });
        streamRef.current = stream;

        try { await muteRef.current(); } catch (e) {}
        try {
          if (room.localParticipant && room.state === 'connected') {
            await room.localParticipant.setMicrophoneEnabled(false);
          }
        } catch (e) {}

        const tokenRes = await fetch("/api/deepgram-token");
        const { token } = await tokenRes.json();

        const ws = new WebSocket(
          "wss://api.deepgram.com/v1/listen?model=nova-2&language=fr&interim_results=true&smart_format=true&endpointing=300",
          ["token", token]
        );
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isActive) return;
          setStatus("En direct ⚡");
          let mimeType = "audio/webm;codecs=opus";
          if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "audio/webm";

          const recorder = new MediaRecorder(stream, { mimeType });
          mediaRecorderRef.current = recorder;
          recorder.ondataavailable = async (e) => {
            if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) ws.send(e.data);
          };
          recorder.start(100); 
        };

        ws.onmessage = async (event) => {
          if (!isActive) return;
          const json = JSON.parse(event.data);
          const text = String(json.channel?.alternatives?.[0]?.transcript ?? "").trim();

          if (!text) return;
          
          setHeardText(text);
          const isFinal = json.is_final;
          const now = Date.now();

          // ACCÉLÉRATION : On descend le blocage de 800ms à 300ms pour une écriture beaucoup plus agressive et rapide
          if (!isFinal && (now - lastInterimTranslate < 300)) {
            return; 
          }
          if (!isFinal) {
            lastInterimTranslate = now;
          }

          setTargetLang((currentLang) => {
            setGender((currentGender) => {
              (async () => {
                try {
                  const translate = await fetch("/api/translate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text, targetLang: currentLang }),
                  });

                  const result = await translate.json();

                  if (result?.translatedText && isActive) {
                    setTranslatedText(result.translatedText);
                    
                    if (room.state === 'connected' && room.localParticipant) {
                      const payloadData = JSON.stringify({ type: 'translation-subtitle', text: result.translatedText });
                      const encodedPayload = new TextEncoder().encode(payloadData);
                      await room.localParticipant.publishData(encodedPayload, { reliable: true });
                    }

                    // AUDIO INSTANTANÉ AU SOUFFLE (isFinal = true)
                    if (isFinal) {
                      const selectedVoice = VOICES[currentLang]?.[currentGender] || VOICES["EN"].F;
                      
                      if (room.state === 'connected' && room.localParticipant) {
                          const audioPayload = JSON.stringify({ type: 'translation', text: result.translatedText, lang: currentLang, voice: selectedVoice });
                          const encodedAudioPayload = new TextEncoder().encode(audioPayload);
                          await room.localParticipant.publishData(encodedAudioPayload, { reliable: true });
                      }
                    }
                  }
                } catch (e) {}
              })();
              return currentGender;
            });
            return currentLang;
          });
        };

        ws.onerror = () => { if (isActive) setStatus("Erreur réseau Deepgram"); };
      } catch (error) {
        if (isActive) setStatus("Erreur d'accès Micro");
      }
    }

    startContinuousTranslation();

    return () => {
      isActive = false;
      try { mediaRecorderRef.current?.stop(); } catch {}
      try { wsRef.current?.close(); } catch {}
      try { streamRef.current?.getTracks().forEach((track) => track.stop()); } catch {}
      try {
        if (room.localParticipant && room.state === 'connected') {
          room.localParticipant.setMicrophoneEnabled(true).catch(() => {});
        }
        unmuteRef.current().catch(() => {});
      } catch (e) {}
    };
  }, [room, isUnlocked]);

  if (!isUnlocked) {
    return (
      <div className="absolute bottom-6 right-6 z-[9999]">
        <button 
          onClick={() => setIsUnlocked(true)}
          className="w-[300px] rounded-2xl border border-indigo-500/50 bg-indigo-600/90 p-5 text-center text-sm font-bold text-white shadow-xl backdrop-blur transition hover:bg-indigo-500 hover:scale-105 active:scale-95"
        >
          Déverrouiller le traducteur
          <div className="mt-1 text-[10px] font-normal text-white/70">
            Activation du mode Flux Continu
          </div>
        </button>
      </div>
    );
  }

  return (
    <>
      {remoteSubtitle && (
        <div className="pointer-events-none fixed bottom-12 left-0 right-0 z-[9998] flex w-full justify-center px-8">
          <div className="max-w-4xl rounded-xl bg-black/80 px-6 py-4 text-center text-3xl font-bold text-yellow-400 drop-shadow-[0_4px_12px_rgba(0,0,0,1)]">
            {remoteSubtitle}
          </div>
        </div>
      )}

      <div className="absolute bottom-6 right-6 z-[9999]">
        <div className="w-[300px] rounded-2xl border border-white/10 bg-black/85 p-3 text-white shadow-xl backdrop-blur">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/55 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Auto-Translate
            </span>
            <span className="text-[11px] text-white/60 font-medium">{status}</span>
          </div>

          <div className="mb-2 flex gap-2">
            <button 
              onClick={() => setGender("M")}
              className={`flex-1 rounded-lg py-1.5 text-[11px] font-medium transition ${gender === "M" ? "bg-indigo-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
            >
              Voix Homme
            </button>
            <button 
              onClick={() => setGender("F")}
              className={`flex-1 rounded-lg py-1.5 text-[11px] font-medium transition ${gender === "F" ? "bg-indigo-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
            >
              Voix Femme
            </button>
          </div>

          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="mb-2 w-full rounded-lg border border-white/10 bg-black px-3 py-2 text-xs text-white outline-none"
            style={{ backgroundColor: "#020617", color: "#ffffff" }}
          >
            {LANGUAGE_OPTIONS.map((language) => (
              <option key={language.value} value={language.value} style={{ backgroundColor: "#020617", color: "#ffffff" }}>
                {language.label}
              </option>
            ))}
          </select>

          <div className="mb-2 min-h-[58px] rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-xs text-white/80">
            <div className="mb-1 text-[10px] uppercase tracking-[0.15em] text-white/40">Entendu (FR)</div>
            <div className="italic">{heardText || "Je vous écoute..."}</div>
          </div>

          <div className="min-h-[58px] rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-xs text-white/90">
            <div className="mb-1 text-[10px] uppercase tracking-[0.15em] text-white/40">Traduit</div>
            <div className="font-semibold text-yellow-400">{translatedText || "..."}</div>
          </div>
        </div>
      </div>
    </>
  );
}
