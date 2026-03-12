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
import { Track, LocalAudioTrack, Room } from 'livekit-client';
import '@livekit/components-styles';

export default function InstantTalkMission() {
  const [token, setToken] = useState("");
  const [targetLang, setTargetLang] = useState('en');
  const [isListening, setIsListening] = useState(false);

  const join = async () => {
    const resp = await fetch(`/api/get-participant-token?room=meeting-premium&username=user-${Math.random().toString(36).substring(7)}`);
    const data = await resp.json();
    setToken(data.token);
  };

  if (!token) return (
    <div className="h-screen bg-black flex items-center justify-center p-6 text-white font-sans">
      <div className="bg-white/5 p-10 rounded-[40px] border border-white/10 text-center max-w-sm w-full backdrop-blur-3xl">
        <h1 className="text-4xl font-black mb-8 italic tracking-tighter">INSTANT TALK</h1>
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
      connectOptions={{ autoSubscribe: true }}
      className="h-screen bg-[#050505] flex flex-col overflow-hidden"
    >
      <header className="h-16 flex justify-between items-center px-6 bg-black/80 border-b border-white/5 z-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">B2B SECURE STREAM</span>
        </div>
        <select
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          className="bg-white/5 text-white text-xs p-2 rounded-xl border border-white/20 outline-none"
        >
          <option value="en">🇬🇧 English</option>
          <option value="ja">🇯🇵 Japanese</option>
          <option value="fr">🇫🇷 Français</option>
          <option value="es">🇪🇸 Español</option>
        </select>
      </header>

      <main className="flex-1 relative p-4 flex flex-col items-center justify-center">
        <AdaptiveGrid />
        <PriorityAudioQueue targetLang={targetLang} isListening={isListening} />
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

function AdaptiveGrid() {
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

// PRIORITÉ 3 : FILE D'ATTENTE AUDIO ASYNCHRONE
function PriorityAudioQueue({ targetLang, isListening }: { targetLang: string, isListening: boolean }) {
  const room = useRoomContext();
  const queue = useRef<string[]>([]);
  const isPlaying = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const destRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const aiTrackRef = useRef<LocalAudioTrack | null>(null);

  const processQueue = async () => {
    if (isPlaying.current || queue.current.length === 0) return;
    isPlaying.current = true;

    const base64 = queue.current.shift();
    if (base64 && audioCtxRef.current && destRef.current) {
      try {
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const buffer = await audioCtxRef.current.decodeAudioData(bytes.buffer);
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(destRef.current);
        source.connect(audioCtxRef.current.destination);
        source.onended = () => { isPlaying.current = false; processQueue(); };
        source.start(0);
      } catch (e) { isPlaying.current = false; processQueue(); }
    }
  };

  useEffect(() => {
    if (!isListening) return;
    
    let socket: WebSocket;
    let recorder: MediaRecorder;

    const start = async () => {
      audioCtxRef.current = new AudioContext();
      destRef.current = audioCtxRef.current.createMediaStreamDestination();
      aiTrackRef.current = new LocalAudioTrack(destRef.current.stream.getAudioTracks()[0]);
      await room.localParticipant.publishTrack(aiTrackRef.current);

      const tokenRes = await fetch('/api/deepgram-token');
      const { token } = await tokenRes.json();
      
      socket = new WebSocket('wss://api.deepgram.com/v1/listen?model=nova-2&language=fr&endpointing=300', ['token', token]);
      
      socket.onmessage = async (msg) => {
        const data = JSON.parse(msg.data);
        if (data.is_final && data.channel.alternatives[0].transcript) {
          const res = await fetch('/api/agent', {
            method: 'POST',
            body: JSON.stringify({ text: data.channel.alternatives[0].transcript, targetLang })
          });
          const { audio } = await res.json();
          if (audio) { queue.current.push(audio); processQueue(); }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorder.ondataavailable = (e) => socket.readyState === 1 && socket.send(e.data);
      recorder.start(250);
    };

    start();
    return () => { socket?.close(); recorder?.stop(); };
  }, [isListening]);

  return null;
}