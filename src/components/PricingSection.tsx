"use client";
import React from 'react';

const plans = [
  {
    name: "B2C Premium", price: "24", trial: "3 jours gratuits",
    description: "Communication multilingue pour particuliers.",
    features: ["Utilisation illimitée", "Jusqu'à 5 participants", "10 langues disponibles"],
    plan: "premium",
  },
  {
    name: "Business", price: "99", trial: "3 jours gratuits",
    description: "Solution idéale pour les équipes.",
    features: ["Jusqu'à 25 utilisateurs", "50 participants par réunion", "20 langues disponibles"],
    plan: "business",
  },
];

export default function PricingSection() {
  const handleSubscription = async (plan: string) => {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erreur Stripe : " + (data.error || "Clé secrète manquante !"));
      }
    } catch (error) {
      alert("Erreur réseau.");
    }
  };

  return (
    <section className="py-20 bg-gray-50 text-black">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Tarifs Instant Talk Global</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {plans.map((plan) => (
            <div key={plan.name} className="border p-8 rounded-2xl bg-white shadow-sm">
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <p className="text-blue-600 text-sm mb-4">{plan.trial}</p>
              <div className="text-4xl font-bold mb-6">{plan.price}€<span className="text-lg text-gray-400">/mois</span></div>
              <ul className="mb-8 space-y-3">
                {plan.features.map(f => <li key={f} className="text-sm">✓ {f}</li>)}
              </ul>
              <button 
                onClick={() => handleSubscription(plan.plan)}
                className="w-full py-3 px-6 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700"
              >
                Essayer gratuitement
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}