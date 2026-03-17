import Link from "next/link";
import { LanguageSelector } from "@/components/ui/LanguageSelector";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <Link href="/" className="text-xl font-extrabold text-blue-600">Instant Talk</Link>
          <LanguageSelector />
        </div>
      </nav>

      <div className="py-24 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">Tarification claire. Sans surprise.</h1>
          <p className="text-xl text-gray-500 mb-20 max-w-2xl mx-auto">Commencez avec 3 jours d'essai gratuit sur nos plans Premium et Business.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left items-stretch">
            
            {/* B2C Premium */}
            <div className="bg-white rounded-3xl p-10 border border-gray-200 shadow-sm hover:shadow-xl transition duration-300 flex flex-col">
              <h3 className="text-2xl font-bold text-gray-900">B2C Premium</h3>
              <p className="mt-3 text-sm text-gray-500 h-10">Pour les indépendants et freelances internationaux.</p>
              <div className="mt-6 flex items-baseline text-6xl font-extrabold text-gray-900">
                24€<span className="ml-2 text-xl font-medium text-gray-500">/mois</span>
              </div>
              <ul className="mt-10 space-y-5 flex-1">
                <li className="flex items-center text-sm font-semibold text-gray-700"><span className="text-blue-500 mr-3">✓</span> Communication multilingue</li>
                <li className="flex items-center text-sm font-semibold text-gray-700"><span className="text-blue-500 mr-3">✓</span> Jusqu'à 5 participants</li>
                <li className="flex items-center text-sm font-semibold text-gray-700"><span className="text-blue-500 mr-3">✓</span> Sous-titres HD</li>
              </ul>
              {/* LIEN STRIPE B2C ICI */}
              <a href="https://buy.stripe.com/test_votre_lien_b2c" target="_blank" className="mt-10 block w-full bg-blue-50 text-blue-700 font-bold py-4 rounded-xl hover:bg-blue-100 transition text-center">
                Essai gratuit de 3 jours
              </a>
            </div>

            {/* Business */}
            <div className="bg-gray-900 rounded-3xl p-10 border border-gray-900 shadow-2xl flex flex-col relative transform md:-translate-y-4">
              <div className="absolute -top-4 inset-x-0 flex justify-center">
                <span className="bg-blue-600 text-white text-sm font-extrabold px-6 py-2 rounded-full tracking-widest shadow-lg">RECOMMANDÉ</span>
              </div>
              <h3 className="text-2xl font-bold text-white mt-4">Business</h3>
              <p className="mt-3 text-sm text-gray-400 h-10">Pour les équipes et PME nécessitant des outils avancés.</p>
              <div className="mt-6 flex items-baseline text-6xl font-extrabold text-white">
                99€<span className="ml-2 text-xl font-medium text-gray-400">/mois</span>
              </div>
              <ul className="mt-10 space-y-5 flex-1">
                <li className="flex items-center text-sm font-semibold text-gray-200"><span className="text-blue-400 mr-3">✓</span> 99€ par équipe</li>
                <li className="flex items-center text-sm font-semibold text-gray-200"><span className="text-blue-400 mr-3">✓</span> 50 participants / 25 utilisateurs</li>
                <li className="flex items-center text-sm font-semibold text-gray-200"><span className="text-blue-400 mr-3">✓</span> Gestion centralisée</li>
              </ul>
              {/* LIEN STRIPE BUSINESS ICI */}
              <a href="https://buy.stripe.com/test_votre_lien_business" target="_blank" className="mt-10 block w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-500 transition text-center shadow-lg shadow-blue-500/30">
                Essai gratuit de 3 jours
              </a>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-3xl p-10 border border-gray-200 shadow-sm hover:shadow-xl transition duration-300 flex flex-col">
              <h3 className="text-2xl font-bold text-gray-900">Enterprise / Institutions</h3>
              <p className="mt-3 text-sm text-gray-500 h-10">Contrats personnalisés B2G et grands comptes.</p>
              <div className="mt-6 flex items-baseline text-4xl font-extrabold text-gray-900">
                Sur-mesure
              </div>
              <ul className="mt-10 space-y-5 flex-1">
                <li className="flex items-center text-sm font-semibold text-gray-700"><span className="text-gray-900 mr-3">✓</span> Langues illimitées</li>
                <li className="flex items-center text-sm font-semibold text-gray-700"><span className="text-gray-900 mr-3">✓</span> SLA Dédié & Cloud Privé</li>
                <li className="flex items-center text-sm font-semibold text-gray-700"><span className="text-gray-900 mr-3">✓</span> Formation & Support 24/7</li>
              </ul>
              <a href="mailto:contact@instant-talk.com" className="mt-10 block w-full bg-gray-50 border border-gray-200 text-gray-900 font-bold py-4 rounded-xl hover:bg-gray-100 transition text-center">
                Contacter les ventes
              </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}