"use client";

import { useState, useRef } from 'react';
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
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetLang, setTargetLang] = useState('en');
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        // INTELLIGENCE CAMERA : On force le selfie sur mobile et la HD
        video: { 
          facingMode: "user", 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 } 
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = processAudio;
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Erreur d'accès:", error);
      alert("Impossible d'accéder au micro ou à la caméra HD.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const processAudio = async () => {
    try {
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const dgRes = await fetch('/api/transcribe', { method: 'POST', body: formData });
      const dgData = await dgRes.json();
      if (!dgData.transcript) throw new Error("Je n'ai pas bien entendu.");

      const trRes = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: dgData.transcript, targetLanguage: targetLang }) 
      });
      
      const trData = await trRes.json();
      if (trData.error) throw new Error(trData.error);

      const audio = new Audio(`data:audio/mp3;base64,${trData.audio}`);
      audio.play();

    } catch (error: any) {
      console.error("Erreur IA:", error);
      alert("Erreur: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // INTELLIGENCE LAYOUT : h-[100dvh] pour ne pas déborder sur mobile
  return (
    <main className="flex flex-col h-[100dvh] bg-[#0a0a0a] text-white relative font-sans overflow-hidden">
      
      {/* HEADER PREMIUM */}
      <div className="absolute top-0 w-full z-20 flex justify-between items-center px-4 sm:px-8 py-4 bg-white/5 backdrop-blur-lg border-b border-white/10">
        <h1 className="text-lg sm:text-xl font-semibold tracking-wide flex items-center gap-2 sm:gap-3">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.8)] animate-pulse"></span>
          Instant Talk <span className="text-blue-500 font-bold hidden sm:inline">Global</span>
        </h1>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs sm:text-sm text-gray-400 hidden sm:inline">Traduire en :</span>
          <select 
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="bg-black/40 border border-white/20 text-white text-xs sm:text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 backdrop-blur-md outline-none cursor-pointer transition-all hover:border-white/40 max-w-[130px] sm:max-w-none"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-gray-900 text-white">
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ZONE CENTRALE */}
      <div className="flex-1 flex items-center justify-center relative w-full h-full">
        
        {/* LA CAMERA MAGIQUE : Cadrage parfait, effet miroir (-scale-x-100), pas de débordement */}
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover object-center transform -scale-x-100 z-0"
        />
        
        <div className="absolute inset-0 bg-black/20 z-10 pointer-events-none"></div>
        
        {/* LE BOUTON MICROPHONE */}
        <div className="absolute bottom-10 sm:bottom-12 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-4 sm:gap-6 z-20 w-full px-4">
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={isProcessing}
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-3xl sm:text-4xl transition-all duration-300 ${
              isRecording 
                ? 'bg-red-500 scale-110 shadow-[0_0_50px_rgba(239,68,68,0.6)]' 
                : isProcessing 
                ? 'bg-yellow-500 animate-spin cursor-not-allowed shadow-[0_0_30px_rgba(234,179,8,0.4)]' 
                : 'bg-blue-600 hover:bg-blue-500 hover:scale-105 shadow-[0_0_40px_rgba(37,99,235,0.5)] border border-blue-400/30'
            }`}
          >
            {isRecording ? '🔴' : isProcessing ? '⏳' : '🎤'}
          </button>
          
          <div className="bg-black/50 border border-white/10 backdrop-blur-xl text-gray-200 px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-medium tracking-wide shadow-xl text-center">
            {isRecording ? 'Parlez maintenant... (Relâchez pour traduire)' :
             isProcessing ? 'Génération de la voix IA...' :
             'Maintenez le micro pour parler'}
          </div>
        </div>
      </div>
    </main>
  );
}
