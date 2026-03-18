"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { useSearchParams } from "next/navigation";
import { setClientAccess } from "@/lib/access";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "premium";

  useEffect(() => {
    const maxAge = 60 * 60 * 24 * 30;
    document.cookie = `instanttalk_access=${plan}; path=/; max-age=${maxAge}; SameSite=Lax`;
    setClientAccess(plan);
  }, [plan]);

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <Navbar />

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-20">
        <div className="rounded-[32px] border border-slate-200 bg-white p-10 shadow-[0_25px_60px_-30px_rgba(10,37,64,0.22)]">
          <h1 className="text-5xl font-extrabold tracking-tight text-[#0A2540]">
            Paiement confirmé
          </h1>

          <p className="mt-5 text-lg leading-8 text-[#425466]">
            Votre accès a été activé. Vous pouvez maintenant entrer dans votre espace et préparer vos réunions.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/room/demo-access"
              className="inline-flex items-center justify-center rounded-full bg-[#0A2540] px-7 py-4 text-base font-semibold text-white transition hover:bg-[#16324f]"
            >
              Ouvrir une salle
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-7 py-4 text-base font-semibold text-[#0A2540] transition hover:bg-slate-50"
            >
              Retour à l’accueil
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}