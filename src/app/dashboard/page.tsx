"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const [joinId, setJoinId] = useState("");

  const startMeeting = () => {
    const id = Math.random().toString(36).substring(2, 12);
    router.push(`/room/${id}?host=1`);
  };

  const joinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinId.trim()) return;
    const cleanId = joinId.trim().replace(/[^a-zA-Z0-9-]/g, "");
    router.push(`/room/${cleanId}`);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] flex">
      <aside className="w-72 bg-white border-r border-gray-200 p-6 hidden md:flex flex-col">
        <Link href="/" className="text-2xl font-extrabold text-blue-600 mb-10">
          Instant Talk
        </Link>

        <nav className="space-y-3 text-sm font-medium text-gray-700">
          <Link href="/dashboard" className="block rounded-xl bg-blue-50 text-blue-700 px-4 py-3">
            Tableau de bord
          </Link>
          <Link href="/dashboard/meetings" className="block rounded-xl px-4 py-3 hover:bg-gray-100">
            Calendrier & réunions
          </Link>
        </nav>

        <div className="mt-auto rounded-2xl bg-gray-900 text-white p-5">
          <div className="text-xs uppercase tracking-[0.2em] opacity-60 mb-2">Workspace</div>
          <div className="text-xl font-bold mb-2">Organiser une conférence</div>
          <div className="text-sm opacity-80">
            Programme une réunion, génère un lien et invite des participants.
          </div>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-black text-gray-900 mb-3">Réunions & conférences</h1>
          <p className="text-gray-500 mb-10 text-base">
            Démarrer maintenant, programmer une réunion, ouvrir le calendrier ou rejoindre une salle.
          </p>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
              <div className="text-2xl font-bold text-gray-900 mb-2">Réunion instantanée</div>
              <div className="text-sm text-gray-500 mb-8">
                Lance immédiatement un appel vidéo.
              </div>
              <button
                onClick={startMeeting}
                className="w-full h-14 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
              >
                Démarrer maintenant
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
              <div className="text-2xl font-bold text-gray-900 mb-2">Programmer une réunion</div>
              <div className="text-sm text-gray-500 mb-8">
                Crée un rendez-vous, ouvre le calendrier et partage le lien.
              </div>

              <div className="flex flex-col gap-4">
                <Link
                  href="/dashboard/meetings"
                  className="w-full h-14 rounded-2xl bg-gray-900 text-white font-bold flex items-center justify-center hover:bg-black transition"
                >
                  Programmer une réunion
                </Link>

                <Link
                  href="/dashboard/meetings"
                  className="w-full h-14 rounded-2xl border border-gray-300 text-gray-900 font-bold flex items-center justify-center hover:bg-gray-50 transition"
                >
                  Ouvrir le calendrier
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
              <div className="text-2xl font-bold text-gray-900 mb-2">Rejoindre une salle</div>
              <div className="text-sm text-gray-500 mb-8">
                Entre un code ou un identifiant de réunion.
              </div>

              <form onSubmit={joinMeeting} className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Code de la réunion"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                  className="h-14 rounded-2xl border border-gray-300 px-4 text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!joinId.trim()}
                  className="h-14 rounded-2xl bg-gray-900 text-white font-bold disabled:opacity-50"
                >
                  Rejoindre
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
