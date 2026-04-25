import LegalPageShell from "@/components/legal/LegalPageShell";

export default function CookiesPage() {
  return (
    <LegalPageShell
      eyebrow="Cookies"
      title="Politique relative aux cookies"
      subtitle="Instant Talk peut utiliser des cookies ou technologies similaires pour assurer la securite, maintenir la session, ameliorer l'experience et comprendre l'usage de la plateforme."
      sections={[
        {
          title: "Cookies necessaires",
          text: [
            "Certains cookies sont indispensables au fonctionnement de la plateforme, notamment pour la session utilisateur, la securite, l'authentification et certaines preferences essentielles.",
            "Sans ces cookies, certaines fonctionnalites peuvent ne pas fonctionner correctement.",
          ],
        },
        {
          title: "Mesure et amelioration",
          text: [
            "Des outils de mesure peuvent etre utilises pour analyser les performances, comprendre l'usage produit et ameliorer la qualite generale du service.",
            "Ces traitements sont limites a des objectifs legitimes lies a l'exploitation de la plateforme.",
          ],
        },
        {
          title: "Gestion des preferences",
          text: [
            "Les utilisateurs peuvent gerer certaines preferences via leur navigateur ou leurs reglages systeme.",
            "La desactivation de certains cookies peut affecter l'experience ou la disponibilite de certaines fonctions.",
          ],
        },
      ]}
    />
  );
}
