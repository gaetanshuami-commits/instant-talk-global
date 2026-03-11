import React from 'react';

const plans = [
  {
    name: "B2C Premium",
    price: "24",
    trial: "3 jours gratuits",
    description: "Communication multilingue pour particuliers.",
    features: [
      "Utilisation illimitée",
      "Jusqu'à 5 participants",
      "10 langues disponibles",
      "Sous-titres & Transcription"
    ],
    priceId: "price_1T9oWtEwh4sBnj54ncKbHx17" 
  },
  {
    name: "Business",
    price: "99",
    trial: "3 jours gratuits",
    description: "Solution idéale pour les équipes.",
    features: [
      "Jusqu'à 25 utilisateurs",
      "50 participants par réunion",
      "20 langues disponibles",
      "Support prioritaire",
      "Gestion centralisée"
    ],
    priceId: "price_1T9oXtEwh4sBnj54YgPSDbeU"
  },
  {
    name: "Enterprise",
    price: "Custom",
    trial: "Sur mesure",
    description: "Pour les institutions stratégiques (B2G).",
    features: [
      "Langues illimitées",
      "SLA personnalisé",
      "Déploiement privé (On-premise)",
      "Formation et support dédiés"
    ],
    priceId: null
  }
];

export default function PricingSection() {
  const handleSubscription = async (priceId: string) => {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  return (
    <section className="py-20 bg-gray-50 text-black">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-4">Tarifs Instant Talk Global</h2>
        <p className="text-center text-gray-600 mb-12 italic">Commencez avec 3 jours d'essai gratuit sur tous nos plans standards.</p>
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.name} className="border p-8 rounded-2xl bg-white shadow-sm border-gray-200">
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <p className="text-blue-600 font-medium text-sm mb-4 uppercase tracking-wide">{plan.trial}</p>
              <div className="text-4xl font-bold mb-6">
                {plan.price !== "Custom" ? plan.price + "€" : "Sur mesure"}
                {plan.price !== "Custom" && <span className="text-lg text-gray-400 font-normal">/mois</span>}
              </div>
              <ul className="mb-8 space-y-3 min-h-[180px]">
                {plan.features.map(f => (
                  <li key={f} className="text-sm text-gray-600 flex items-start">
                    <span className="mr-2 text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => plan.priceId && handleSubscription(plan.priceId)}
                className="w-full py-3 px-6 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
              >
                {plan.price === "Custom" ? "Contacter les ventes" : "Essayer gratuitement"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}