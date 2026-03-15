"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  LiveKitRoom,
  useRoomContext,
  useLocalParticipant,
  RoomAudioRenderer
} from "@livekit/components-react";
import { LocalAudioTrack, Track } from "livekit-client";

import { AudioQueue } from "../lib/AudioQueue";

const LANG_CONFIG = {
  fr: { code: "fr", target: "en", azureVoice: "en-US-JennyNeural" },
  en: { code: "en", target: "fr", azureVoice: "fr-FR-VivienneMultilingualNeural" }
};

function InstantTalkRoom({ userLang }: { userLang: "fr" | "en" }) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();

  const audioQueueRef = useRef<AudioQueue | null>(null);
  const synthTrackRef = useRef<LocalAudioTrack | null>(null);
  const isSpeakingRef = useRef<boolean>(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");

  const config = LANG_CONFIG[userLang];

  const stopRecordingSafely = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    socketRef.current?.close();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsRecording(false);
  }, []);

  useEffect(() => {
    if (!audioQueueRef.current) {
      const queue = new AudioQueue();
      audioQueueRef.current = queue;

      const mediaStreamTrack = queue.destination.stream.getAudioTracks()[0];
      synthTrackRef.current = new LocalAudioTrack(mediaStreamTrack);
    }
    return () => synthTrackRef.current?.stop();
  }, []);

  useEffect(() => {
    if (room?.state === "connected" && localParticipant && synthTrackRef.current) {
      const hasTrack = Array.from(localParticipant.audioTracks.values()).some(
        (pub) => pub.track === synthTrackRef.current
      );
      if (!hasTrack) {
        localParticipant.publishTrack(synthTrackRef.current, {
          name: "translation-track",
          source: Track.Source.Microphone,
        }).catch(console.error);
      }
    }
  }, [room?.state, localParticipant]);

  useEffect(() => {
    if (!room) return;
    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        if (data.type === "interrupt") audioQueueRef.current?.flush();
      } catch (err) {
        console.error("DataChannel parsing error:", err);
      }
    };
    room.on("dataReceived", handleDataReceived);
    return () => room.off("dataReceived", handleDataReceived);
  }, [room]);

  const onLocalSpeechStart = useCallback(() => {
    if (!isSpeakingRef.current && room?.state === "connected" && localParticipant) {
      isSpeakingRef.current = true;
      const payload = new TextEncoder().encode(JSON.stringify({ type: "interrupt" }));
      localParticipant.publishData(payload, { reliable: true });
    }
  }, [room?.state, localParticipant]);

  const onLocalSpeechEnd = useCallback(() => {
    isSpeakingRef.current = false;
  }, []);

  const translateAndSpeak = async (textToTranslate: string) => {
    try {
      const agentRes = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToTranslate, sourceLang: config.code, targetLang: config.target }),
      });
      
      if (!agentRes.ok) throw new Error("Erreur traduction");
      const { translatedText } = await agentRes.json();

      if (translatedText && audioQueueRef.current) {
        const ttsRes = await fetch("/api/azure-tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: translatedText, voiceName: config.azureVoice })
        });

        if (!ttsRes.ok) throw new Error("Erreur Azure TTS");

        const reader = ttsRes.body?.getReader();
        if (!reader) return;

        let remainder: Uint8Array | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          let chunk = value;

          if (remainder) {
            chunk = new Uint8Array(remainder.length + value.length);
            chunk.set(remainder);
            chunk.set(value, remainder.length);
            remainder = null;
          }

          if (chunk.length % 2 !== 0) {
            remainder = chunk.slice(-1);
            chunk = chunk.slice(0, -1);
          }

          if (chunk.length > 0) {
            const buffer = chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength);
            audioQueueRef.current.addPCM16(buffer);
          }
        }
      }
    } catch (err) {
      console.error("Erreur pipeline:", err);
    }
  };

  const toggleMicrophone = async () => {
    if (isRecording) {
      stopRecordingSafely();
      setLiveTranscript("");
      return;
    }

    try {
      const tokenRes = await fetch("/api/deepgram-token");
      const { token } = await tokenRes.json();
      
      if (!token) return alert("Impossible de récupérer le token éphémère Deepgram.");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const wsUrl = `wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true&endpointing=300&language=${config.code}`;
      const ws = new WebSocket(wsUrl, ["token", token]);
      socketRef.current = ws;

      ws.onopen = () => {
        const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.addEventListener("dataavailable", (e) => {
          if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) ws.send(e.data);
        });
        
        mediaRecorder.start(250);
        setIsRecording(true);
      };

      ws.onmessage = (message) => {
        const data = JSON.parse(message.data);
        if (data.type === "Results") {
          const transcript = data.channel?.alternatives?.[0]?.transcript ?? "";
          const isFinal = data.is_final;

          if (transcript) setLiveTranscript(transcript);

          if (isFinal) {
            onLocalSpeechEnd();
            if (transcript.trim().length > 0) {
              translateAndSpeak(transcript);
              setLiveTranscript(""); 
            }
          } else if (transcript.trim().length > 0) {
            onLocalSpeechStart();
          }
        }
      };

      ws.onclose = () => stopRecordingSafely();

    } catch (err) {
      console.error("Erreur Micro:", err);
      stopRecordingSafely();
    }
  };

  useEffect(() => {
    return () => stopRecordingSafely();
  }, [stopRecordingSafely]);

  return (
    <div className="p-6 border border-zinc-800 bg-zinc-950 rounded-xl mt-4 flex flex-col gap-4">
      <div>
        <p className="text-sm font-mono text-emerald-500">
          [Système] {config.code.toUpperCase()} → {config.target.toUpperCase()} | Audio 48kHz
        </p>
      </div>
      <button
        onClick={toggleMicrophone}
        className={`px-4 py-3 font-bold rounded-lg ${isRecording ? "bg-red-600" : "bg-blue-600"}`}
      >
        {isRecording ? "🔴 Arrêter le Micro" : "🎙️ Activer le Micro"}
      </button>
      {liveTranscript && (
        <div className="mt-2 p-3 bg-zinc-900 rounded-md border border-zinc-800">
          <p className="text-sm text-zinc-300 italic">"{liveTranscript}"</p>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  const roomUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "";
  const [token, setToken] = useState("");
  const [userLang, setUserLang] = useState<"fr" | "en">("fr");

  useEffect(() => {
    fetch("/api/livekit/get-token").then(r => r.json()).then(d => { if (d.token) setToken(d.token); });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4">
      <div className="mb-6 flex gap-4 bg-zinc-900 p-2 rounded-lg">
        <button onClick={() => setUserLang("fr")} className={`px-4 py-2 rounded ${userLang === "fr" ? "bg-emerald-600" : "hover:bg-zinc-800"}`}>Français</button>
        <button onClick={() => setUserLang("en")} className={`px-4 py-2 rounded ${userLang === "en" ? "bg-emerald-600" : "hover:bg-zinc-800"}`}>Anglais</button>
      </div>
      {roomUrl && token ? (
        <LiveKitRoom serverUrl={roomUrl} token={token} connect={true}>
          <InstantTalkRoom userLang={userLang} />
          <RoomAudioRenderer />
        </LiveKitRoom>
      ) : <p className="text-zinc-500">Initialisation...</p>}
    </main>
  );
}
