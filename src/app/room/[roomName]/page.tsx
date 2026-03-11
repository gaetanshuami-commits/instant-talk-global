"use client";

import '@livekit/components-styles';
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';
import { VideoPresets } from 'livekit-client';
import { useEffect, useState, useRef } from 'react';
import { AudioQueueManager } from '@/lib/AudioQueueManager';

export default function RoomPage({ params }: { params: { roomName: string } }) {
  const [token, setToken] = useState("");
  const audioManager = useRef<AudioQueueManager | null>(null);
  const roomName = params.roomName;

  useEffect(() => {
    // Initialisation du gestionnaire audio
    audioManager.current = new AudioQueueManager();

    (async () => {
      const resp = await fetch(`/api/livekit?room=${roomName}&username=User_${Math.floor(Math.random() * 100)}`);
      const data = await resp.json();
      if (data.token) setToken(data.token);
    })();
  }, [roomName]);

  // Fonction pour tester la traduction (à lier plus tard à la reconnaissance vocale automatique)
  const testTranslation = async (text: string) => {
    const res = await fetch('/api/translate', {
      method: 'POST',
      body: JSON.stringify({ text, targetLanguage: "English" }), // Test vers l'Anglais
    });
    const data = await res.json();
    if (data.audio) {
      audioManager.current?.addAudio(data.audio);
    }
  };

  if (token === "") return <div className="flex items-center justify-center min-h-screen bg-black text-white">Connexion...</div>;

  return (
    <div className="h-screen w-full bg-black">
      <LiveKitRoom
        video={true} audio={true} token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        options={{ videoCaptureDefaults: { resolution: VideoPresets.h1080.resolution } }}
      >
        <VideoConference />
        <RoomAudioRenderer />
        
        {/* Bouton de test temporaire pour vérifier que l'IA parle bien dans la salle */}
        <button 
          onClick={() => testTranslation("Bonjour, je suis ravi de tester mon nouveau système de traduction instantanée.")}
          className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-red-600 p-4 rounded-full text-white font-bold z-50 hover:bg-red-700"
        >
          Tester l'IA (Voix)
        </button>
      </LiveKitRoom>
    </div>
  );
}