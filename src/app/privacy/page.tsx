import LegalPageShell from "@/components/legal/LegalPageShell";

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Confidentialite"
      title="Politique de confidentialite"
      subtitle="La protection des donnees est une composante essentielle de l'experience Instant Talk. Cette page explique quelles informations peuvent etre traitees, pourquoi elles le sont et comment elles sont protegees."
      sections={[
        {
          title: "Donnees traitees",
          text: [
            "Instant Talk peut traiter des donnees de compte, des donnees de reunion, des informations de session, ainsi que certaines donnees techniques necessaires au fonctionnement du service.",
            "Selon les fonctionnalites utilisees, des flux audio ou texte peuvent etre traites temporairement pour la transcription, la traduction ou la synthese vocale.",
          ],
        },
        {
          title: "Fournisseurs techniques",
          text: [
            "La plateforme peut s'appuyer sur des partenaires techniques pour la transcription, la traduction, la synthese vocale, l'email systeme, la facturation et le transport temps reel.",
            "Ces integrations sont utilisees uniquement dans le cadre du service et selon les besoins techniques legitimes de la plateforme.",
          ],
        },
        {
          title: "Conservation et securite",
          text: [
            "Les donnees sont conservees uniquement pendant la duree necessaire au fonctionnement, a la securite, aux obligations legales ou a l'amelioration du service.",
            "Instant Talk applique une approche de securite orientee produit premium et protection des acces.",
          ],
        },
        {
          title: "Droits des utilisateurs",
          text: [
            "Les utilisateurs peuvent demander l'acces, la correction ou la suppression de certaines donnees, selon la nature des informations et le cadre legal applicable.",
            "Pour toute demande liee a la vie privee, l'utilisateur peut contacter l'equipe via les canaux officiels de la plateforme.",
          ],
        },
      ]}
    />
  );
}
