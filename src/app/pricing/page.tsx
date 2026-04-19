export const dynamic = "force-dynamic";
export const revalidate = 0;

import { cookies } from "next/headers";
import { Navbar } from "@/components/ui/Navbar";
import PricingCards from "./PricingCards";
import { pool } from "@/lib/prisma";

export default async function PricingPage() {
  const cookieStore = await cookies();
  let currentPlan = cookieStore.get("instanttalk_access")?.value ?? null;
  let currentStatus: string | null = null;

  const customerRef = cookieStore.get("instanttalk_customer_ref")?.value;
  if (customerRef) {
    try {
      const { rows } = await pool.query<{ plan: string; status: string }>(
        `SELECT plan, status FROM "Subscription"
         WHERE "stripeCustomerId" = $1 AND status IN ('active','trialing')
         ORDER BY "createdAt" DESC LIMIT 1`,
        [customerRef]
      );
      if (rows[0]) {
        currentPlan = rows[0].plan;
        currentStatus = rows[0].status;
      }
    } catch {
      // DB unavailable — keep cookie-based plan
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-24">

        {/* ── Header ── */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#635bff] shadow-sm">
            Tarifs transparents
          </div>
          <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-[#0A2540] md:text-6xl">
            Choisissez votre plan.<br />
            Brisez les frontières linguistiques.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl leading-8 text-[#425466]">
            Commencez avec 3 jours d&apos;essai gratuit.<br />
            Aucune carte bancaire requise.
          </p>
        </div>

        <PricingCards currentPlan={currentPlan} currentStatus={currentStatus} />

      </main>
    </div>
  );
}
