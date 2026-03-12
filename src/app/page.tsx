"use client";

import { useState, useEffect, useRef } from 'react';
import { LiveKitRoom, RoomAudioRenderer, ParticipantTile, useTracks, GridLayout, useRoomContext } from '@livekit/components-react';
import { Track, LocalAudioTrack } from 'livekit-client';
import '@livekit/components-styles';
import { DeepgramStreamManager } from '@/lib/deepgramStream';

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

  const joinMeeting = async () => {
    try {
      const resp = await fetch(`/api/get-participant-token?room=${roomName}&username=utilisateur-${Math.floor(Math.random() * 1000)}`);
      const data = await resp.json();
      setToken(data.token);
    } catch (e) { console.error(e); }
  };

  if (token === "") {
    return (
      <main className="flex flex-col h-[100dvh] bg-[#111] text-white items-center justify-center p-4">
        <h1 className="text-3xl font-bold mb-6">Instant Talk</h1>
        <button onClick={joinMeeting} className="bg-blue-600 px-8 py-3 rounded-lg font-bold">Rejoindre la salle</button>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-[100dvh] bg-[#1a1a1a] text-white overflow-hidden">
      {/* HEADER EXACTEMENT COMME TA CAPTURE */}
      <div className="flex justify-between items-center px-6 py-4 bg-[#111] border-b border-white/5 z-20">
        <h1 className="text-sm font-semibold flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Direct <span className="text-blue-500">Traduire</span>
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
          <button onClick={() => setToken("")} className="bg-[#331111] text-[#ff4444] px-4 py-1.5 rounded text-xs border border-[#ff4444]/30 hover:bg-[#ff4444] hover:text-white transition-all">
            Abandonneur
          </button>
        </div>
      </div>

      <LiveKitRoom
        video={true}
        audio={false} // MICRO NATIF COUPÉ
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        className="flex-1 w-full h-full relative"
        onDisconnected={() => setToken("")}
      >
        <ConferenceLayout />
        <RoomAudioRenderer />
        <PipelineManager targetLang={targetLang} />
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

// --- LE MOTEUR SFU D'INJECTION WEB-RTC CORRIGÉ ---
function PipelineManager({ targetLang }: { targetLang: string }) {
  const room = useRoomContext();
  const audioQueue = useRef<string[]>([]);
  const isPlaying = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const streamManager = useRef<DeepgramStreamManager | null>(null);

  // RÉFÉRENCES WEBRTC PERSISTANTES
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
    setCurrentText("Initialisation du pipeline...");

    try {
      // 1. CRÉATION DU TUYAU WEBRTC PERMANENT
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        destRef.current = audioCtxRef.current.createMediaStreamDestination();
        aiTrackRef.current = new LocalAudioTrack(destRef.current.stream.getAudioTracks()[0]);
        // On publie la piste UNE SEULE FOIS pour éviter les coupures réseau
        await room.localParticipant.publishTrack(aiTrackRef.current);
      }

      // 2. LANCEMENT DE DEEPGRAM
      const resp = await fetch('/api/deepgram-token');
      const { token } = await resp.json();
      
      streamManager.current = new DeepgramStreamManager(async (finalTranscript: string) => {
        setCurrentText(`...`);
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
        } catch (e) { console.error(e); }
      });

      await streamManager.current.start(token);
      setCurrentText("Prêt. Parlez !");

    } catch (error) {
      setIsListening(false);
      setCurrentText("Erreur critique.");
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
      for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
      }

      const audioBuffer = await audioCtxRef.current.decodeAudioData(bytes.buffer);
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = audioBuffer;

      // LA MAGIE EST ICI :
      // 1. On envoie l'audio dans le réseau LiveKit pour l'autre personne
      source.connect(destRef.current);
      // 2. On l'envoie AUSSI dans tes enceintes locales pour que tu saches que l'IA a parlé
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
    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-4 w-full px-4 pointer-events-none">
       {currentText && (
         <div className="bg-black/90 text-white px-6 py-2 rounded-md text-sm shadow-xl max-w-md text-center pointer-events-auto border border-white/10">
            {currentText}
         </div>
       )}
       
       <button 
        onClick={toggleListening}
        className={`pointer-events-auto px-6 py-2 rounded-full font-bold text-sm transition-all ${
          isListening ? 'bg-blue-600 text-white' : 'bg-white text-black'
        }`}
       >
         {isListening ? 'Micro IA Actif' : 'Activer Micro IA'}
       </button>
    </div>
  );
}
