"use client";

import React, { useEffect, useState, useRef } from 'react';
import { LiveKitRoom, useTracks, useLocalParticipant, ParticipantTile } from '@livekit/components-react';
import { Track, LocalAudioTrack } from 'livekit-client';
import Visualizer from '@/components/Visualizer';
import '@livekit/components-styles';

// --- OPTIMISATION NATURAL VOICE ---
const VOICE_SETTINGS = {
  stability: 0.35,       // Plus bas = plus d'émotion et de variations naturelles
  similarity_boost: 0.85, // Plus haut = clone exact de ta voix
  style: 0.55,           // Ajoute du punch à l'élocution
  use_speaker_boost: true
};

function AIAudioInjector({ audioData, onAnalyze }: { audioData: string | null, onAnalyze: (n: AnalyserNode | null) => void }) {
  const { localParticipant } = useLocalParticipant();
  useEffect(() => {
    if (!audioData || !localParticipant) return;
    const inject = async () => {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = await ctx.decodeAudioData(Uint8Array.from(atob(audioData), (c) => c.charCodeAt(0)).buffer);
      const analyser = ctx.createAnalyser();
      onAnalyze(analyser);
      const source = ctx.createBufferSource();
      const dest = ctx.createMediaStreamDestination();
      source.buffer = buffer;
      source.connect(analyser);
      analyser.connect(dest);
      analyser.connect(ctx.destination);
      const track = new LocalAudioTrack(dest.stream.getAudioTracks()[0]);
      await localParticipant.publishTrack(track, { name: "ai_voice", source: Track.Source.Microphone });
      source.start(0);
      source.onended = () => {
        localParticipant.unpublishTrack(track);
        track.stop();
        onAnalyze(null);
      };
    };
    inject();
  }, [audioData, localParticipant]);
  return null;
}

export default function InstantTalk() {
  const [token, setToken] = useState("");
  const [targetLang, setTargetLang] = useState("Japanese");
  const [transcript, setTranscript] = useState("");
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [analyzer, setAnalyzer] = useState<AnalyserNode | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!token) return;
    const startSTT = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      socketRef.current = new WebSocket('wss://api.deepgram.com/v1/listen?endpointing=300', ['token', process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY!]);
      socketRef.current.onmessage = async (msg) => {
        const data = JSON.parse(msg.data);
        const text = data.channel?.alternatives[0]?.transcript;
        if (data.is_final && text) {
          setTranscript(text);
          const res = await fetch('/api/agent', { 
            method: 'POST', 
            body: JSON.stringify({ 
              text, 
              targetLanguage: targetLang,
              settings: VOICE_SETTINGS // On passe les réglages optimisés
            }) 
          });
          const result = await res.json();
          if (result.audio) setCurrentAudio(result.audio);
        }
      };
      recorder.ondataavailable = (e) => { if (e.data.size > 0 && socketRef.current?.readyState === 1) socketRef.current.send(e.data); };
      recorder.start(250);
    };
    startSTT();
    return () => socketRef.current?.close();
  }, [token, targetLang]);

  // --- RENDU LANDING PAGE ---
  if (!token) return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1)0%,rgba(0,0,0,1)100%)]" />
      
      <nav className="relative z-10 flex justify-between p-8 max-w-7xl mx-auto items-center">
        <div className="text-2xl font-black tracking-tighter uppercase italic">Instant Talk</div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-zinc-400">
          <a href="#" className="hover:text-white transition">Technologie</a>
          <a href="#" className="hover:text-white transition">Sécurité B2B</a>
          <a href="#" className="hover:text-white transition">Tarifs</a>
        </div>
        <button onClick={() => setToken("DEV_MODE")} className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm hover:bg-zinc-200 transition">
          Connexion
        </button>
      </nav>

      <main className="relative z-10 flex flex-col items-center justify-center pt-32 text-center px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-6 uppercase tracking-widest">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          V2.0 Gemini Flash Enabled
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
          COMMUNIQUEZ SANS <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">FRONTIÈRES.</span>
        </h1>
        <p className="max-w-2xl text-zinc-400 text-lg md:text-xl mb-12 font-medium">
          La première plateforme de visioconférence B2B avec traduction instantanée par clonage vocal. Parlez votre langue, ils entendent votre voix en 29 langues.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4">
          <button onClick={() => setToken("DEV_MODE")} className="bg-blue-600 px-10 py-4 rounded-full font-bold text-lg hover:bg-blue-500 transition shadow-[0_0_40px_rgba(37,99,235,0.3)]">
            Démarrer une réunion gratuite
          </button>
          <button className="bg-zinc-900 border border-zinc-800 px-10 py-4 rounded-full font-bold text-lg hover:bg-zinc-800 transition">
            Réserver une démo
          </button>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 max-w-6xl mx-auto w-full pb-20">
          <FeatureCard title="Latence < 500ms" desc="Grâce au pipeline Deepgram + Gemini Flash, la traduction est quasi-instantanée." />
          <FeatureCard title="Clonage Vocal" desc="Votre timbre de voix et vos émotions sont préservés dans la langue cible." />
          <FeatureCard title="Sécurité Entreprise" desc="Flux chiffrés de bout en bout via LiveKit SFU infrastructure." />
        </div>
      </main>
    </div>
  );

  // --- RENDU APP APP ---
  return (
    <main className="h-screen bg-black flex flex-col text-white font-sans">
      <nav className="p-4 border-b border-white/10 flex justify-between items-center bg-[#050505]">
        <div className="font-bold text-xl tracking-tighter uppercase italic">Instant Talk <span className="text-blue-500">Pro</span></div>
        <div className="flex items-center gap-6">
          <Visualizer analyzer={analyzer} />
          <div className="h-8 w-[1px] bg-white/10" />
          <select 
            className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl text-sm font-bold outline-none"
            onChange={(e) => setTargetLang(e.target.value)}
            value={targetLang}
          >
            <option value="Japanese">Japonais 🇯🇵</option>
            <option value="French">Français 🇫🇷</option>
            <option value="English">Anglais 🇺🇸</option>
            <option value="Spanish">Espagnol 🇪🇸</option>
            <option value="German">Allemand 🇩🇪</option>
          </select>
          <button onClick={() => setToken("")} className="text-xs font-bold text-red-500 hover:text-red-400 transition uppercase tracking-widest">Quitter</button>
        </div>
      </nav>

      <div className="flex-1 relative bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        <LiveKitRoom video={true} audio={false} token={token} serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL} className="h-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 h-full max-w-7xl mx-auto">
            <VideoGrid />
          </div>
          <AIAudioInjector audioData={currentAudio} onAnalyze={setAnalyzer} />
        </LiveKitRoom>

        <div className="absolute bottom-12 inset-x-0 flex justify-center pointer-events-none">
          <div className="bg-black/40 backdrop-blur-3xl border border-white/10 px-10 py-5 rounded-[2rem] max-w-3xl shadow-2xl">
            <p className="text-2xl font-bold text-blue-100 text-center leading-tight tracking-tight italic">
              {transcript || "En attente de parole..."}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-900 text-left hover:border-zinc-700 transition">
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function VideoGrid() {
  const tracks = useTracks([Track.Source.Camera]);
  return <>{tracks.map((t) => (
    <div key={t.participant.identity} className="relative bg-zinc-900 rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl group">
      <ParticipantTile trackRef={t} />
      <div className="absolute bottom-4 left-6 z-20">
        <span className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">
          {t.participant.identity}
        </span>
      </div>
    </div>
  ))}</>;
}