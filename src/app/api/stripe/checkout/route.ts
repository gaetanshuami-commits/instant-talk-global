import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_fausse_cle_pour_le_build_uniquement';

// LA CORRECTION EST ICI : On utilise la version exacte exigée par TypeScript
const stripe = new Stripe(stripeKey, {
  apiVersion: '2026-02-25.clover',
});

export async function POST(req: Request) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Abonnement Instant Talk Global',
              description: 'Accès premium à la traduction vocale IA en temps réel',
            },
            unit_amount: 999,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://instant-talk-global.vercel.app/success',
      cancel_url: 'https://instant-talk-global.vercel.app/',
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Erreur Stripe:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
