import LegalPageShell from "@/components/legal/LegalPageShell";

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="CGU"
      title="Conditions Generales d'Utilisation"
      subtitle="Les presentes conditions encadrent l'utilisation de la plateforme Instant Talk. Elles definissent les droits, responsabilites et limites applicables aux utilisateurs du service."
      sections={[
        {
          title: "Acceptation du service",
          text: [
            "En accedant a Instant Talk ou en utilisant ses fonctionnalites, vous acceptez les presentes conditions d'utilisation.",
            "Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser la plateforme.",
          ],
        },
        {
          title: "Utilisation autorisee",
          text: [
            "Instant Talk est destine a la communication professionnelle, a la collaboration, aux reunions, webinars, demonstrations et echanges internationaux.",
            "Vous vous engagez a utiliser le service dans le respect des lois applicables et des droits des autres utilisateurs.",
          ],
        },
        {
          title: "Utilisation interdite",
          text: [
            "Il est interdit de perturber le service, contourner les protections techniques, diffuser du contenu illicite, usurper une identite ou utiliser la plateforme a des fins malveillantes.",
            "Tout usage abusif ou dangereux peut entrainer une suspension ou une suppression du compte.",
          ],
        },
        {
          title: "Disponibilite et responsabilite",
          text: [
            "Instant Talk met tout en oeuvre pour assurer un haut niveau de disponibilite, mais ne garantit pas l'absence totale d'interruption ou d'erreur.",
            "La responsabilite de la plateforme est limitee dans les conditions prevues par la loi applicable.",
          ],
        },
      ]}
    />
  );
}
