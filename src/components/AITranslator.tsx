"use client";

import { useState, useEffect, useRef } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { LocalAudioTrack } from 'livekit-client';
import { DeepgramStreamManager } from '@/lib/deepgramStream';

export function AITranslator({ targetLang }: { targetLang: string }) {
  const room = useRoomContext();
  const audioQueue = useRef<string[]>([]);
  const isPlaying = useRef(false);
  const [status, setStatus] = useState("Désactivé");
  const [isActive, setIsActive] = useState(false);
  
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
    };
  }, [room]);

  const toggleAI = async () => {
    if (isActive) {
      streamManager.current?.stop();
      if (aiTrackRef.current) room.localParticipant.unpublishTrack(aiTrackRef.current);
      setIsActive(false);
      setStatus("Désactivé");
      return;
    }

    setIsActive(true);
    setStatus("Démarrage Audio...");

    try {
      // 1. DÉBLOCAGE AUDIO NAVIGATEUR (Obligatoire)
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();
      
      if (!destRef.current) {
        destRef.current = audioCtxRef.current.createMediaStreamDestination();
        aiTrackRef.current = new LocalAudioTrack(destRef.current.stream.getAudioTracks()[0]);
        await room.localParticipant.publishTrack(aiTrackRef.current);
      }

      setStatus("Vérification clés Deepgram...");
      const resp = await fetch('/api/deepgram-token');
      const { token } = await resp.json();
      if (!token) throw new Error("Clé Deepgram (API) introuvable");

      streamManager.current = new DeepgramStreamManager(async (texteEntendu: string) => {
        setStatus(`Traduction de: "${texteEntendu}"...`);
        try {
          const trRes = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: texteEntendu, targetLanguage: langRef.current })
          });
          
          if (!trRes.ok) throw new Error("Erreur Serveur IA");
          
          const trData = await trRes.json();
          if (trData.error) throw new Error(trData.error);
          
          if (trData.audio) {
             setStatus(`IA parle: ${trData.translation}`);
             pushToQueue(trData.audio);
          }
        } catch (e: any) { 
          setStatus(`Erreur IA: ${e.message}`);
          console.error(e);
        }
      });

      await streamManager.current.start(token);
      setStatus("IA ÉCOUTE 🟢");

    } catch (error: any) {
      setIsActive(false);
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
      if (isActive) setStatus("IA ÉCOUTE 🟢");
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

      // Injection dans le réseau (l'autre t'entend) + En local (tu l'entends)
      source.connect(destRef.current);
      source.connect(audioCtxRef.current.destination);

      source.onended = () => { isPlaying.current = false; playNext(); };
      source.start(0);
    } catch (e) { 
      isPlaying.current = false; playNext(); 
    }
  };

  return (
    <div className="absolute bottom-10 left-10 z-[9999] flex flex-col items-start gap-2">
       <button 
        onClick={toggleAI}
        className={`px-6 py-3 rounded-xl font-bold text-white shadow-2xl transition-all border ${
          isActive ? 'bg-red-600 border-red-400 animate-pulse' : 'bg-blue-600 border-blue-400'
        }`}
       >
         {isActive ? '🔴 Arrêter Traduction' : '⚡ Activer Moteur IA'}
       </button>
       <div className="bg-black/80 text-white/80 text-xs px-3 py-1 rounded border border-white/10">
         Statut: {status}
       </div>
    </div>
  );
}
