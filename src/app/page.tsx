"use client";

import { useState, useEffect, useRef } from 'react';
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
  { code: 'zh', name: '🇨🇳 Chinese' },
  { code: 'de', name: '🇩🇪 Deutsch' },
  { code: 'fr', name: '🇫🇷 Français' },
  { code: 'es', name: '🇪🇸 Español' },
];

export default function InstantTalkPage() {
  const [token, setToken] = useState("");
  const [targetLang, setTargetLang] = useState('en');
  const [roomName, setRoomName] = useState("meeting-premium");
  const [isListening, setIsListening] = useState(false);

  const join = async () => {
    try {
      const resp = await fetch(`/api/get-participant-token?room=${roomName}&username=user-${Math.random().toString(36).substring(7)}`);
      const data = await resp.json();
      setToken(data.token);
    } catch (e) { console.error(e); }
  };

  if (!token) return (
    <div className="h-[100dvh] bg-[#050505] flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="w-full max-w-md bg-white/5 p-10 rounded-[40px] border border-white/10 backdrop-blur-3xl shadow-2xl text-center">
        <h1 className="text-4xl font-black mb-2 tracking-tighter italic">INSTANT <span className="text-blue-500 text-not-italic">TALK</span></h1>
        <p className="text-white/40 text-sm mb-10 uppercase tracking-[0.2em] font-medium">B2B Global Communication</p>
        <input 
          type="text" 
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl mb-6 text-center outline-none focus:border-blue-500 transition-all shadow-inner"
        />
        <button onClick={join} className="w-full bg-blue-600 px-12 py-5 rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-blue-500/20">
          START MISSION
        </button>
      </div>
    </div>
  );

  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      video={true}
      audio={false} // MICRO NATIF MUTÉ
      connectOptions={{ autoSubscribe: true }}
      className="h-[100dvh] bg-[#050505] flex flex-col overflow-hidden"
    >
      {/* HEADER : DESIGN INTELLIGENT ET RANGÉ */}
      <header className="h-20 w-full z-50 flex justify-between items-center px-6 bg-black/40 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
          <span className="font-bold text-sm tracking-[0.3em] text-white uppercase opacity-80">Live Mission</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Target Language</span>
            <span className="text-xs text-blue-400 font-medium">Auto-translation Active</span>
          </div>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="bg-white/5 border border-white/10 text-white text-sm p-2.5 rounded-xl outline-none focus:ring-2 ring-blue-500/50 cursor-pointer"
          >
            {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code} className="bg-[#111]">{l.name}</option>)}
          </select>
        </div>
      </header>

      {/* ZONE VIDÉO : ADAPTÉE COMME ZOOM/TEAMS */}
      <main className="flex-1 relative bg-black p-4 overflow-hidden">
        <FixedGrid />
        
        {/* PIPELINE MANAGER INVISIBLE */}
        <AIPipelineManager targetLang={targetLang} isListening={isListening} />
      </main>

      {/* BARRE DE CONTRÔLE BASSE */}
      <footer className="h-28 w-full bg-gradient-to-t from-black to-transparent flex items-center justify-center gap-6 px-6">
        <button 
          onClick={() => setIsListening(!isListening)}
          className={`group flex flex-col items-center gap-2 transition-all duration-300 ${isListening ? 'scale-110' : 'hover:scale-105'}`}
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${
            isListening ? 'bg-red-600 shadow-red-500/40 rotate-0' : 'bg-white shadow-white/10'
          }`}>
            <span className="text-2xl">{isListening ? '⏹️' : '🎙️'}</span>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-widest ${isListening ? 'text-red-500 animate-pulse' : 'text-white/50'}`}>
            {isListening ? 'Stop AI' : 'Start AI'}
          </span>
        </button>

        <button onClick={() => setToken("")} className="flex flex-col items-center gap-2 group">
          <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-red-600/20 hover:border-red-600/50 transition-all">
            <span className="text-xl">🚪</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 group-hover:text-red-500 transition-colors">Leave</span>
        </button>
      </footer>

      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function FixedGrid() {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  return (
    <div className="h-full w-full max-w-6xl mx-auto">
      <GridLayout tracks={tracks} className="h-full gap-4">
        <ParticipantTile className="rounded-3xl overflow-hidden border border-white/5 bg-white/5 shadow-2xl" />
      </GridLayout>
    </div>
  );
}

// --- LOGIQUE IA SANS DÉSORDRE ---
function AIPipelineManager({ targetLang, isListening }: { targetLang: string, isListening: boolean }) {
  const room = useRoomContext();
  const audioQueue = useRef<string[]>([]);
  const isPlaying = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const destRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const aiTrackRef = useRef<LocalAudioTrack | null>(null);

  useEffect(() => {
    if (isListening) startAI(); else stopAI();
    return () => stopAI();
  }, [isListening]);

  const stopAI = () => {
    socketRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (aiTrackRef.current) room.localParticipant.unpublishTrack(aiTrackRef.current);
    aiTrackRef.current = null;
  };

  const startAI = async () => {
    try {
      // Setup Audio WebRTC Injection
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();
      if (!destRef.current) {
        destRef.current = audioCtxRef.current.createMediaStreamDestination();
        aiTrackRef.current = new LocalAudioTrack(destRef.current.stream.getAudioTracks()[0]);
        await room.localParticipant.publishTrack(aiTrackRef.current);
      }

      // Deepgram WebSocket
      const resp = await fetch('/api/deepgram-token');
      const { token } = await resp.json();
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      socketRef.current = new WebSocket(`wss://api.deepgram.com/v1/listen?model=nova-2&language=fr&interim_results=true&endpointing=300`, ['token', token]);

      socketRef.current.onopen = () => {
        const mr = new MediaRecorder(streamRef.current!, { mimeType: 'audio/webm' });
        mr.ondataavailable = (e) => { if (e.data.size > 0 && socketRef.current?.readyState === 1) socketRef.current.send(e.data); };
        mr.start(250);
      };

      socketRef.current.onmessage = async (msg) => {
        const data = JSON.parse(msg.data);
        const transcript = data.channel?.alternatives?.[0]?.transcript;
        if (transcript && (data.is_final || data.speech_final)) {
          const res = await fetch('/api/agent', {
            method: 'POST',
            body: JSON.stringify({ text: transcript, targetLang })
          });
          const { audio } = await res.json();
          if (audio) { audioQueue.current.push(audio); if (!isPlaying.current) playNext(); }
        }
      };
    } catch (e) { console.error(e); }
  };

  const playNext = async () => {
    if (audioQueue.current.length === 0) { isPlaying.current = false; return; }
    isPlaying.current = true;
    const base64 = audioQueue.current.shift();
    if (!base64 || !audioCtxRef.current || !destRef.current) return;
    
    try {
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const buffer = await audioCtxRef.current.decodeAudioData(bytes.buffer);
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(destRef.current);
      source.connect(audioCtxRef.current.destination);
      source.onended = () => { isPlaying.current = false; playNext(); };
      source.start(0);
    } catch (e) { isPlaying.current = false; playNext(); }
  };

  return null;
}