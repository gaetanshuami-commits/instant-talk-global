"use client";

import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  GridLayout,
  ParticipantTile,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";

function StableGrid() {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);

  return (
    <GridLayout tracks={tracks} style={{ height: "calc(100% - 65px)" }}>
      <ParticipantTile />
    </GridLayout>
  );
}

export default function Page() {
  const roomUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "";
  const [token, setToken] = useState("");
  const [userLang, setUserLang] = useState<"fr" | "en">("fr");

  useEffect(() => {
    fetch("/api/livekit/get-token")
      .then((r) => r.json())
      .then((d) => {
        if (d.token) setToken(d.token);
      })
      .catch((err) => console.error("Erreur récupération token LiveKit:", err));
  }, []);

  if (!roomUrl || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-zinc-500 animate-pulse font-mono">
          [Système] Connexion à la salle sécurisée...
        </p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-black text-white">
      <header className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
        <h1 className="text-xl font-bold tracking-tight">Instant Talk Global</h1>
        
        <div className="flex gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setUserLang("fr")}
            className={`px-4 py-1.5 text-sm rounded font-medium transition-colors ${
              userLang === "fr" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            Français
          </button>
          <button
            onClick={() => setUserLang("en")}
            className={`px-4 py-1.5 text-sm rounded font-medium transition-colors ${
              userLang === "en" ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            Anglais
          </button>
        </div>
      </header>

      <div className="flex-grow flex flex-col p-4">
        <LiveKitRoom
          serverUrl={roomUrl}
          token={token}
          connect={true}
          audio={false}
          video={false}
          data-lk-theme="default"
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          <StableGrid />
          <ControlBar controls={{ microphone: true, camera: true, screenShare: false }} />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </main>
  );
}
