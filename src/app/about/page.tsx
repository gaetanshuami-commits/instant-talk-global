import LegalPageShell from "@/components/legal/LegalPageShell";

export default function AboutPage() {
  return (
    <LegalPageShell
      eyebrow="A propos"
      title="Instant Talk construit une nouvelle infrastructure de communication mondiale."
      subtitle="Instant Talk est une plateforme de visioconference multilingue concue pour rendre les echanges internationaux plus fluides, plus naturels et plus intelligents. La traduction n'est pas un module ajoute apres coup : elle fait partie du coeur du produit."
      sections={[
        {
          title: "Notre mission",
          text: [
            "Nous voulons permettre a chaque personne de parler dans sa propre langue tout en etant comprise immediatement par les autres participants.",
            "La langue ne doit plus ralentir une reunion, limiter une collaboration ou bloquer une opportunite internationale.",
          ],
        },
        {
          title: "Ce qui nous differencie",
          text: [
            "Contrairement aux plateformes traditionnelles, Instant Talk integre la traduction vocale instantanee, les sous-titres synchronises, la planification de reunions et les resumes IA dans une seule experience coherente.",
            "Le produit est pense pour l'international, pas adapte apres coup a l'international.",
          ],
        },
        {
          title: "Vision produit",
          text: [
            "Nous croyons qu'une conversation multilingue doit rester humaine, directe et naturelle.",
            "Instant Talk vise un standard premium pour les entreprises, les equipes distribuees, les webinars et les rendez-vous a forte valeur.",
          ],
        },
      ]}
    />
  );
}
