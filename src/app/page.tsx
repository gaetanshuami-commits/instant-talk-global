"use client";

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// CHARGEMENT DYNAMIQUE : Empêche Vercel de compiler ça côté serveur
const LiveKitRoom = dynamic(() => import('@livekit/components-react').then(m => m.LiveKitRoom), { ssr: false });
const RoomAudioRenderer = dynamic(() => import('@livekit/components-react').then(m => m.RoomAudioRenderer), { ssr: false });
const ParticipantTile = dynamic(() => import('@livekit/components-react').then(m => m.ParticipantTile), { ssr: false });

import { useTracks, useRoomContext } from '@livekit/components-react';
import { Track, LocalAudioTrack } from 'livekit-client';
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
    <div className="h-screen bg-black flex items-center justify-center text-white">
      <button onClick={join} className="bg-blue-600 px-10 py-4 rounded-2xl font-bold">START MISSION</button>
    </div>
  );

  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      video={true}
      audio={false}
      className="h-screen bg-black flex flex-col"
    >
      <header className="h-16 flex justify-between items-center px-6 border-b border-white/10">
        <span className="text-blue-500 font-bold">INSTANT TALK</span>
        <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="bg-white/10 text-white p-2 rounded">
          <option value="en">English</option>
          <option value="ja">Japanese</option>
          <option value="fr">Français</option>
        </select>
      </header>

      <main className="flex-1 relative p-4">
        <VideoGrid />
        <PriorityQueue targetLang={targetLang} isListening={isListening} />
      </main>

      <footer className="h-24 flex items-center justify-center gap-6">
        <button onClick={() => setIsListening(!isListening)} className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${isListening ? 'bg-red-600 animate-pulse' : 'bg-white'}`}>
          {isListening ? '⏹️' : '🎙️'}
        </button>
      </footer>
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function VideoGrid() {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  return (
    <div className="h-full w-full flex flex-col md:grid md:grid-cols-2 gap-4">
      {tracks.map(t => (
        <div key={t.participant.identity} className="flex-1 min-h-0 rounded-3xl overflow-hidden bg-white/5">
          <ParticipantTile trackRef={t} />
        </div>
      ))}
    </div>
  );
}

function PriorityQueue({ targetLang, isListening }: { targetLang: string, isListening: boolean }) {
  const room = useRoomContext();
  const queue = useRef<string[]>([]);
  const isPlaying = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const destRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const aiTrackRef = useRef<LocalAudioTrack | null>(null);

  const processQueue = async () => {
    if (isPlaying.current || queue.current.length === 0 || !audioCtxRef.current || !destRef.current) return;
    isPlaying.current = true;
    const b64 = queue.current.shift();
    if (b64) {
      try {
        const bytes = Uint8Array.from(window.atob(b64), c => c.charCodeAt(0));
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
    if (!isListening || typeof window === 'undefined') return;
    
    let socket: WebSocket;
    let recorder: MediaRecorder;

    const init = async () => {
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
          if (json.audio) { queue.current.push(json.audio); processQueue(); }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorder.ondataavailable = (e) => socket.readyState === 1 && socket.send(e.data);
      recorder.start(250);
    };

    init();
    return () => { 
      socket?.close(); 
      recorder?.stop(); 
      if (aiTrackRef.current) room.localParticipant.unpublishTrack(aiTrackRef.current);
    };
  }, [isListening]);

  return null;
}