"use client";

import { useEffect, useRef, useState } from "react";
import {
  Room,
  Track
} from "livekit-client";
import { useParams } from "next/navigation";
import { VoiceQueue } from "@/lib/realtime/voice-queue";
import {
  decodeParticipantLanguageMessage,
  encodeParticipantLanguageMessage,
  removeParticipantLanguage,
  upsertParticipantLanguage
} from "@/lib/realtime/participant-language-registry";
import {
  decodeRoomVoiceIntentMessage
} from "@/lib/realtime/room-voice-intent-channel";

export default function RoomPage() {

  const params = useParams();
  const roomId = String(params.roomId || "");

  const [room] = useState(() => new Room());
  const [connected, setConnected] = useState(false);
  const [videoTrack, setVideoTrack] = useState<any>(null);

  const [targetLang, setTargetLang] = useState("EN");

  const [liveCaption, setLiveCaption] = useState("Live captions are ready.");
  const [translatedCaption, setTranslatedCaption] = useState("Translated captions will appear here.");

  const [translationLoading, setTranslationLoading] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const voiceQueueRef = useRef<VoiceQueue | null>(null);

  const voiceMap: Record<string,string> = {
    FR:"fr-FR-DeniseNeural",
    EN:"en-US-JennyNeural",
    DE:"de-DE-KatjaNeural",
    ES:"es-ES-ElviraNeural",
    IT:"it-IT-ElsaNeural",
    NL:"nl-NL-ColetteNeural",
    PT:"pt-PT-RaquelNeural",
    AR:"ar-SA-ZariyahNeural",
    ZH:"zh-CN-XiaoxiaoNeural",
    JA:"ja-JP-NanamiNeural"
  };

  useEffect(()=>{

    async function connectRoom(){

      const userId="user-"+Math.floor(Math.random()*9999);

      const res=await fetch("/api/livekit",{
        method:"POST",
        headers:{ "Content-Type":"application/json"},
        body:JSON.stringify({
          roomName:roomId,
          userId
        })
      });

      const data=await res.json();

      await room.connect(
        process.env.NEXT_PUBLIC_LIVEKIT_URL!,
        data.token
      );

      await room.localParticipant.enableCameraAndMicrophone();

      room.localParticipant.videoTrackPublications.forEach(pub=>{
        if(pub.track && pub.track.kind===Track.Kind.Video){
          setVideoTrack(pub.track);
        }
      });

      voiceQueueRef.current=new VoiceQueue({
        room,
        defaultLang:targetLang,
        defaultVoice:voiceMap[targetLang],
        onStart:()=>setVoiceLoading(true),
        onEnd:()=>setVoiceLoading(false),
        onError:()=>setVoiceLoading(false)
      });

      setConnected(true);

    }

    connectRoom();

  },[roomId]);

  useEffect(()=>{

    if(!videoTrack) return;

    const el=document.getElementById("local-video") as HTMLVideoElement;

    if(!el) return;

    videoTrack.attach(el);

    return ()=>videoTrack.detach(el);

  },[videoTrack]);

  useEffect(()=>{

    if(!liveCaption) return;

    async function translate(){

      try{

        if(targetLang==="FR"){
          setTranslatedCaption(liveCaption);
          return;
        }

        setTranslationLoading(true);

        const res=await fetch("/api/translate",{
          method:"POST",
          headers:{ "Content-Type":"application/json"},
          body:JSON.stringify({
            text:liveCaption,
            sourceLang:"FR",
            targetLang
          })
        });

        const data=await res.json();

        setTranslatedCaption(data.translatedText);

        voiceQueueRef.current?.enqueue({
          text:data.translatedText,
          lang:targetLang,
          voice:voiceMap[targetLang]
        });

      }
      finally{
        setTranslationLoading(false);
      }

    }

    translate();

  },[liveCaption,targetLang]);

  async function startCaptions(){

    const stream=await navigator.mediaDevices.getUserMedia({
      audio:true
    });

    mediaStreamRef.current=stream;

    const recorder=new MediaRecorder(stream,{
      mimeType:"audio/webm"
    });

    mediaRecorderRef.current=recorder;

    const socket=new WebSocket("ws://127.0.0.1:8787");

    socketRef.current=socket;

    socket.onmessage=(event)=>{

      const payload=JSON.parse(event.data);

      if(
        payload.type==="transcript"
        ||
        payload.type==="interim"
      ){

        const text=payload.transcript?.trim();

        if(text){
          setLiveCaption(text);
        }

      }

    };

    recorder.ondataavailable=async(e)=>{

      if(
        e.data.size>800
        &&
        socket.readyState===WebSocket.OPEN
      ){

        socket.send(await e.data.arrayBuffer());

      }

    };

    recorder.start(250);

  }

  return(

    <div className="min-h-screen bg-black text-white p-6">

      <h1 className="text-3xl font-bold">
        Room: {roomId}
      </h1>

      <div className="mt-6">

        <div className="h-[300px] w-[520px] rounded-2xl overflow-hidden border border-white/10">

          <video
            id="local-video"
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover scale-x-[-1]"
          />

        </div>

      </div>

      <button
        onClick={startCaptions}
        className="mt-6 px-4 py-2 bg-indigo-500 rounded-full"
      >
        Start captions
      </button>

      <div className="mt-6">
        {translationLoading?"Translating...":translatedCaption}
      </div>

    </div>

  );

}
