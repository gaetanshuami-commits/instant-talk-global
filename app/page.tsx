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

  // 1. Initialisation AudioQueue & LocalAudioTrack (WebRTC Injection)
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

  // 2. Publication du flux traduit vers LiveKit
  useEffect(() => {
    if (localParticipant && synthTrackRef.current) {
      localParticipant.publishTrack(synthTrackRef.current, {
        name: "translation-track",
        source: Track.Source.Microphone,
      });
    }
  }, [localParticipant]);

  // 3. Système d'interruption DataChannel (Anti-superposition)
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array) => {
      const data = JSON.parse(new TextDecoder().decode(payload));
      if (data.type === "interrupt") {
        // Coupe instantanément l'audio en cours de lecture
        audioQueueRef.current?.flush();
      }
    };

    room.on("dataReceived", handleDataReceived);
    return () => {
      room.off("dataReceived", handleDataReceived);
    };
  }, [room]);

  // --- CÂBLAGE DES ÉVÉNEMENTS STT ET TRADUCTION ---

  // A. À appeler par le WebSocket Deepgram quand l'utilisateur local commence à parler
  const onLocalSpeechStart = () => {
    if (room && localParticipant) {
      // Envoi du signal d'interruption aux autres participants
      const payload = new TextEncoder().encode(JSON.stringify({ type: "interrupt" }));
      localParticipant.publishData(payload, { reliable: true });
    }
  };

  // B. À appeler quand l'API Gemini retourne une traduction texte
  const onTranslationReceived = (translatedText: string, targetLanguageVoice: string) => {
    // Ex: targetLanguageVoice = "ja-JP-NanamiNeural"
    if (audioQueueRef.current) {
      speakAzureStream(translatedText, targetLanguageVoice, audioQueueRef.current);
    }
  };

  return (
    <div className="p-4 border border-zinc-800 bg-zinc-950 rounded-xl mt-4">
      <p className="text-sm font-mono text-emerald-500">
        [Système] Pipeline WebRTC / Azure TTS Actif
      </p>
      <p className="text-xs font-mono text-zinc-500 mt-2">
        ElevenLabs: Purged | DataChannel: Ready
      </p>
    </div>
  );
}

export default function Page() {
  const roomUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "";
  const token = ""; // À remplacer dynamiquement

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      {roomUrl ? (
        <LiveKitRoom serverUrl={roomUrl} token={token} connect={false}>
          <InstantTalkRoom />
          <RoomAudioRenderer />
        </LiveKitRoom>
      ) : (
        <p className="font-mono text-zinc-500">En attente des credentials LiveKit...</p>
      )}
    </main>
  );
}
