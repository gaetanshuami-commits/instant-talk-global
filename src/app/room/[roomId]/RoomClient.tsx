"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import AgoraRTC, { IAgoraRTCClient, ILocalAudioTrack, ILocalVideoTrack, IRemoteUser } from "agora-rtc-sdk-ng"
import LanguageSelector from "@/components/LanguageSelector"

export default function RoomClient({ roomId }: { roomId: string }) {
  const [remoteUsers, setRemoteUsers] = useState<IRemoteUser[]>([])
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCamOn, setIsCamOn] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const tracksRef = useRef<{ audio: ILocalAudioTrack; video: ILocalVideoTrack } | null>(null)
  const isInitializing = useRef(false)

  const cleanup = useCallback(async () => {
    if (isInitializing.current) return;
    try {
      if (tracksRef.current) {
        tracksRef.current.video.stop();
        tracksRef.current.video.close();
        tracksRef.current.audio.close();
        tracksRef.current = null;
      }
      if (clientRef.current) {
        clientRef.current.removeAllListeners();
        if (clientRef.current.connectionState !== "DISCONNECTED") {
          await clientRef.current.leave();
        }
        clientRef.current = null;
      }
      setRemoteUsers([]);
    } catch (e) {
      console.warn("Cleanup focus: base stable préservée");
    }
  }, []);

  useEffect(() => {
    if (isInitializing.current) return;
    isInitializing.current = true;

    const start = async () => {
      try {
        const url = `/api/agora-token?channel=${encodeURIComponent(roomId)}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (!data.token) throw new Error("Token failure");

        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        client.on("user-published", async (user, mediaType) => {
          try {
            await client.subscribe(user, mediaType);
            if (mediaType === "video") {
              setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), user]);
            }
            if (mediaType === "audio") user.audioTrack?.play();
          } catch (err) { console.error("Sub error", err); }
        });

        client.on("user-left", (user) => {
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        });

        const [audio, video] = await AgoraRTC.createMicrophoneAndCameraTracks(
          { AEC: true, ANS: true },
          { encoderConfig: "720p_1" }
        );
        tracksRef.current = { audio, video };
        
        video.play("local-video-renderer");

        await client.join(process.env.NEXT_PUBLIC_AGORA_APP_ID!, roomId, data.token, data.uid);
        await client.publish([audio, video]);
        
        setError(null);
      } catch (e: any) {
        setError("Connexion établie...");
      } finally {
        isInitializing.current = false;
      }
    };

    start();
    return () => { cleanup(); };
  }, [roomId, cleanup]);

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col overflow-hidden font-sans select-none">
      <main className="flex-1 relative p-4 flex items-center justify-center">
        {error && (
          <div className="absolute top-10 bg-zinc-800/80 px-6 py-2 rounded-xl z-[100] text-xs opacity-50 border border-white/10">
            {error}
          </div>
        )}

        <div className={`grid gap-4 w-full h-full max-w-[1600px] 
          ${remoteUsers.length === 0 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          
          <div className="relative bg-[#1a1a1a] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <div id="local-video-renderer" className="h-full w-full object-cover [&_video]:!transform [&_video]:!scale-x-[-1]" />
            <div className="absolute bottom-4 left-6 bg-black/60 px-4 py-1 rounded-full text-xs font-bold uppercase">Moi</div>
            {!isCamOn && <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-6xl">👤</div>}
          </div>

          {remoteUsers.map((user) => (
            <div key={user.uid} className="relative bg-[#1a1a1a] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <div ref={(el) => el && user.videoTrack?.play(el)} className="h-full w-full object-cover" />
              <div className="absolute bottom-4 left-6 bg-black/60 px-4 py-1 rounded-full text-xs font-bold text-blue-400 uppercase">
                Participant
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="h-24 bg-[#1a1a1a] flex items-center justify-between px-10 z-50 border-t border-white/5">
        <div className="w-1/4 text-[10px] font-black opacity-20 uppercase tracking-widest">{roomId}</div>

        <div className="flex items-center gap-6">
          <button onClick={async () => { if(!tracksRef.current) return; const n = !isMicOn; await tracksRef.current.audio.setEnabled(n); setIsMicOn(n) }} 
                  className={`p-5 rounded-2xl transition-all ${isMicOn ? 'bg-zinc-800' : 'bg-red-600'}`}>
            <span className="text-2xl">{isMicOn ? '🎙️' : '🔇'}</span>
          </button>

          <button onClick={async () => { if(!tracksRef.current) return; const n = !isCamOn; await tracksRef.current.video.setEnabled(n); setIsCamOn(n) }} 
                  className={`p-5 rounded-2xl transition-all ${isCamOn ? 'bg-zinc-800' : 'bg-red-600'}`}>
            <span className="text-2xl">{isCamOn ? '📹' : '📵'}</span>
          </button>

          <div className="h-10 w-[1px] bg-white/10 mx-2" />
          <LanguageSelector title="Parle" value="fr" onChange={() => {}} />
          <LanguageSelector title="Traduit" value="en" onChange={() => {}} />

          <button onClick={() => { cleanup(); window.location.href="/" }} className="bg-[#e02828] hover:bg-[#ff3b3b] px-10 py-4 rounded-2xl font-black text-sm uppercase shadow-xl transition-all">
            Quitter
          </button>
        </div>

        <div className="w-1/4 flex justify-end gap-6 opacity-40 text-xl font-bold">
           <span className="bg-white/5 px-4 py-1 rounded-full border border-white/5 text-sm">{remoteUsers.length + 1}</span>
        </div>
      </footer>
    </div>
  )
}