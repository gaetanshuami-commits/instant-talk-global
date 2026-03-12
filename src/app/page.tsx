"use client";

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const LiveKitRoom = dynamic(() => import('@livekit/components-react').then(m => m.LiveKitRoom), { ssr: false });
const RoomAudioRenderer = dynamic(() => import('@livekit/components-react').then(m => m.RoomAudioRenderer), { ssr: false });
const ParticipantTile = dynamic(() => import('@livekit/components-react').then(m => m.ParticipantTile), { ssr: false });
const GridLayout = dynamic(() => import('@livekit/components-react').then(m => m.GridLayout), { ssr: false });

import { useTracks, useRoomContext } from '@livekit/components-react';
import { Track, LocalAudioTrack } from 'livekit-client';
import '@livekit/components-styles';

function InstantTalkMain() {
  const [token, setToken] = useState("");
  const [targetLang, setTargetLang] = useState('en');
  const [isListening, setIsListening] = useState(false);

  const join = async () => {
    const resp = await fetch(`/api/get-participant-token?room=meeting-premium&username=user-${Math.random().toString(36).substring(7)}`);
    const data = await resp.json();
    setToken(data.token);
  };

  if (!token) return (
    <div className="h-screen bg-black flex items-center justify-center p-6 text-white font-sans text-center">
      <div className="bg-white/5 p-10 rounded-[40px] border border-white/10 max-w-sm w-full backdrop-blur-3xl">
        <h1 className="text-4xl font-black mb-8 italic tracking-tighter uppercase">Instant Talk</h1>
        <button onClick={join} className="w-full bg-blue-600 py-5 rounded-2xl font-bold text-lg hover:scale-105 transition-all">START MISSION</button>
      </div>
    </div>
  );

  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      video={true}
      audio={false}
      className="h-screen bg-[#050505] flex flex-col overflow-hidden"
    >
      <header className="h-16 flex justify-between items-center px-6 bg-black/80 border-b border-white/5 z-50">
        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Live Secure</span>
        <select
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          className="bg-white/5 text-white text-xs p-2 rounded-xl border border-white/20 outline-none cursor-pointer"
        >
          <option value="en">🇬🇧 English</option>
          <option value="ja">🇯🇵 Japanese</option>
          <option value="fr">🇫🇷 Français</option>
          <option value="es">🇪🇸 Español</option>
        </select>
      </header>

      <main className="flex-1 relative p-4 flex flex-col items-center justify-center overflow-hidden">
        <AdaptiveVideoGrid />
        <AudioInjectionManager targetLang={targetLang} isListening={isListening} />
      </main>

      <footer className="h-28 flex items-center justify-center gap-10">
        <button 
          onClick={() => setIsListening(!isListening)}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all shadow-2xl ${
            isListening ? 'bg-red-600 animate-pulse' : 'bg-white'
          }`}
        >
          {isListening ? '⏹️' : '🎙️'}
        </button>
        <button onClick={() => window.location.reload()} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-xl opacity-40">🚪</button>
      </footer>

      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function AdaptiveVideoGrid() {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  return (
    <div className="h-full w-full max-w-5xl flex flex-col md:grid md:grid-cols-2 gap-4">
      {tracks.map(t => (
        <div key={t.participant.identity} className="flex-1 min-h-0 rounded-[32px] overflow-hidden border border-white/5 bg-white/5 shadow-2xl">
          <ParticipantTile trackRef={t} disableFollower={true} />
        </div>
      ))}
    </div>
  );
}

function AudioInjectionManager({ targetLang, isListening }: { targetLang: string, isListening: boolean }) {
  const room = useRoomContext();
  const queue = useRef<string[]>([]);
  const isPlaying = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const destRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const aiTrackRef = useRef<LocalAudioTrack | null>(null);

  const playQueue = async () => {
    if (isPlaying.current || queue.current.length === 0) return;
    isPlaying.current = true;

    const b64 = queue.current.shift();
    if (b64 && audioCtxRef.current && destRef.current) {
      try {
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        const buffer = await audioCtxRef.current.decodeAudioData(bytes.buffer);
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(destRef.current);
        source.connect(audioCtxRef.current.destination);
        source.onended = () => { isPlaying.current = false; playQueue(); };
        source.start(0);
      } catch (e) { isPlaying.current = false; playQueue(); }
    }
  };

  useEffect(() => {
    if (!isListening || typeof window === 'undefined') return;
    
    let socket: WebSocket;
    let recorder: MediaRecorder;

    const start = async () => {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      destRef.current = audioCtxRef.current.createMediaStreamDestination();
      aiTrackRef.current = new LocalAudioTrack(destRef.current.stream.getAudioTracks()[0]);
      await room.localParticipant.publishTrack(aiTrackRef.current);

      const tRes = await fetch('/api/deepgram-token');
      const { token } = await tRes.json();
      
      socket = new WebSocket('wss://api.deepgram.com/v1/listen?model=nova-2&language=fr&endpointing=300', ['token', token]);
      socket.onmessage = async (m) => {
        const d = JSON.parse(m.data);
        if (d.is_final && d.channel.alternatives[0].transcript) {
          const res = await fetch('/api/agent', { method: 'POST', body: JSON.stringify({ text: d.channel.alternatives[0].transcript, targetLang }) });
          const json = await res.json();
          if (json.audio) { queue.current.push(json.audio); playQueue(); }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorder.ondataavailable = (e) => socket.readyState === 1 && socket.send(e.data);
      recorder.start(250);
    };

    start();
    return () => { 
        socket?.close(); 
        recorder?.stop(); 
        if (aiTrackRef.current) room.localParticipant.unpublishTrack(aiTrackRef.current);
    };
  }, [isListening]);

  return null;
}

export default InstantTalkMain;