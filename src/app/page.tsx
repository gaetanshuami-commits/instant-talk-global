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
        <h1 className="text-3xl font-bold mb-6 tracking-widest">CONVERSATION INSTANTANÉE</h1>
        <button onClick={joinMeeting} className="bg-[#cc0000] px-8 py-3 rounded font-bold hover:bg-red-700 transition-all">Rejoindre la salle</button>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-[100dvh] bg-[#1a1a1a] text-white overflow-hidden relative">
      {/* HEADER STRICT */}
      <div className="flex justify-between items-center px-6 py-4 bg-[#111] border-b border-[#333] z-20">
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
          <button onClick={() => { setToken(""); setIsListening(false); }} className="bg-[#2a0b0b] text-[#ff4444] px-4 py-1.5 rounded text-xs border border-[#ff4444]/30 hover:bg-[#ff4444] hover:text-white transition-all">
            Abandonneur
          </button>
        </div>
      </div>

      {/* BOUTON MICRO IA : FIXÉ AU-DESSUS DE TOUT */}
      <div className="fixed bottom-10 left-10 z-[99999]">
         <button 
          onClick={() => setIsListening(!isListening)}
          className={`px-6 py-3 rounded-lg font-bold text-white text-sm transition-all shadow-2xl border ${
            isListening ? 'bg-[#e50000] border-red-400 animate-pulse' : 'bg-blue-600 border-blue-400 hover:bg-blue-500'
          }`}
         >
           {isListening ? '🔴 Couper Micro IA' : '🎤 Activer Micro IA'}
         </button>
      </div>

      <LiveKitRoom
        video={true}
        audio={false} // Micro natif coupé
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        className="flex-1 w-full h-full relative z-0"
        onDisconnected={() => setToken("")}
      >
        <ConferenceLayout />
        <RoomAudioRenderer />
        
        {/* LE MOTEUR IA INVISIBLE */}
        <AIAudioInjector targetLang={targetLang} isActive={isListening} />
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