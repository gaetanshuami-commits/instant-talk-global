"use client";

import { useState } from 'react';
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';

export default function Home() {
  const [token, setToken] = useState("");
  const [roomName, setRoomName] = useState("reunion-test");

  const joinMeeting = async () => {
    try {
      const resp = await fetch(`/api/get-participant-token?room=${roomName}&username=user-${Math.floor(Math.random() * 1000)}`);
      const data = await resp.json();
      setToken(data.token);
    } catch (e) { console.error(e); }
  };

  if (token === "") {
    return (
      <main className="flex flex-col h-[100dvh] bg-black text-white items-center justify-center p-4">
          <h1 className="text-3xl font-bold mb-6 italic">Instant Talk <span className="text-blue-500">Global</span></h1>
          <button onClick={joinMeeting} className="bg-blue-600 px-8 py-4 rounded-xl font-bold">Démarrer</button>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-[100dvh] bg-black">
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        className="flex-1"
      >
        <ConferenceLayout />
        <RoomAudioRenderer />
        <ControlBar />
      </LiveKitRoom>
    </main>
  );
}

function ConferenceLayout() {
  // On ne passe PLUS d'arguments à useTracks pour que LiveKit décide seul (ZÉRO ERREUR POSSIBLE)
  const tracks = useTracks();

  return (
    <GridLayout tracks={tracks} style={{ height: '100vh' }}>
      <ParticipantTile />
    </GridLayout>
  );
}
