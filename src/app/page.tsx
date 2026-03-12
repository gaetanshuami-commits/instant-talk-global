"use client";

import { useState, useEffect } from 'react';
import {
  LiveKitRoom,
  VideoConference,
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
  // Ton ID de voix clonée
  const myVoiceId = "QaWvcRVDzoGrTmTauQpi";

  // Fonction pour générer un jeton de connexion (Simulation de "New Meeting")
  const joinMeeting = async () => {
    try {
      const resp = await fetch(`/api/get-participant-token?room=${roomName}&username=user-${Math.floor(Math.random() * 1000)}`);
      const data = await resp.json();
      setToken(data.token);
    } catch (e) {
      console.error(e);
    }
  };

  if (token === "") {
    return (
      <main className="flex flex-col h-[100dvh] bg-[#0a0a0a] text-white items-center justify-center p-4">
        <div className="z-20 bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl text-center max-w-md w-full">
          <h1 className="text-3xl font-bold mb-6">Instant Talk <span className="text-blue-500">Global</span></h1>
          <input 
            type="text" 
            placeholder="Nom de la réunion" 
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="w-full bg-black/40 border border-white/20 p-3 rounded-xl mb-4 outline-none focus:border-blue-500 transition-all"
          />
          <button 
            onClick={joinMeeting}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/30"
          >
            Démarrer la réunion
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-[100dvh] bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* HEADER (Identique au design précédent) */}
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
              <option key={lang.code} value={lang.code} className="bg-gray-900">{lang.name}</option>
            ))}
          </select>
          <button onClick={() => setToken("")} className="bg-red-500/20 text-red-500 px-3 py-1 rounded-lg text-xs border border-red-500/30">Quitter</button>
        </div>
      </div>

      {/* ZONE DE CONFERENCE LIVEKIT */}
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        data-lk-theme="default"
        className="flex-1 mt-16"
        onDisconnected={() => setToken("")}
      >
        <MyVideoConference targetLang={targetLang} voiceId={myVoiceId} />
        <RoomAudioRenderer />
        {/* Barre de contrôle moderne en bas */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30">
            <ControlBar variation="minimal" />
        </div>
      </LiveKitRoom>
    </main>
  );
}

// Composant interne pour gérer l'affichage et la traduction
function MyVideoConference({ targetLang, voiceId }: { targetLang: string, voiceId: string }) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, name: 'camera' },
      { source: Track.Source.ScreenShare, name: 'screen_share' },
    ],
    { onlySubscribed: false },
  );

  return (
    <GridLayout tracks={tracks} style={{ height: 'calc(100dvh - 64px)' }}>
      <ParticipantTile />
    </GridLayout>
  );
}
