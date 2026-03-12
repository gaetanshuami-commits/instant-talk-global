"use client";

import { useState } from 'react';
import { LiveKitRoom, RoomAudioRenderer, ParticipantTile, useTracks, GridLayout } from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { AIAudioInjector } from '@/components/AIAudioInjector';

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'GB Anglais' },
  { code: 'ja', name: 'JP Japonais' },
  { code: 'zh', name: 'CN Chinois' },
  { code: 'de', name: 'DE Allemand' },
  { code: 'fr', name: 'FR Français' },
  { code: 'es', name: 'ES Espagnol' },
];

export default function Home() {
  const [token, setToken] = useState("");
  const [targetLang, setTargetLang] = useState('en');
  const [roomName, setRoomName] = useState("reunion-b2b");
  const [isListening, setIsListening] = useState(false);

  const joinMeeting = async () => {
    try {
      const resp = await fetch(`/api/get-participant-token?room=${roomName}&username=utilisateur-${Math.floor(Math.random() * 1000)}`);
      const data = await resp.json();
      setToken(data.token);
    } catch (e) { console.error(e); }
  };

  if (!token) {
    return (
      <main className="flex flex-col h-[100dvh] bg-[#111] text-white items-center justify-center p-4">
        <h1 className="text-3xl font-bold mb-6">CONVERSATION INSTANTANÉE</h1>
        <button onClick={joinMeeting} className="bg-blue-600 px-8 py-3 rounded-lg font-bold">Rejoindre la salle</button>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-[100dvh] bg-[#1a1a1a] text-white overflow-hidden">
      {/* HEADER EXACTEMENT COMME TA CAPTURE */}
      <div className="flex justify-between items-center px-6 py-4 bg-[#111] border-b border-white/5 z-20">
        <h1 className="text-sm font-bold flex items-center gap-2 tracking-wide uppercase">
          <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
          CONVERSATION INSTANTANÉE
        </h1>
        
        <div className="flex items-center gap-4">
          <select 
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="bg-[#222] border border-white/10 text-white text-xs rounded p-1.5 outline-none cursor-pointer"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
          <button onClick={() => { setToken(""); setIsListening(false); }} className="bg-[#331111] text-[#ff4444] px-4 py-1.5 rounded text-xs border border-[#ff4444]/30 hover:bg-[#ff4444] hover:text-white transition-all">
            Abandonneur
          </button>
        </div>
      </div>

      <LiveKitRoom
        video={true}
        audio={false} // MICRO NATIF MUTÉ : L'autre personne n'entendra que l'IA
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        className="flex-1 w-full h-full relative"
        onDisconnected={() => setToken("")}
      >
        <ConferenceLayout />
        <RoomAudioRenderer />
        
        {/* LE CERVEAU IA INVISIBLE EST ICI */}
        <AIAudioInjector targetLang={targetLang} isActive={isListening} />

        {/* BOUTON D'ACTIVATION DU MICRO IA */}
        <div className="absolute bottom-6 left-6 z-50">
           <button 
            onClick={() => setIsListening(!isListening)}
            className={`px-4 py-2 rounded font-bold text-white text-sm border transition-all shadow-xl ${
              isListening ? 'bg-red-600 border-red-500 animate-pulse' : 'bg-blue-600 border-blue-500 hover:bg-blue-500'
            }`}
           >
             {isListening ? '🔴 Couper Micro IA' : '🎤 Activer Micro IA'}
           </button>
        </div>
      </LiveKitRoom>
    </main>
  );
}

function ConferenceLayout() {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  return (
    <div className="p-2 h-full w-full">
      <GridLayout tracks={tracks} style={{ height: '100%' }}>
        <ParticipantTile />
      </GridLayout>
    </div>
  );
}