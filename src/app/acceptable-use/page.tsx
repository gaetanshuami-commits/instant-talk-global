import LegalPageShell from "@/components/legal/LegalPageShell";

export default function AcceptableUsePage() {
  return (
    <LegalPageShell
      eyebrow="Utilisation acceptable"
      title="Règles d'utilisation acceptables"
      subtitle="Instant Talk est concu pour un usage professionnel, responsable et respectueux. Cette page precise les comportements attendus et les usages interdits sur la plateforme."
      sections={[
        {
          title: "Usages autorises",
          text: [
            "La plateforme peut etre utilisee pour des reunions, webinars, presentations, rendez-vous, echanges client, coordination internationale et collaboration d'equipe.",
            "L'utilisateur s'engage a utiliser le service dans le respect des autres participants et du cadre legal applicable.",
          ],
        },
        {
          title: "Usages interdits",
          text: [
            "Il est interdit de diffuser des contenus illegaux, haineux, violents, frauduleux, malveillants ou portant atteinte aux droits d'autrui.",
            "Il est egalement interdit de tenter de compromettre la securite, les performances ou l'integrite de la plateforme.",
          ],
        },
        {
          title: "Respect de l'ecosysteme",
          text: [
            "Les utilisateurs doivent respecter la confidentialite, les acces et les limites d'usage raisonnables de la plateforme.",
            "Instant Talk peut suspendre un acces en cas de risque, d'abus ou de non-respect des regles d'utilisation.",
          ],
        },
      ]}
    />
  );
}
