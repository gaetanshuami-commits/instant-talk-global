"use client";

import { useState, useEffect, useRef } from 'react';
import { LiveKitRoom, RoomAudioRenderer, ParticipantTile, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { DeepgramStreamManager } from '@/lib/deepgramStream';

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
    } catch (e) { console.error(e); }
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
      audio={false} // CRITIQUE : Micro natif coupé
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
           <ParticipantTile trackRef={t} />
        </div>
      ))}
    </div>
  );
}

// --- PRIORITÉ 2 & 3 : PIPELINE & QUEUE ---
function PipelineManager({ targetLang }: { targetLang: string }) {
  const audioQueue = useRef<string[]>([]);
  const isPlaying = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const streamManager = useRef<DeepgramStreamManager | null>(null);

  useEffect(() => {
    // Nettoyage si on quitte la salle
    return () => {
      streamManager.current?.stop();
    };
  }, []);

  const toggleListening = async () => {
    if (isListening) {
      streamManager.current?.stop();
      setIsListening(false);
      setCurrentText("Micro coupé");
      return;
    }

    setIsListening(true);
    setCurrentText("Connexion IA ultra-rapide...");

    // 1. On récupère un token Deepgram sécurisé via notre API
    try {
      const resp = await fetch('/api/deepgram-token');
      const { token } = await resp.json();
      
      if (!token) throw new Error("Token Deepgram introuvable");

      // 2. On lance l'écoute continue
      streamManager.current = new DeepgramStreamManager(async (finalTranscript: string) => {
        // Cette fonction est appelée UNIQUEMENT quand Deepgram détecte la fin d'une phrase
        setCurrentText(`Traduction : "${finalTranscript}"...`);
        
        try {
          // On envoie la phrase finie à Gemini + ElevenLabs
          const trRes = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: finalTranscript, targetLanguage: targetLang })
          });
          const trData = await trRes.json();
          
          if (trData.audio) {
             pushToQueue(trData.audio); // Injection dans la file d'attente
             setCurrentText(""); // On nettoie l'écran
          }
        } catch (e) { console.error("Erreur IA", e); }
      });

      await streamManager.current.start(token);
      setCurrentText("IA à l'écoute (Parlez naturellement)");

    } catch (error) {
      console.error(error);
      setIsListening(false);
      setCurrentText("Erreur connexion Deepgram");
    }
  };

  // Gestion de la file d'attente Audio
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
      isPlaying.current = false;
      playNext();
    }
  };

  return (
    <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-4">
       {/* Affichage des sous-titres discrets */}
       {currentText && (
         <div className="bg-black/80 text-white px-6 py-2 rounded-lg backdrop-blur text-sm border border-white/10 max-w-xs text-center">
            {currentText}
         </div>
       )}
       
       <button 
        onClick={toggleListening}
        className={`px-8 py-3 rounded-full font-bold shadow-2xl transition-all ${
          isListening ? 'bg-red-600 hover:bg-red-500 animate-pulse' : 'bg-blue-600 hover:bg-blue-500'
        }`}
       >
         {isListening ? '🔴 Stop IA' : '🎤 Activer Micro IA'}
       </button>
    </div>
  );
}
