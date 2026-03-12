"use client";
import { useEffect, useRef } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { LocalAudioTrack } from 'livekit-client';

export function AIAudioInjector({ targetLang, isActive }: { targetLang: string, isActive: boolean }) {
  const room = useRoomContext();
  const audioQueue = useRef<string[]>([]);
  const isPlaying = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const destRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const aiTrackRef = useRef<LocalAudioTrack | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const langRef = useRef(targetLang);

  useEffect(() => { langRef.current = targetLang; }, [targetLang]);

  useEffect(() => {
    if (!isActive) {
      stopEverything();
      return;
    }
    startPipeline();
    return () => stopEverything();
  }, [isActive]);

  const stopEverything = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (socketRef.current) socketRef.current.close();
    if (aiTrackRef.current) {
      room.localParticipant.unpublishTrack(aiTrackRef.current);
      aiTrackRef.current = null;
    }
  };

  const startPipeline = async () => {
    try {
      // 1. Initialisation AudioContext & Injection WebRTC
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();
      
      if (!destRef.current) {
        destRef.current = audioCtxRef.current.createMediaStreamDestination();
        aiTrackRef.current = new LocalAudioTrack(destRef.current.stream.getAudioTracks()[0]);
        await room.localParticipant.publishTrack(aiTrackRef.current);
      }

      // 2. Connexion Deepgram Streaming (Latence 0)
      const resp = await fetch('/api/deepgram-token');
      const { token } = await resp.json();
      
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const wsUrl = `wss://api.deepgram.com/v1/listen?model=nova-2&language=fr&interim_results=true&endpointing=300`;
      socketRef.current = new WebSocket(wsUrl, ['token', token]);

      socketRef.current.onopen = () => {
        mediaRecorderRef.current = new MediaRecorder(streamRef.current as MediaStream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current.addEventListener('dataavailable', (e) => {
          if (e.data.size > 0 && socketRef.current?.readyState === 1) socketRef.current.send(e.data);
        });
        mediaRecorderRef.current.start(250); // Chunks ultra-rapides
      };

      socketRef.current.onmessage = async (message) => {
        const received = JSON.parse(message.data);
        const transcript = received.channel?.alternatives?.[0]?.transcript;
        
        // Si la phrase est validée par Deepgram
        if (transcript && (received.is_final || received.speech_final)) {
          // Appel de notre API stricte
          const agentRes = await fetch('/api/agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: transcript, targetLang: langRef.current })
          });
          const { audio } = await agentRes.json();
          if (audio) {
            audioQueue.current.push(audio);
            if (!isPlaying.current) playNext();
          }
        }
      };
    } catch (e) { console.error("Erreur Pipeline", e); }
  };

  const playNext = async () => {
    if (audioQueue.current.length === 0) {
      isPlaying.current = false;
      return;
    }
    isPlaying.current = true;
    const base64 = audioQueue.current.shift();
    if (!base64 || !audioCtxRef.current || !destRef.current) return;
    
    try {
      const binaryString = window.atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

      const audioBuffer = await audioCtxRef.current.decodeAudioData(bytes.buffer);
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = audioBuffer;

      // Le son part dans LiveKit (pour l'autre) ET dans tes écouteurs (pour toi)
      source.connect(destRef.current);
      source.connect(audioCtxRef.current.destination);

      source.onended = () => { isPlaying.current = false; playNext(); };
      source.start(0);
    } catch (e) { isPlaying.current = false; playNext(); }
  };

  return null; // Composant 100% invisible
}
