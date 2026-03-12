"use client";

import { useState, useEffect, useRef } from 'react';
import { LiveKitRoom, RoomAudioRenderer, ParticipantTile, useTracks, GridLayout, ControlBar } from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { DeepgramStreamManager } from '@/lib/deepgramStream';

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: '🇬🇧 Anglais' },
  { code: 'ja', name: '🇯🇵 Japonais' },
  { code: 'zh', name: '🇨🇳 Chinois' },
  { code: 'de', name: '🇩🇪 Allemand' },
  { code: 'nl', name: '🇳🇱 Néerlandais' },
  { code: 'fr', name: '🇫🇷 Français' },
  { code: 'ko', name: '🇰🇷 Coréen' },
  { code: 'pt', name: '🇵🇹 Portugais' },
  { code: 'it', name: '🇮🇹 Italien' },
  { code: 'es', name: '🇪🇸 Espagnol' },
  { code: 'ar', name: '🇸🇦 Arabe' },
];

export default function Home() {
  const [token, setToken] = useState("");
  const [targetLang, setTargetLang] = useState('en');
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
      <main className="flex flex-col h-[100dvh] bg-[#0a0a0a] text-white items-center justify-center p-4">
        <div className="z-20 bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl text-center max-w-md w-full">
          <h1 className="text-3xl font-bold mb-6 italic tracking-tighter">Instant Talk <span className="text-blue-500">Global</span></h1>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Nom de la réunion" 
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full bg-black/40 border border-white/20 p-3 rounded-xl outline-none focus:border-blue-500 transition-all text-center"
            />
            <button 
              onClick={joinMeeting}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/30"
            >
              Démarrer la réunion
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-[100dvh] bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* HEADER RESTAURÉ */}
      <div className="absolute top-0 w-full z-20 flex justify-between items-center px-4 sm:px-8 py-4 bg-white/5 backdrop-blur-lg border-b border-white/10">
        <h1 className="text-lg font-semibold tracking-wide flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
          Direct <span className="text-blue-500 font-bold">Translate</span>
        </h1>
        
        <div className="flex items-center gap-3">
          <select 
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="bg-black/40 border border-white/20 text-white text-sm rounded-lg p-2 backdrop-blur-md outline-none cursor-pointer"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-gray-900 text-white">{lang.name}</option>
            ))}
          </select>
          <button onClick={() => setToken("")} className="bg-red-500/20 text-red-500 px-3 py-1 rounded-lg text-xs border border-red-500/30 hover:bg-red-500 hover:text-white transition-all">Quitter</button>
        </div>
      </div>

      <LiveKitRoom
        video={true}
        audio={false} // MICRO NATIF COUPÉ (Pour laisser l'IA faire)
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        data-lk-theme="default"
        className="flex-1 w-full h-full"
        onDisconnected={() => setToken("")}
      >
        <ConferenceLayout />
        <RoomAudioRenderer />
        <PipelineManager targetLang={targetLang} />
        
        {/* BARRE DE CONTRÔLE LIVEKIT */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 hidden md:block">
            <ControlBar variation="minimal" />
        </div>
      </LiveKitRoom>
    </main>
  );
}

// --- LE DESIGN PARFAIT DE LA GRILLE ---
function ConferenceLayout() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <GridLayout tracks={tracks} style={{ height: 'calc(100dvh - 64px)', marginTop: '64px' }}>
      <ParticipantTile />
    </GridLayout>
  );
}

// --- LE CERVEAU CACHÉ DE L'IA ---
function PipelineManager({ targetLang }: { targetLang: string }) {
  const audioQueue = useRef<string[]>([]);
  const isPlaying = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const streamManager = useRef<DeepgramStreamManager | null>(null);

  useEffect(() => {
    return () => { streamManager.current?.stop(); };
  }, []);

  const toggleListening = async () => {
    if (isListening) {
      streamManager.current?.stop();
      setIsListening(false);
      setCurrentText("");
      return;
    }

    setIsListening(true);
    setCurrentText("Connexion IA ultra-rapide...");

    try {
      const resp = await fetch('/api/deepgram-token');
      const { token, error } = await resp.json();
      
      if (error || !token) throw new Error(error || "Token Deepgram introuvable");

      streamManager.current = new DeepgramStreamManager(async (finalTranscript: string) => {
        setCurrentText(`Traduction : "${finalTranscript}"...`);
        try {
          const trRes = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: finalTranscript, targetLanguage: targetLang })
          });
          const trData = await trRes.json();
          if (trData.audio) {
             pushToQueue(trData.audio);
             setCurrentText("");
          }
        } catch (e) { console.error("Erreur IA", e); }
      });

      await streamManager.current.start(token);
      setCurrentText("IA à l'écoute (Parlez naturellement)");

    } catch (error) {
      console.error(error);
      setIsListening(false);
      setCurrentText("Erreur: Vérifiez votre clé Deepgram");
    }
  };

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
    audio.onended = () => { isPlaying.current = false; playNext(); };
    try { await audio.play(); } 
    catch (e) { isPlaying.current = false; playNext(); }
  };

  return (
    <div className="absolute bottom-[100px] left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-4 w-full px-4 pointer-events-none">
       {currentText && (
         <div className="bg-black/70 text-gray-200 px-6 py-2 rounded-full backdrop-blur-md text-sm sm:text-base border border-white/10 shadow-xl max-w-md text-center pointer-events-auto">
            {currentText}
         </div>
       )}
       
       <button 
        onClick={toggleListening}
        className={`pointer-events-auto w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-full text-2xl sm:text-3xl shadow-2xl transition-all duration-300 border border-white/10 ${
          isListening ? 'bg-red-600 shadow-[0_0_40px_rgba(220,38,38,0.6)] hover:bg-red-500 animate-pulse' : 'bg-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:bg-blue-500 hover:scale-105'
        }`}
       >
         {isListening ? '⏹️' : '🎙️'}
       </button>
    </div>
  );
}
