"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { TestimonialMarquee } from "@/components/ui/TestimonialMarquee";

export default function LandingPage() {
  const router = useRouter();

  const startMeeting = () => {
    const roomId = Math.random().toString(36).substring(2, 12);
    router.push(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="text-2xl font-extrabold tracking-tighter text-blue-600">Instant Talk</div>
          <div className="hidden md:flex space-x-8 font-semibold text-sm text-gray-600">
            <Link href="#problem" className="hover:text-gray-900 transition">La Solution</Link>
            <Link href="#segments" className="hover:text-gray-900 transition">Secteurs</Link>
            <Link href="/pricing" className="hover:text-gray-900 transition">Tarifs</Link>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSelector />
            <Link href="/dashboard" className="hidden md:flex text-sm font-semibold text-gray-700 hover:text-gray-900 px-2">Connexion</Link>
            <button onClick={startMeeting} className="px-5 py-2.5 text-sm font-bold text-white bg-gray-900 hover:bg-gray-800 rounded-lg shadow-sm transition">
              Créer une réunion
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 pt-28 pb-20 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold mb-8 border border-blue-100">
          <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></span>
          <span>SaaS Visioconférence Next-Gen</span>
        </div>
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-8 text-gray-900 leading-[1.05]">
          Communication vidéo.<br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Sans barrière linguistique.</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-500 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
          La plateforme de visioconférence intelligente conçue pour permettre aux équipes internationales de communiquer naturellement, chacun dans sa langue.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={startMeeting} className="w-full sm:w-auto px-8 py-4 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all">
            Créer une réunion
          </button>
          <Link href="/pricing" className="w-full sm:w-auto px-8 py-4 text-lg font-bold text-gray-700 bg-white border border-gray-200 hover:border-gray-300 rounded-xl shadow-sm transition-all">
            Découvrir la plateforme
          </Link>
        </div>
      </section>

      {/* Social Proof & Metrics */}
      <section className="border-y border-gray-100 bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-gray-200">
          <div><div className="text-3xl font-extrabold text-gray-900">70 Md€</div><div className="text-sm font-semibold text-gray-500 mt-1">Marché Global Visio</div></div>
          <div><div className="text-3xl font-extrabold text-gray-900">5.5 Mds</div><div className="text-sm font-semibold text-gray-500 mt-1">Non-anglophones</div></div>
          <div><div className="text-3xl font-extrabold text-gray-900">1080p</div><div className="text-sm font-semibold text-gray-500 mt-1">Qualité Vidéo HD</div></div>
          <div><div className="text-3xl font-extrabold text-gray-900">100%</div><div className="text-sm font-semibold text-gray-500 mt-1">Sécurisé & Chiffré</div></div>
        </div>
      </section>

      {/* Problème & Solution */}
      <section id="problem" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-6">La barrière linguistique coûte cher.</h2>
          <p className="text-xl text-gray-500 max-w-3xl mx-auto">
            Les réunions internationales explosent, mais la productivité chute. Les malentendus coûtent des millions aux entreprises chaque année. Instant Talk résout ce problème à la racine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-50 p-10 rounded-3xl border border-gray-100">
            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl mb-6 border border-gray-200">📹</div>
            <h3 className="text-xl font-bold mb-4">Visioconférence Haute Définition</h3>
            <p className="text-gray-500">Infrastructures cloud optimisées pour une latence ultra-faible. Partage d'écran 4K et collaboration fluide.</p>
          </div>
          <div className="bg-gray-50 p-10 rounded-3xl border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-bl-xl">INCOMING (V2)</div>
            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl mb-6 border border-gray-200">🎙️</div>
            <h3 className="text-xl font-bold mb-4">Traduction Vocale Native</h3>
            <p className="text-gray-500">Parlez dans votre langue maternelle. Vos collaborateurs vous entendent instantanément dans la leur.</p>
          </div>
          <div className="bg-gray-50 p-10 rounded-3xl border border-gray-100">
            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl mb-6 border border-gray-200">🔒</div>
            <h3 className="text-xl font-bold mb-4">Sécurité Entreprise</h3>
            <p className="text-gray-500">Chiffrement de bout en bout, conformité stricte et contrôle granulaire des accès pour protéger vos données.</p>
          </div>
        </div>
      </section>

      {/* Segments BP */}
      <section id="segments" className="bg-gray-900 text-white py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-extrabold mb-16 text-center">Une infrastructure adaptée à votre échelle.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border border-gray-800 bg-gray-800/50 p-10 rounded-3xl hover:border-gray-600 transition">
              <h3 className="text-2xl font-bold mb-4">B2B : Entreprises</h3>
              <p className="text-gray-400 mb-8">Boostez la productivité de vos équipes distribuées. Gestion centralisée et support prioritaire.</p>
              <Link href="/pricing" className="text-blue-400 font-semibold hover:text-blue-300">Voir l'offre Business →</Link>
            </div>
            <div className="border border-gray-800 bg-gray-800/50 p-10 rounded-3xl hover:border-gray-600 transition">
              <h3 className="text-2xl font-bold mb-4">B2G : Institutions</h3>
              <p className="text-gray-400 mb-8">Déploiement cloud privé, souveraineté des données et SLA dédié pour les marchés publics.</p>
              <Link href="/pricing" className="text-blue-400 font-semibold hover:text-blue-300">Contact sur-mesure →</Link>
            </div>
            <div className="border border-gray-800 bg-gray-800/50 p-10 rounded-3xl hover:border-gray-600 transition">
              <h3 className="text-2xl font-bold mb-4">B2C : Utilisateurs</h3>
              <p className="text-gray-400 mb-8">L'outil indispensable pour les indépendants et freelances travaillant à l'international.</p>
              <Link href="/pricing" className="text-blue-400 font-semibold hover:text-blue-300">Voir l'offre Premium →</Link>
            </div>
          </div>
        </div>
      </section>

      <TestimonialMarquee />

      {/* CTA Final */}
      <section className="py-32 px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-8">Prêt à briser les barrières ?</h2>
        <button onClick={startMeeting} className="px-10 py-5 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-2xl transition-all">
          Démarrer une réunion gratuite
        </button>
      </section>
    </div>
  );
}