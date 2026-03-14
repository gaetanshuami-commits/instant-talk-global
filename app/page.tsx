"use client";

import { useEffect, useRef } from "react";
import { useRoom, useLocalParticipant, LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import { LocalAudioTrack, Track } from "livekit-client";
import { AudioQueue } from "@/lib/AudioQueue";
import { speakAzureStream } from "@/lib/azureSpeech";

function InstantTalkRoom() {
  const { room } = useRoom();
  const { localParticipant } = useLocalParticipant();
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const synthTrackRef = useRef<LocalAudioTrack | null>(null);

  // Initialisation de l'AudioQueue et du LocalAudioTrack
  useEffect(() => {
    if (!audioQueueRef.current) {
      const queue = new AudioQueue();
      audioQueueRef.current = queue;

      const mediaStreamTrack = queue.destination.stream.getAudioTracks()[0];
      const localTrack = new LocalAudioTrack(mediaStreamTrack);
      synthTrackRef.current = localTrack;
    }

    return () => {
      synthTrackRef.current?.stop();
    };
  }, []);

  // Publication du track de traduction dans LiveKit
  useEffect(() => {
    if (localParticipant && synthTrackRef.current) {
      localParticipant.publishTrack(synthTrackRef.current, {
        name: "translation-track",
        source: Track.Source.Microphone,
      });
    }
  }, [localParticipant]);

  // Écoute du DataChannel pour les interruptions (Audio Drift prevention)
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array) => {
      const data = JSON.parse(new TextDecoder().decode(payload));
      if (data.type === "interrupt") {
        audioQueueRef.current?.flush();
      }
    };

    room.on("dataReceived", handleDataReceived);
    return () => room.off("dataReceived", handleDataReceived);
  }, [room]);

  // Fonction appelée par le STT (Deepgram) quand l'utilisateur parle
  const handleLocalSpeechStart = () => {
    if (room && localParticipant) {
      const payload = new TextEncoder().encode(JSON.stringify({ type: "interrupt" }));
      localParticipant.publishData(payload, { reliable: true });
    }
  };

  // Fonction appelée à la réception de la traduction (Gemini)
  const handleTranslationReceived = (translatedText: string, targetVoice: string) => {
    if (audioQueueRef.current) {
      speakAzureStream(translatedText, targetVoice, audioQueueRef.current);
    }
  };

  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl mt-8 text-center">
      <p className="text-green-400 font-mono text-sm">
        ● Pipeline WebRTC & Azure Streaming prêt
      </p>
    </div>
  );
}

export default function Home() {
  const roomUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://your-livekit-url";
  const token = ""; // À remplacer par le vrai token LiveKit

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-black text-white">
      <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Instant Talk</h1>
      <p className="text-zinc-400 mb-8">Global B2B Communication</p>
      
      <LiveKitRoom serverUrl={roomUrl} token={token} connect={false}>
        <InstantTalkRoom />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </main>
  );
}
