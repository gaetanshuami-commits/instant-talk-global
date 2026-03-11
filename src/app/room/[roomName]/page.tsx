"use client";

import '@livekit/components-styles';
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';
import { VideoPresets } from 'livekit-client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RoomPage({ params }: { params: { roomName: string } }) {
  const [token, setToken] = useState("");
  const router = useRouter();
  const roomName = params.roomName;
  const userName = "User_" + Math.floor(Math.random() * 1000);

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(`/api/livekit?room=${roomName}&username=${userName}`);
        const data = await resp.json();
        if (data.token) setToken(data.token);
      } catch (e) {
        console.error("Erreur de récupération du token", e);
      }
    })();
  }, [roomName]);

  if (token === "") {
    return <div className="flex items-center justify-center min-h-screen text-white bg-black font-bold text-xl">Initialisation du flux 1080p...</div>;
  }

  return (
    <div className="h-screen w-full bg-black" data-lk-theme="default">
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        options={{
          videoCaptureDefaults: {
            resolution: VideoPresets.h1080.resolution,
          },
          publishDefaults: {
            videoEncoding: VideoPresets.h1080.encoding,
          }
        }}
        onDisconnected={() => router.push('/')}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}