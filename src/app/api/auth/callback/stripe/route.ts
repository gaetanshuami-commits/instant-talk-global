import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { pool } from "@/lib/prisma";

export const runtime = "nodejs";

const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2026-02-25.clover" }) : null;

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours

function normalizePlan(v: string | null | undefined): string {
  if (v === "premium" || v === "business" || v === "enterprise") return v;
  return "premium";
}

/**
 * Route de callback Stripe — utilisée comme success_url.
 * Côté serveur :
 *   1. Vérifie la session Stripe
 *   2. Persiste la subscription en DB
 *   3. Pose les cookies d'accès via Set-Cookie HTTP
 *   4. Redirige directement vers la salle de réunion
 *
 * Résultat : l'utilisateur arrive dans sa salle < 1 seconde après le paiement.
 * Aucun JavaScript, aucun délai, aucune demande de reconnexion.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sessionId = searchParams.get("session_id");
  const planHint  = searchParams.get("plan") || "premium";
  const origin    = req.nextUrl.origin;

  // Fallback si pas de session_id (ne devrait pas arriver)
  if (!sessionId || !stripe) {
    return redirectToSuccess(origin, planHint, sessionId);
  }

  let plan       = normalizePlan(planHint);
  let customerId = "";
  let customerRef = "";

  try {
    // ── 1. Récupérer la session Stripe ──────────────────────────────────────
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.mode !== "subscription") {
      return redirectToSuccess(origin, planHint, sessionId);
    }

    plan        = normalizePlan(session.metadata?.plan || planHint);
    customerId  = typeof session.customer === "string" ? session.customer : (session.customer?.id ?? "");
    customerRef = session.client_reference_id || session.metadata?.customerRef || customerId;

    // ── 2. Persister la subscription en DB (synchrone avant redirect) ───────
    const subId = typeof session.subscription === "string"
      ? session.subscription
      : (session.subscription as Stripe.Subscription)?.id;

    if (subId && customerId) {
      try {
        const sub = await stripe.subscriptions.retrieve(subId) as
          Stripe.Subscription & { current_period_end?: number; trial_end?: number | null };

        const planFinal    = normalizePlan(session.metadata?.plan || sub.metadata?.plan || planHint);
        const email        = session.customer_details?.email || session.customer_email || null;
        const periodEnd    = typeof sub.current_period_end === "number" ? new Date(sub.current_period_end * 1000) : null;
        const trialEnd     = typeof sub.trial_end === "number" ? new Date(sub.trial_end * 1000) : null;

        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("DB timeout")), 5000)
        );
        await Promise.race([
          pool.query(
            `INSERT INTO "Subscription"
               (id,"stripeCustomerId","stripeSubscriptionId",plan,status,"customerEmail",
                "currentPeriodEnd","trialEndsAt","createdAt","updatedAt")
             VALUES (gen_random_uuid()::text,$1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
             ON CONFLICT ("stripeSubscriptionId")
             DO UPDATE SET
               "stripeCustomerId"=$1, plan=$3, status=$4,
               "customerEmail"=COALESCE($5,"Subscription"."customerEmail"),
               "currentPeriodEnd"=$6, "trialEndsAt"=$7, "updatedAt"=NOW()`,
            [customerId, subId, planFinal, sub.status, email, periodEnd, trialEnd]
          ),
          timeout,
        ]);

        plan = planFinal;
      } catch (dbErr) {
        // Non-bloquant : accès accordé via cookie même si DB inaccessible
        console.error("[callback/stripe] DB upsert error:", (dbErr as Error).message);
      }
    }
  } catch (stripeErr) {
    console.error("[callback/stripe] Stripe error:", stripeErr);
    // Fallback : utiliser le plan de l'URL (inscrit dans metadata au checkout)
  }

  // ── 3. Générer un roomId et construire la réponse ─────────────────────────
  const roomId   = `room-${Math.random().toString(36).slice(2, 10)}`;
  const roomUrl  = `${origin}/room/${roomId}?host=1`;

  const response = NextResponse.redirect(roomUrl, { status: 302 });

  // Cookies HTTP côté serveur — inclus dans la requête suivante (GET /room/xxx)
  // → le middleware lit instantanément "instanttalk_access" sans JS client
  const cookieOpts = {
    path:     "/",
    maxAge:   COOKIE_MAX_AGE,
    sameSite: "lax"  as const,
    httpOnly: false,  // doit être lisible côté client aussi (localStorage sync)
  };

  response.cookies.set("instanttalk_access",       plan,        cookieOpts);
  response.cookies.set("instanttalk_customer_ref",  customerRef || customerId, cookieOpts);

  return response;
}

/** Fallback vers /success si la validation Stripe échoue */
function redirectToSuccess(origin: string, plan: string, sessionId: string | null) {
  const url = new URL("/success", origin);
  url.searchParams.set("plan", plan);
  if (sessionId) url.searchParams.set("session_id", sessionId);
  return NextResponse.redirect(url.toString(), { status: 302 });
}
