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
    audioManager.current = new AudioQueueManager();
    (async () => {
      try {
        const resp = await fetch(`/api/livekit?room=${roomName}&username=User_${Math.floor(Math.random() * 100)}`);
        const data = await resp.json();
        if (data.token) setToken(data.token);
      } catch (e) {
        alert("Erreur de connexion au serveur de tokens.");
      }
    })();
  }, [roomName]);

  const testTranslation = async (text: string) => {
    alert("⏳ Envoi à l'IA en cours... Patiente quelques secondes.");
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage: "English" }),
      });
      const data = await res.json();
      
      if (data.audio) {
        audioManager.current?.addAudio(data.audio);
        alert("✅ L'IA a répondu ! Écoute tes haut-parleurs.");
      } else {
        alert("❌ Erreur IA : " + (data.error || "Clé API Gemini ou ElevenLabs manquante."));
      }
    } catch (error) {
      alert("❌ Erreur de réseau vers le serveur IA.");
    }
  };

  if (token === "") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-900 font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-lg font-medium">Création de la salle sécurisée...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <h1 className="text-xl font-bold text-gray-800">Instant Talk <span className="text-blue-600">Global</span></h1>
        </div>
        <div className="px-4 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-600 border border-gray-200">
          Salle : {roomName}
        </div>
      </header>

      <main className="flex-1 relative bg-gray-900 shadow-inner overflow-hidden" data-lk-theme="default">
        <LiveKitRoom
          video={true} 
          audio={true} 
          token={token}
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
          options={{ videoCaptureDefaults: { resolution: VideoPresets.h1080.resolution } }}
          className="h-full w-full"
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </main>

      <div className="bg-white border-t border-gray-200 p-4 flex justify-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
        <button 
          onClick={() => testTranslation("Bonjour, je suis ravi de tester mon nouveau système de traduction instantanée.")}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105 flex items-center gap-2"
        >
          Tester la traduction vocale (IA)
        </button>
      </div>
    </div>
  );
}