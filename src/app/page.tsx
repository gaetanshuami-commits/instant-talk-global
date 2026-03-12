"use client";

import { useState, useEffect, useRef } from 'react';
import { LiveKitRoom, RoomAudioRenderer, ParticipantTile, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';

// --- CONFIGURATION ---
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: '🇬🇧 English' },
  { code: 'ja', name: '🇯🇵 Japanese' },
  { code: 'fr', name: '🇫🇷 Français' },
  { code: 'de', name: '🇩🇪 Deutsch' },
  { code: 'es', name: '🇪🇸 Español' },
];

export default function InstantTalkPage() {
  const [token, setToken] = useState("");
  const [targetLang, setTargetLang] = useState('en');
  const [roomName, setRoomName] = useState("meeting-premium");

  const join = async () => {
    try {
      const resp = await fetch(`/api/get-participant-token?room=${roomName}&username=user-${Math.random().toString(36).substring(7)}`);
      const data = await resp.json();
      setToken(data.token);
    } catch (e) {
      console.error(e);
    }
  };

  if (!token) return (
    <div className="h-[100dvh] bg-black flex flex-col items-center justify-center p-4">
      <h1 className="text-blue-500 text-4xl font-black mb-8 tracking-tighter text-center">INSTANT TALK</h1>
      <button onClick={join} className="bg-blue-600 px-12 py-4 rounded-full font-bold text-white hover:scale-105 transition shadow-lg shadow-blue-500/50">
        START MISSION
      </button>
    </div>
  );

  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      video={true}
      audio={false} // CRITIQUE : Micro natif coupé du réseau
      connectOptions={{ autoSubscribe: true }}
      className="h-[100dvh] bg-[#050505] relative"
    >
      <header className="absolute top-0 w-full z-50 flex justify-between p-6 bg-gradient-to-b from-black to-transparent pointer-events-none">
        <div className="flex items-center gap-2 font-bold text-lg uppercase tracking-widest text-white">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" /> INSTANT TALK
        </div>
        <select 
          value={targetLang} 
          onChange={(e) => setTargetLang(e.target.value)}
          className="bg-black/50 backdrop-blur-md border border-white/20 text-white p-2 rounded-lg outline-none pointer-events-auto"
        >
          {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>
      </header>

      <FixedGrid />
      <PipelineManager targetLang={targetLang} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

// --- PRIORITÉ 1 : UI VIDÉO STRICTE ---
function FixedGrid() {
  const tracks = useTracks();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 h-full pt-20">
      {tracks.filter(t => t.source === Track.Source.Camera).map(t => (
        <div key={t.participant.identity} className="relative rounded-2xl overflow-hidden border border-white/5 bg-gray-900 shadow-2xl">
           <ParticipantTile trackRef={t} disableFollower={true} />
        </div>
      ))}
    </div>
  );
}

// --- PRIORITÉ 2 & 3 : PIPELINE & QUEUE ---
function PipelineManager({ targetLang }: { targetLang: string }) {
  const audioQueue = useRef<string[]>([]);
  const isPlaying = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Activation silencieuse du micro local
    const initMicrophone = async () => {
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log(`Pipeline actif. Langue cible: ${targetLang}`);
        // Le flux est capté, prêt pour l'envoi vers Deepgram
      } catch (e) {
        console.error("Erreur accès micro", e);
      }
    };
    
    initMicrophone();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [targetLang]);

  // Fonction exposée pour la future injection audio
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const pushToQueue = (base64: string) => {
    audioQueue.current.push(base64);
    if (!isPlaying.current) playNext();
  };

  const playNext = async () => {
    if (audioQueue.current.length === 0) {
      isPlaying.current = false;
      return;
    }

    isPlaying.current = true;
    const base64 = audioQueue.current.shift();
    if (!base64) return;
    
    const audio = new Audio(`data:audio/mp3;base64,${base64}`);
    
    audio.onended = () => {
      isPlaying.current = false;
      playNext();
    };
    
    try {
      await audio.play();
    } catch (e) {
      console.error("Erreur lecture audio", e);
      isPlaying.current = false;
      playNext();
    }
  };

  return null;
}
