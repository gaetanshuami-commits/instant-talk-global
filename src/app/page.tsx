"use client";

import { useState, useEffect, useRef } from 'react';
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  useRoomContext
} from '@livekit/components-react';
import { Track, LocalAudioTrack } from 'livekit-client';
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
          <h1 className="text-3xl font-bold mb-6 italic">Instant Talk <span className="text-blue-500">Global</span></h1>
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
      {/* TON INTERFACE D'ORIGINE RESTAURÉE */}
      <div className="absolute top-0 w-full z-20 flex justify-between items-center px-4 sm:px-8 py-4 bg-white/5 backdrop-blur-lg border-b border-white/10">
        <h1 className="text-lg font-semibold tracking-wide flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
          Direct <span className="text-blue-500 font-bold">Translate</span>
        </h1>
        
        <div className="flex items-center gap-3">
          <select 
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="bg-black/40 border border-white/20 text-white text-sm rounded-lg p-2 backdrop-blur-md outline-none"
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
        audio={false} // MICRO NATIF COUPÉ
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        data-lk-theme="default"
        className="flex-1 w-full h-full"
        onDisconnected={() => setToken("")}
      >
        <MyVideoConference />
        <RoomAudioRenderer />
        <PipelineManager targetLang={targetLang} />
      </LiveKitRoom>
    </main>
  );
}

// TON COMPOSANT VIDÉO D'ORIGINE
function MyVideoConference() {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false }
  ], { onlySubscribed: false });

  return (
    <GridLayout tracks={tracks} style={{ height: 'calc(100dvh - 64px)', marginTop: '64px' }}>
      <ParticipantTile />
    </GridLayout>
  );
}

// LE MOTEUR IA (INJECTÉ EN BAS)
function PipelineManager({ targetLang }: { targetLang: string }) {
  const room = useRoomContext();
  const audioQueue = useRef<string[]>([]);
  const isPlaying = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const streamManager = useRef<DeepgramStreamManager | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const destRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const aiTrackRef = useRef<LocalAudioTrack | null>(null);

  const langRef = useRef(targetLang);
  useEffect(() => { langRef.current = targetLang; }, [targetLang]);

  useEffect(() => {
    return () => { 
      streamManager.current?.stop();
      if (aiTrackRef.current) room.localParticipant.unpublishTrack(aiTrackRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, [room]);

  const toggleListening = async () => {
    if (isListening) {
      streamManager.current?.stop();
      if (aiTrackRef.current) {
        room.localParticipant.unpublishTrack(aiTrackRef.current);
        aiTrackRef.current = null;
      }
      setIsListening(false);
      setCurrentText("");
      return;
    }

    setIsListening(true);
    setCurrentText("Connexion...");

    try {
      // CORRECTION DU SON : On force le navigateur à débloquer l'audio au moment du clic
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }
      
      if (!destRef.current) {
        destRef.current = audioCtxRef.current.createMediaStreamDestination();
        aiTrackRef.current = new LocalAudioTrack(destRef.current.stream.getAudioTracks()[0]);
        await room.localParticipant.publishTrack(aiTrackRef.current);
      }

      const resp = await fetch('/api/deepgram-token');
      const { token, error } = await resp.json();
      if (error || !token) throw new Error(error || "Token Deepgram introuvable");

      streamManager.current = new DeepgramStreamManager(async (finalTranscript: string) => {
        setCurrentText(`[Traduction en cours...]`);
        try {
          const fullLangName = SUPPORTED_LANGUAGES.find(l => l.code === langRef.current)?.name || langRef.current;
          const trRes = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: finalTranscript, targetLanguage: fullLangName })
          });
          const trData = await trRes.json();
          
          if (trData.audio && trData.translation) {
             setCurrentText(`🗣️ ${trData.translation}`);
             pushToQueue(trData.audio);
          }
        } catch (e) { console.error("Erreur IA", e); }
      });

      await streamManager.current.start(token);
      setCurrentText("IA à l'écoute (Parlez !)");

    } catch (error: any) {
      setIsListening(false);
      setCurrentText("Erreur : Clé Deepgram manquante");
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
    if (!base64 || !audioCtxRef.current || !destRef.current) return;
    
    try {
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);

      const audioBuffer = await audioCtxRef.current.decodeAudioData(bytes.buffer);
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = audioBuffer;

      // Injection dans le réseau (l'autre personne entend) ET en local (tu entends)
      source.connect(destRef.current);
      source.connect(audioCtxRef.current.destination);

      source.onended = () => {
        isPlaying.current = false;
        playNext();
      };
      source.start(0);
    } catch (e) { 
      isPlaying.current = false; 
      playNext(); 
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-4">
       {currentText && (
         <div className="bg-black/80 text-white px-6 py-2 rounded-lg backdrop-blur text-sm border border-white/10 text-center">
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
