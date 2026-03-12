"use client";

import { useState, useEffect, useRef } from 'react';
import { LiveKitRoom, RoomAudioRenderer, ParticipantTile, useTracks, GridLayout, useRoomContext } from '@livekit/components-react';
import { Track, LocalAudioTrack } from 'livekit-client';
import '@livekit/components-styles';

// ==========================================
// 1. LE MOTEUR D'ECOUTE (Intégré pour éviter les bugs)
// ==========================================
class DeepgramStreamManager {
  private socket: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private onFinalTranscript: (text: string) => void;
  private stream: MediaStream | null = null;

  constructor(onFinalTranscript: (text: string) => void) {
    this.onFinalTranscript = onFinalTranscript;
  }

  public async start(apiKey: string) {
    if (this.socket || this.mediaRecorder) return;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const wsUrl = `wss://api.deepgram.com/v1/listen?model=nova-2&language=fr&interim_results=true&endpointing=300`;
      
      this.socket = new WebSocket(wsUrl, ['token', apiKey]);
      this.socket.onopen = () => {
        this.mediaRecorder = new MediaRecorder(this.stream as MediaStream, { mimeType: 'audio/webm' });
        this.mediaRecorder.addEventListener('dataavailable', (event) => {
          if (event.data.size > 0 && this.socket?.readyState === 1) this.socket.send(event.data);
        });
        this.mediaRecorder.start(250); 
      };
      this.socket.onmessage = (message) => {
        const received = JSON.parse(message.data);
        const transcript = received.channel?.alternatives?.[0]?.transcript;
        if (!transcript) return;
        if (received.is_final || received.speech_final) {
           this.onFinalTranscript(transcript);
        }
      };
      this.socket.onclose = () => this.stop();
    } catch (err) {
      console.error("Erreur Micro/Deepgram", err);
    }
  }

  public stop() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') this.mediaRecorder.stop();
    if (this.stream) this.stream.getTracks().forEach(track => track.stop());
    if (this.socket) this.socket.close();
    this.mediaRecorder = null;
    this.socket = null;
    this.stream = null;
  }
}

// ==========================================
// 2. CONFIGURATION DES LANGUES
// ==========================================
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'GB Anglais' },
  { code: 'ja', name: 'JP Japonais' },
  { code: 'zh', name: 'CN Chinois' },
  { code: 'de', name: 'DE Allemand' },
  { code: 'fr', name: 'FR Français' },
  { code: 'es', name: 'ES Espagnol' },
];

// ==========================================
// 3. LA PAGE PRINCIPALE (Ton Interface)
// ==========================================
export default function Home() {
  const [token, setToken] = useState("");
  const [targetLang, setTargetLang] = useState('en');
  const [roomName, setRoomName] = useState("reunion-b2b");

  const joinMeeting = async () => {
    try {
      const resp = await fetch(`/api/get-participant-token?room=${roomName}&username=user-${Math.floor(Math.random() * 1000)}`);
      const data = await resp.json();
      setToken(data.token);
    } catch (e) { console.error(e); }
  };

  if (!token) {
    return (
      <main className="flex flex-col h-[100dvh] bg-[#111] text-white items-center justify-center p-4">
        <h1 className="text-3xl font-bold mb-6">CONVERSATION INSTANTANÉE</h1>
        <button onClick={joinMeeting} className="bg-blue-600 px-8 py-3 rounded-lg font-bold">Rejoindre la salle</button>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-[100dvh] bg-[#1a1a1a] text-white overflow-hidden">
      {/* TON HEADER EXACT */}
      <div className="flex justify-between items-center px-6 py-4 bg-[#111] border-b border-white/5 z-20">
        <h1 className="text-sm font-semibold flex items-center gap-2 tracking-wide uppercase">
          <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
          CONVERSATION INSTANTANÉE
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
        audio={false} // MICRO NATIF MUTÉ : Seule l'IA parlera
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

// ==========================================
// 4. LA GRILLE VIDÉO
// ==========================================
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

// ==========================================
// 5. LE CERVEAU IA INVISIBLE (Injection WebRTC)
// ==========================================
function PipelineManager({ targetLang }: { targetLang: string }) {
  const room = useRoomContext();
  const audioQueue = useRef<string[]>([]);
  const isPlaying = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("En attente");
  
  const streamManager = useRef<DeepgramStreamManager | null>(null);
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
      setStatus("Coupé");
      return;
    }

    setIsListening(true);
    setStatus("Initialisation...");

    try {
      // DÉBLOCAGE AUDIO DU NAVIGATEUR ET CRÉATION DU TUYAU WEBRTC
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();
      
      if (!destRef.current) {
        destRef.current = audioCtxRef.current.createMediaStreamDestination();
        aiTrackRef.current = new LocalAudioTrack(destRef.current.stream.getAudioTracks()[0]);
        await room.localParticipant.publishTrack(aiTrackRef.current);
      }

      // RÉCUPÉRATION CLÉ DEEPGRAM
      setStatus("Vérification sécurité...");
      const resp = await fetch('/api/deepgram-token');
      const { token } = await resp.json();
      if (!token) throw new Error("Clé Deepgram manquante côté serveur");

      // LANCEMENT DE L'ÉCOUTE ET TRADUCTION
      streamManager.current = new DeepgramStreamManager(async (finalTranscript: string) => {
        setStatus(`Traduction de: "${finalTranscript}"...`);
        try {
          const fullLangName = SUPPORTED_LANGUAGES.find(l => l.code === langRef.current)?.name || langRef.current;
          const trRes = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: finalTranscript, targetLanguage: fullLangName })
          });
          const trData = await trRes.json();
          
          if (trData.error) throw new Error(trData.error);
          if (trData.audio && trData.translation) {
             setStatus(`IA parle: ${trData.translation}`);
             pushToQueue(trData.audio);
          }
        } catch (e: any) { setStatus(`Erreur IA: ${e.message}`); }
      });

      await streamManager.current.start(token);
      setStatus("IA ÉCOUTE 🟢");

    } catch (error: any) {
      setIsListening(false);
      setStatus(`Erreur: ${error.message}`);
    }
  };

  const pushToQueue = (base64: string) => {
    audioQueue.current.push(base64);
    if (!isPlaying.current) playNext();
  };

  const playNext = async () => {
    if (audioQueue.current.length === 0) {
      isPlaying.current = false;
      if (isListening) setStatus("IA ÉCOUTE 🟢");
      return;
    }
    isPlaying.current = true;
    const base64 = audioQueue.current.shift();
    if (!base64 || !audioCtxRef.current || !destRef.current) return;
    
    try {
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);

      const audioBuffer = await audioCtxRef.current.decodeAudioData(bytes.buffer);
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = audioBuffer;

      // ENVOI DU SON À L'AUTRE PERSONNE (destRef) ET À TOI (destination)
      source.connect(destRef.current);
      source.connect(audioCtxRef.current.destination);

      source.onended = () => { isPlaying.current = false; playNext(); };
      source.start(0);
    } catch (e) { 
      isPlaying.current = false; playNext(); 
    }
  };

  return (
    <div className="absolute bottom-6 left-6 z-50 flex flex-col items-start gap-2">
       <button 
        onClick={toggleListening}
        className={`px-4 py-2 rounded font-bold text-white text-sm border transition-all shadow-xl ${
          isListening ? 'bg-red-600 border-red-500 animate-pulse' : 'bg-[#222] border-white/20 hover:bg-[#333]'
        }`}
       >
         {isListening ? '🔴 Couper Micro IA' : '⚡ Activer Micro IA'}
       </button>
       <div className="bg-black text-green-400 font-mono text-[10px] px-2 py-1 rounded border border-white/10 max-w-xs shadow-xl">
         [LOG]: {status}
       </div>
    </div>
  );
}