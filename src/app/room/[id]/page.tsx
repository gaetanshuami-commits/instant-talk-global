"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  LiveKitRoom, 
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { premiumRoomOptions } from "@/lib/livekit-options";

export default function MeetingRoom() {
  const params = useParams();
  const router = useRouter();
  const roomName = params.id as string;
  const [token, setToken] = useState("");

  useEffect(() => {
    if (!roomName) return;
    (async () => {
      try {
        const resp = await fetch(`/api/livekit/get-token?room=${roomName}`);
        if (!resp.ok) throw new Error("Erreur réseau");
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error("Erreur critique:", e);
      }
    })();
  }, [roomName]);

  if (!token) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-950 text-white font-medium">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          Préparation de votre salle sécurisée...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-neutral-950" data-lk-theme="default">
      <LiveKitRoom
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        connect={true}
        options={premiumRoomOptions}
        onDisconnected={() => router.push('/dashboard')}
        style={{ height: "100%" }}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}