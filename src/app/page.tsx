"use client";

import { useState, useEffect, useRef, dynamic } from 'react';
import { 
  LiveKitRoom, 
  RoomAudioRenderer, 
  ParticipantTile, 
  useTracks, 
  GridLayout, 
  useRoomContext 
} from '@livekit/components-react';
import { Track, LocalAudioTrack } from 'livekit-client';
import '@livekit/components-styles';

// --- CONFIGURATION ---
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: '🇬🇧 English' },
  { code: 'ja', name: '🇯🇵 Japanese' },
  { code: 'fr', name: '🇫🇷 Français' },
  { code: 'es', name: '🇪🇸 Español' },
];

// Force le rendu uniquement côté client pour tuer l'erreur 418
const DynamicLiveKitRoom = dynamic(() => Promise.resolve(InstantTalkPage), { ssr: false });

function InstantTalkPage() {
  const [token, setToken] = useState("");
  const [targetLang, setTargetLang] = useState('en');
  const [isListening, setIsListening] = useState(false);
  const [roomName, setRoomName] = useState("meeting-premium");

  const join = async () => {
    const resp = await fetch(`/api/get-participant-token?room=${roomName}&username=user-${Math.random().toString(36).substring(7)}`);
    const data = await resp.json();
    setToken(data.token);
  };

  if (!token) return (
    <div className="h-[100dvh] bg-black flex items-center justify-center p-6 text-white">
      <div className="bg-white/5 p-8 rounded-[32px] border border-white/10 text-center max-w-sm w-full">
        <h1 className="text-3xl font-black mb-6 tracking-tighter">INSTANT TALK</h1>
        <button onClick={join} className="w-full bg-blue-600 py-4 rounded-2xl font-bold">JOIN MISSION</button>
      </div>
    </div>
  );

  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      video={true}
      audio={false}
      connectOptions={{ autoSubscribe: true }}
      className="h-[100dvh] bg-[#050505] flex flex-col overflow-hidden"
    >
      {/* HEADER RANGÉ */}
      <header className="h-16 w-full flex justify-between items-center px-6 bg-black border-b border-white/10 z-50">
        <span className="text-xs font-bold tracking-widest uppercase text-white/50">Live Room</span>
        <select
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          className="bg-white/5 text-white text-xs p-2 rounded-lg border border-white/20 outline-none"
        >
          {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code} className="bg-black">{l.name}</option>)}
        </select>
      </header>

      {/* ZONE VIDÉO INTELLIGENTE */}
      <main className="flex-1 relative p-2 overflow-hidden">
        <AdaptiveGrid />
        <AIPipeline targetLang={targetLang} isListening={isListening} />
      </main>

      {/* FOOTER ÉPURÉ */}
      <footer className="h-24 flex items-center justify-center gap-8 bg-black">
        <button 
          onClick={() => setIsListening(!isListening)}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all shadow-xl ${
            isListening ? 'bg-red-600 animate-pulse' : 'bg-white'
          }`}
        >
          {isListening ? '⏹️' : '🎙️'}
        </button>
        <button onClick={() => setToken("")} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-lg opacity-50">🚪</button>
      </footer>

      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

// GRILLE ADAPTÉE (DESSUS/DESSOUS SUR MOBILE)
function AdaptiveGrid() {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  return (
    <div className="h-full w-full flex flex-col md:grid md:grid-cols-2 gap-2">
      {tracks.map(t => (
        <div key={t.participant.identity} className="flex-1 min-h-0 rounded-2xl overflow-hidden relative border border-white/10">
          <ParticipantTile trackRef={t} disableFollower={true} />
        </div>
      ))}
    </div>
  );
}

// MOTEUR AUDIO CORRIGÉ (SANS ERREUR HYDRATION)
function AIPipeline({ targetLang, isListening }: { targetLang: string, isListening: boolean }) {
  const room = useRoomContext();
  const audioQueue = useRef<string[]>([]);
  const isPlaying = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const destRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const aiTrackRef = useRef<LocalAudioTrack | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isListening) start(); else stop();
    return () => stop();
  }, [isListening]);

  const stop = () => {
    socketRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (aiTrackRef.current) room.localParticipant.unpublishTrack(aiTrackRef.current);
  };

  const start = async () => {
    try {
      // 1. SETUP AUDIO (Débloque le son sur iPhone/PC)
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();
      if (!destRef.current) {
        destRef.current = audioCtxRef.current.createMediaStreamDestination();
        aiTrackRef.current = new LocalAudioTrack(destRef.current.stream.getAudioTracks()[0]);
        await room.localParticipant.publishTrack(aiTrackRef.current);
      }

      // 2. STREAM DEEPGRAM (0 LATENCE)
      const resToken = await fetch('/api/deepgram-token');
      const { token } = await resToken.json();
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      socketRef.current = new WebSocket(`wss://api.deepgram.com/v1/listen?model=nova-2&language=fr&endpointing=300`, ['token', token]);

      socketRef.current.onopen = () => {
        const mr = new MediaRecorder(streamRef.current!, { mimeType: 'audio/webm' });
        mr.ondataavailable = (e) => { if (e.data.size > 0 && socketRef.current?.readyState === 1) socketRef.current.send(e.data); };
        mr.start(250);
      };

      socketRef.current.onmessage = async (msg) => {
        const data = JSON.parse(msg.data);
        const transcript = data.channel?.alternatives?.[0]?.transcript;
        if (transcript && data.is_final) {
          const res = await fetch('/api/agent', { method: 'POST', body: JSON.stringify({ text: transcript, targetLang }) });
          const { audio } = await res.json();
          if (audio) { audioQueue.current.push(audio); if (!isPlaying.current) play(); }
        }
      };
    } catch (e) { console.error(e); }
  };

  const play = async () => {
    if (audioQueue.current.length === 0) { isPlaying.current = false; return; }
    isPlaying.current = true;
    const b64 = audioQueue.current.shift();
    if (!b64 || !audioCtxRef.current || !destRef.current) return;
    
    try {
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      const buffer = await audioCtxRef.current.decodeAudioData(bytes.buffer);
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(destRef.current);
      source.connect(audioCtxRef.current.destination);
      source.onended = () => { isPlaying.current = false; play(); };
      source.start(0);
    } catch (e) { isPlaying.current = false; play(); }
  };

  return null;
}

export default DynamicLiveKitRoom;