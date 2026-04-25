import LegalPageShell from "@/components/legal/LegalPageShell";

export default function FeaturesPage() {
  return (
    <LegalPageShell
      eyebrow="Fonctionnalites"
      title="Une plateforme complete pour les reunions internationales en temps reel."
      subtitle="Instant Talk reunit la traduction vocale, les sous-titres, l'invitation intelligente, les resumes IA et la planification dans une interface premium concue pour la communication globale."
      sections={[
        {
          title: "Traduction vocale instantanee",
          text: [
            "Chaque participant peut parler dans sa langue. La plateforme detecte, transcrit, traduit et restitue la voix en temps reel.",
            "L'objectif est une conversation plus naturelle, sans rupture, avec une latence reduite.",
          ],
        },
        {
          title: "Sous-titres synchronises",
          text: [
            "Les sous-titres traduits sont affiches en direct pour renforcer la comprehension et reduire toute ambiguite.",
            "Ils permettent une lecture immediate dans la langue cible du participant.",
          ],
        },
        {
          title: "Invitations et planification intelligentes",
          text: [
            "Les reunions peuvent etre programmees avec des invitations, des liens securises et des acces invites controlés.",
            "L'experience est concue pour rester simple du cote utilisateur et robuste du cote systeme.",
          ],
        },
        {
          title: "Resumes automatiques IA",
          text: [
            "Chaque reunion peut produire des syntheses structurees, des points cles et des actions a suivre.",
            "L'IA aide a transformer une conversation en resultat exploitable.",
          ],
        },
        {
          title: "Infrastructure premium",
          text: [
            "Instant Talk est pense pour un usage professionnel avec une attention particuliere a la fiabilite, a la securite et a l'experience utilisateur.",
            "Le produit vise une qualite enterprise-grade, pas une simple demo.",
          ],
        },
      ]}
    />
  );
}
