"use client";

import { useState, useRef } from 'react';
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';

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
          <h1 className="text-3xl font-bold mb-6 italic tracking-tighter text-blue-500">Instant Talk</h1>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Nom de la réunion" 
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full bg-black/40 border border-white/20 p-3 rounded-xl outline-none focus:border-blue-500 transition-all text-center"
            />
            <button onClick={joinMeeting} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/30">
              Démarrer la réunion
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-[100dvh] bg-[#0a0a0a] text-white relative overflow-hidden">
      <div className="absolute top-0 w-full z-30 flex justify-between items-center px-4 sm:px-8 py-4 bg-white/5 backdrop-blur-lg border-b border-white/10">
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
        audio={true}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        data-lk-theme="default"
        className="flex-1"
        onDisconnected={() => setToken("")}
      >
        <ConferenceLayout targetLang={targetLang} />
        <RoomAudioRenderer />
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-40">
            <ControlBar variation="minimal" />
        </div>
      </LiveKitRoom>
    </main>
  );
}

function ConferenceLayout({ targetLang }: { targetLang: string }) {
  const tracks = useTracks();
  const [isTranslating, setIsTranslating] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);

  // LOGIQUE DE TRADUCTION INSTANTANÉE
  const toggleTranslation = async () => {
    if (isTranslating) {
      mediaRecorder.current?.stop();
      setIsTranslating(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;
      
      let chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob);

        // Appel de ton API pipeline
        const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
        const data = await res.json();

        if (data.transcript) {
          const trRes = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: data.transcript, targetLanguage: targetLang })
          });
          const trData = await trRes.json();
          const audio = new Audio(`data:audio/mp3;base64,${trData.audio}`);
          audio.play();
        }
        
        if (isTranslating) recorder.start(); // Relance pour l'effet "temps réel"
      };

      recorder.start();
      setTimeout(() => recorder.stop(), 3000); // Échantillon de 3 secondes
      setIsTranslating(true);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="relative w-full h-full">
      <GridLayout tracks={tracks} style={{ height: 'calc(100dvh - 64px)', marginTop: '64px' }}>
        <ParticipantTile />
      </GridLayout>

      {/* BOUTON D'ACTION POUR LA TRADUCTION */}
      <button 
        onClick={toggleTranslation}
        className={`absolute top-20 right-8 z-50 px-6 py-2 rounded-full font-bold transition-all shadow-lg ${
          isTranslating ? 'bg-red-600 animate-pulse' : 'bg-blue-600 hover:bg-blue-500'
        }`}
      >
        {isTranslating ? '👂 IA Écoute...' : '🎤 Activer Traduction Live'}
      </button>
    </div>
  );
}
