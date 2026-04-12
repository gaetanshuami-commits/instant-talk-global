"use client";

import { Film, Lock, Mail, Clock, Shield, Zap, Globe } from "lucide-react";

const CARD = {
  borderRadius: "22px",
  border: "1px solid rgba(255,255,255,0.07)",
  background: "linear-gradient(145deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.018) 100%)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 2px 4px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.45), 0 28px 56px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.07)",
};

const FEATURES = [
  { icon: Film,   label: "Enregistrement cloud automatique",  desc: "Chaque session est capturée et stockée en HD sur infrastructure dédiée." },
  { icon: Globe,  label: "Transcription multilingue",          desc: "Accédez aux sous-titres de chaque participant dans sa langue, exportables en PDF." },
  { icon: Shield, label: "Stockage chiffré AES-256",           desc: "Vos données restent souveraines — conformité RGPD et NIS2 garantie." },
  { icon: Zap,    label: "Disponible sous 60 secondes",        desc: "Le replay est accessible dès la fin de la réunion, sans délai de traitement." },
  { icon: Clock,  label: "Rétention configurable",             desc: "De 30 jours à illimité selon votre contrat Enterprise." },
  { icon: Lock,   label: "Accès granulaire par rôle",          desc: "Gérez qui peut visionner, télécharger ou partager chaque enregistrement." },
];

export default function RecordingsPage() {
  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <div style={{ fontSize: "12px", letterSpacing: "0.16em", opacity: 0.5, marginBottom: "7px", fontWeight: 600 }}>CLOUD · RECORDINGS</div>
          <h1 style={{ fontSize: "36px", fontWeight: 900, letterSpacing: "-0.04em", margin: 0 }}>Enregistrements cloud</h1>
          <div style={{ marginTop: "8px", opacity: 0.55, fontSize: "14px" }}>Capture, stockage et replay de vos sessions multilingues</div>
        </div>
        <div style={{ height: "40px", padding: "0 16px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: "7px", fontSize: "13px", opacity: 0.7 }}>
          <Film size={14} />
          Stockage cloud premium
        </div>
      </div>

      {/* Enterprise gate */}
      <div style={{ ...CARD, padding: "0", overflow: "hidden" }}>
        {/* Hero banner */}
        <div style={{
          padding: "48px 40px",
          background: "linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(124,58,237,0.12) 50%, rgba(6,182,212,0.08) 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          textAlign: "center",
        }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "20px",
            background: "linear-gradient(135deg, #6366f1, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: "0 16px 48px rgba(99,102,241,0.35)",
          }}>
            <Film size={32} color="white" />
          </div>
          <div style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "10px" }}>
            Fonctionnalité Enterprise
          </div>
          <div style={{ fontSize: "15px", opacity: 0.65, maxWidth: "480px", margin: "0 auto", lineHeight: 1.7 }}>
            Les enregistrements cloud sont inclus dans le plan{" "}
            <strong style={{ color: "#a5b4fc" }}>Enterprise</strong>.
            Contactez-nous pour activer cette fonctionnalité sur votre compte.
          </div>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "28px", flexWrap: "wrap" }}>
            <a
              href="mailto:contact@instant-talk.com?subject=Activation%20Enregistrements%20Cloud&body=Bonjour%2C%20je%20souhaite%20activer%20les%20enregistrements%20cloud%20sur%20mon%20compte."
              style={{ textDecoration: "none" }}
            >
              <div style={{
                height: "46px", padding: "0 24px", borderRadius: "999px",
                background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                color: "white", fontWeight: 800, fontSize: "14px",
                display: "flex", alignItems: "center", gap: "8px",
                boxShadow: "0 8px 28px rgba(99,102,241,0.4)",
                cursor: "pointer",
              }}>
                <Mail size={15} />
                Contacter l&apos;équipe commerciale
              </div>
            </a>
            <a href="/pricing" style={{ textDecoration: "none" }}>
              <div style={{
                height: "46px", padding: "0 24px", borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
                color: "white", fontWeight: 700, fontSize: "14px",
                display: "flex", alignItems: "center", gap: "8px",
                cursor: "pointer",
              }}>
                Voir les offres
              </div>
            </a>
          </div>
        </div>

        {/* Feature grid */}
        <div style={{ padding: "32px 40px" }}>
          <div style={{ fontSize: "13px", opacity: 0.5, fontWeight: 700, letterSpacing: "0.1em", marginBottom: "20px" }}>
            CE QUI EST INCLUS
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {FEATURES.map((f) => (
              <div
                key={f.label}
                style={{
                  padding: "18px 20px",
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start",
                }}
              >
                <div style={{
                  width: "36px", height: "36px", borderRadius: "10px",
                  background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <f.icon size={16} color="#818cf8" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "13.5px", marginBottom: "4px" }}>{f.label}</div>
                  <div style={{ fontSize: "12px", opacity: 0.5, lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
