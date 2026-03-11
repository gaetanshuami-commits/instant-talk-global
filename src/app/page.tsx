"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Testimonials from "@/components/Testimonials";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [room, setRoom] = useState("instant-talk-global");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && room) {
      // Redirige vers la salle vidéo dynamique que nous avons créée
      router.push(`/room/${room}`);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center pt-20">
      
      {/* 1. SECTION HERO (Ton interface de connexion à la salle) */}
      <div className="w-full max-w-md mx-auto px-4 mb-24">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Instant Talk
          </h1>
          <p className="text-gray-400">
            Communication mondiale. Sans barrières linguistiques.
          </p>
        </div>

        <div className="bg-[#111111] border border-gray-800 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Votre nom
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex : Marie Dupont"
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Salle
              </label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#2a2a35] hover:bg-[#3a3a45] text-white font-medium py-3 px-4 rounded-lg transition-colors flex justify-center items-center"
            >
              Rejoindre <span className="ml-2">→</span>
            </button>
          </form>
        </div>
        
        <p className="text-center text-xs text-gray-600 mt-8">
          Propulsé par LiveKit • Deepgram • Gemini 2.5 Flash • ElevenLabs
        </p>
      </div>

      {/* 2. SECTION AVIS CLIENTS (Le design défilant que tu as demandé) */}
      <div className="w-full">
        <Testimonials />
      </div>

    </main>
  );
}