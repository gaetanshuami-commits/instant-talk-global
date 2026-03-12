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

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: '🇬🇧 English' },
  { code: 'ja', name: '🇯🇵 Japanese' },
  { code: 'fr', name: '🇫🇷 Français' },
  { code: 'es', name: '🇪🇸 Español' },
];

function InstantTalkPage() {
  const [token, setToken] = useState("");
  const [targetLang, setTargetLang] = useState('en');
  const [isListening, setIsListening] = useState(false);
  const [roomName] = useState("meeting-premium");

  const join = async () => {
    const resp = await fetch(`/api/get-participant-token?room=${roomName}&username=user-${Math.random().toString(36).substring(7)}`);
    const data = await resp.json();
    setToken(data.token);
  };

  if (!token) return (
    <div className="h-[100dvh] bg-black flex items-center justify-center p-6 text-white">
      <div className="bg-white/5 p-10 rounded-[40px] border border-white/10 text-center max-w-sm w-full">
        <h1 className="text-4xl font-black mb-8 italic tracking-tighter">INSTANT TALK</h1>
        <button onClick={join} className="w-full bg-blue-600 py-5 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/20">JOIN MISSION</button>
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
      <header className="h-16 w-full flex justify-between items-center px-6 bg-black/50 backdrop-blur-md border-b border-white/10 z-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/70">Live</span>
        </div>
        <select
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          className="bg-white/5 text-white text-xs p-2 rounded-xl border border-white/20 outline-none"
        >
          {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code} className="bg-black">{l.name}</option>)}
        </select>
      </header>

      <main className="flex-1 relative p-2 overflow-hidden flex flex-col">
        <div className="flex-1 w-full max-w-5xl mx-auto overflow-hidden">
          <AdaptiveGrid />
        </div>
        <AIPipeline targetLang={targetLang} isListening={isListening} />
      </main>

      <footer className="h-28 flex items-center justify-center gap-10 bg-gradient-to-t from-black to-transparent">
        <button 
          onClick={() => setIsListening(!isListening)}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all shadow-2xl ${
            isListening ? 'bg-red-600 shadow-red-600/40 animate-pulse' : 'bg-white shadow-white/10'
          }`}
        >
          {isListening ? '⏹️' : '🎙️'}
        </button>
        <button onClick={() => setToken("")} className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-xl opacity-40 hover:opacity-100 transition-opacity">🚪</button>
      </footer>

      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function AdaptiveGrid() {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  // Sur mobile : flex-col (un en haut, un en bas) | Sur PC : grid-cols-2
  return (
    <div className="h-full w-full flex flex-col md:grid md:grid-cols-2 gap-3">
      {tracks.map(t => (
        <div key={t.participant.identity} className="flex-1 md:h-full min-h-0 rounded-[32px] overflow-hidden border border-white/5 bg-white/5 shadow-2xl">
          <ParticipantTile trackRef={t} disableFollower={true} />
        </div>
      ))}
    </div>
  );
}

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
    aiTrackRef.current = null;
  };

  const start = async () => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();
      if (!destRef.current) {
        destRef.current = audioCtxRef.current.createMediaStreamDestination();
        aiTrackRef.current = new LocalAudioTrack(destRef.current.stream.getAudioTracks()[0]);
        await room.localParticipant.publishTrack(aiTrackRef.current);
      }

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
    if (audioQueue.current.length === 0 || !audioCtxRef.current) { isPlaying.current = false; return; }
    isPlaying.current = true;
    const b64 = audioQueue.current.shift();
    if (!b64 || !destRef.current) return;
    
    try {
      const binaryString = window.atob(b64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      
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

// Export dynamique pour éviter l'erreur de build Vercel
export default dynamic(() => Promise.resolve(InstantTalkPage), { ssr: false });