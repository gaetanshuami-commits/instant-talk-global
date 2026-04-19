export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { cookies } from "next/headers";
import { Navbar } from "@/components/ui/Navbar";
import PricingCards from "./PricingCards";

export default async function PricingPage() {
  const currentPlan = (await cookies()).get("instanttalk_access")?.value ?? null;

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-24">
        <div className="mb-14 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-[#0a2540]">
            Tarifs simples & transparents
          </h1>
          <p className="mt-4 text-lg text-slate-500">
            3 jours d'essai gratuit — aucune carte débitée avant la fin de l'essai.
          </p>
        </div>

        <PricingCards currentPlan={currentPlan} />

        <div className="mt-16 text-center">
          <p className="text-slate-500">
            Besoin d'une solution Enterprise ?{" "}
            <Link href="/contact" className="font-semibold text-violet-600 hover:underline">
              Contactez-nous
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
