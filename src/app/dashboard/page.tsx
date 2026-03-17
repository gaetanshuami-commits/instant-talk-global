"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const [joinId, setJoinId] = useState("");

  const startMeeting = () => {
    const id = Math.random().toString(36).substring(2, 12);
    router.push(`/room/${id}`);
  };

  const joinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinId.trim()) {
      const cleanId = joinId.trim().replace(/[^a-zA-Z0-9-]/g, "");
      router.push(`/room/${cleanId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col hidden md:flex">
        <Link href="/" className="font-extrabold text-xl text-blue-600 mb-10 cursor-pointer">Instant Talk</Link>
        <nav className="flex-1 space-y-2 text-sm font-medium text-gray-600">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-lg cursor-pointer">Réunions</div>
          <Link href="/pricing" className="block p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition">Abonnement (Stripe)</Link>
          <div className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition">Paramètres</div>
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Bonjour, prêt à collaborer ?</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Nouvelle réunion</h2>
            <p className="text-gray-500 text-sm mb-8">Générez un lien sécurisé en un clic et invitez vos collaborateurs instantanément.</p>
            <button 
              onClick={startMeeting}
              className="w-full bg-blue-600 text-white font-semibold py-4 rounded-xl hover:bg-blue-700 transition"
            >
              + Démarrer une réunion
            </button>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Rejoindre une salle</h2>
            <p className="text-gray-500 text-sm mb-8">Saisissez le code ou le lien fourni par votre hôte.</p>
            <form onSubmit={joinMeeting} className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                placeholder="Code de la réunion (ex: abc-defg-hij)" 
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                className="flex-1 border border-gray-300 rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
              />
              <button disabled={!joinId} type="submit" className="bg-gray-900 text-white px-8 py-4 rounded-xl text-sm font-semibold disabled:opacity-50 transition">
                Rejoindre
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}