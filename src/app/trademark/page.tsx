import LegalPageShell from "@/components/legal/LegalPageShell";

export default function TrademarkPage() {
  return (
    <LegalPageShell
      eyebrow="Marque"
      title="Protection de la marque Instant Talk"
      subtitle="Le nom Instant Talk, son identite visuelle, ses elements graphiques, son positionnement produit et ses contenus associes sont proteges et ne peuvent etre reutilises sans autorisation."
      sections={[
        {
          title: "Nom et identite",
          text: [
            "Le nom Instant Talk constitue un element distinctif de la plateforme et ne peut etre utilise d'une maniere susceptible de creer une confusion ou une association non autorisee.",
            "Toute reutilisation du nom, du logo ou des visuels doit faire l'objet d'une autorisation prealable ecrite.",
          ],
        },
        {
          title: "Contenus proteges",
          text: [
            "Les interfaces, contenus, textes, structures, compositions visuelles et elements de marque sont proteges par les droits applicables en matiere de propriete intellectuelle.",
            "Aucune reproduction, extraction ou reutilisation non autorisee n'est permise.",
          ],
        },
        {
          title: "Usage public et commercial",
          text: [
            "Toute reference publique ou commerciale a Instant Talk doit respecter l'identite de marque et ne pas suggerer une approbation, un partenariat ou une filiation inexistante.",
            "En cas de doute, un accord ecrit doit etre obtenu avant diffusion.",
          ],
        },
      ]}
    />
  );
}
