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

  useEffect(() => {
    if (!audioQueueRef.current) {
      const queue = new AudioQueue();
      audioQueueRef.current = queue;

      const mediaStreamTrack = queue.destination.stream.getAudioTracks()[0];
      const localTrack = new LocalAudioTrack(mediaStreamTrack);
      synthTrackRef.current = localTrack;
    }
    return () => { synthTrackRef.current?.stop(); };
  }, []);

  useEffect(() => {
    if (localParticipant && synthTrackRef.current) {
      localParticipant.publishTrack(synthTrackRef.current, {
        name: "translation-track",
        source: Track.Source.Microphone,
      });
    }
  }, [localParticipant]);

  useEffect(() => {
    if (!room) return;
    const handleDataReceived = (payload: Uint8Array) => {
      const data = JSON.parse(new TextDecoder().decode(payload));
      if (data.type === "interrupt") {
        audioQueueRef.current?.flush();
      }
    };
    room.on("dataReceived", handleDataReceived);
    return () => { room.off("dataReceived", handleDataReceived); };
  }, [room]);

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
  const token = "";

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
