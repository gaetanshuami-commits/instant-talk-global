import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Bouclier anti-crash pour le déploiement
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_fausse_cle_pour_le_build_uniquement';

const stripe = new Stripe(stripeKey, {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  return NextResponse.json({ message: "Module de paiement sécurisé" });
}
