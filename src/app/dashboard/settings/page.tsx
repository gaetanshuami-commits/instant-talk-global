"use client";

import { useState, useEffect } from "react";
import { Shield, Bell, Globe, Video, Mic, User, Lock, Check, Zap, Cpu, Volume2, Monitor, Loader2 } from "lucide-react";
import Link from "next/link";

const CARD = {
  borderRadius: "22px",
  border: "1px solid rgba(255,255,255,0.07)",
  background: "linear-gradient(145deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.018) 100%)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 2px 4px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.45), 0 28px 56px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.07)",
};

type Settings = Record<string, boolean | string | number>;

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 999, background: value ? "linear-gradient(135deg, #6366f1, #7c3aed)" : "rgba(255,255,255,0.12)", border: value ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.1)", cursor: "pointer", position: "relative", transition: "all 0.2s", flexShrink: 0, boxShadow: value ? "0 4px 12px rgba(99,102,241,0.4)" : "none" }}>
      <div style={{ position: "absolute", top: 3, left: value ? 22 : 3, width: 16, height: 16, borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => setSettings(d.settings ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (key: string, val: boolean) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    await save(next);
  };

  const save = async (data: Settings) => {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const get = (key: string, def: boolean) => (settings[key] as boolean) ?? def;

  const sections = [
    {
      icon: User, label: "Profil", color: "#6366f1",
      items: [
        { key: "profilePublic",    label: "Profil visible par les contacts",          def: true  },
        { key: "showOnlineStatus", label: "Afficher mon statut en ligne",              def: true  },
        { key: "showActivity",     label: "Partager mon activite recente",             def: false },
      ],
    },
    {
      icon: Bell, label: "Notifications", color: "#06b6d4",
      items: [
        { key: "notifMeeting",   label: "Rappels de reunions (15 min avant)",   def: true  },
        { key: "notifMessage",   label: "Nouveaux messages de chat",            def: true  },
        { key: "notifWebinar",   label: "Rappels de webinaires",                def: true  },
        { key: "notifEmail",     label: "Notifications par email",              def: false },
      ],
    },
    {
      icon: Video, label: "Video", color: "#a855f7",
      items: [
        { key: "hd1080",         label: "Resolution maximale 1080p",           def: true  },
        { key: "mirrorCamera",   label: "Miroir camera locale",                 def: true  },
        { key: "noiseSuppression",label: "Suppression de bruit IA",            def: true  },
        { key: "autoGain",       label: "Gain automatique du micro",            def: true  },
      ],
    },
    {
      icon: Globe, label: "Traduction", color: "#10b981",
      items: [
        { key: "autoTranslate",  label: "Demarrage automatique a l'entree",    def: false },
        { key: "subtitlesOn",    label: "Afficher les sous-titres par defaut",  def: true  },
        { key: "ttsVoice",       label: "Voix de synthese naturelle",          def: true  },
        { key: "translationLog", label: "Sauvegarder les transcriptions",       def: false },
      ],
    },
    {
      icon: Shield, label: "Securite et confidentialite", color: "#f59e0b",
      items: [
        { key: "e2eEncryption",  label: "Chiffrement bout en bout (E2E)",       def: true  },
        { key: "waitingRoom",    label: "Salle d'attente pour les reunions",    def: false },
        { key: "requireAuth",    label: "Authentification requise pour rejoindre",def: false},
        { key: "recordConsent",  label: "Demander consentement avant enregistrement",def: true},
      ],
    },
    {
      icon: Cpu, label: "Performance", color: "#ec4899",
      items: [
        { key: "hardwareAccel",  label: "Acceleration materielle GPU (H264)",  def: true  },
        { key: "cloudProxy",     label: "Proxy cloud TCP/443 (reseaux restrictifs)",def: true},
        { key: "adaptiveBitrate",label: "Debit adaptatif automatique",         def: true  },
      ],
    },
  ];

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <div style={{ fontSize: "12px", letterSpacing: "0.16em", opacity: 0.5, marginBottom: "7px", fontWeight: 600 }}>PARAMETRES</div>
          <h1 style={{ fontSize: "36px", fontWeight: 900, letterSpacing: "-0.04em", margin: 0 }}>Configuration</h1>
        </div>
        {saved && (
          <div style={{ display: "flex", alignItems: "center", gap: "7px", padding: "8px 16px", borderRadius: "999px", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80", fontSize: "13px", fontWeight: 700 }}>
            <Check size={14} /> Enregistre
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px", opacity: 0.5 }}><Loader2 size={28} /></div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {sections.map(({ icon: Icon, label, color, items }) => (
            <div key={label} style={{ ...CARD, padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <div style={{ width: 34, height: 34, borderRadius: "10px", background: color + "1a", border: `1px solid ${color}2a`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={16} color={color} />
                </div>
                <div style={{ fontWeight: 800, fontSize: "16px" }}>{label}</div>
              </div>
              <div style={{ display: "grid", gap: "14px" }}>
                {items.map(({ key, label: lbl, def }) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                    <div style={{ fontSize: "14px", opacity: 0.8 }}>{lbl}</div>
                    <Toggle value={get(key, def)} onChange={v => toggle(key, v)} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Account info */}
          <div style={{ ...CARD, padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <div style={{ width: 34, height: 34, borderRadius: "10px", background: "#6366f11a", border: "1px solid #6366f12a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Lock size={16} color="#6366f1" />
              </div>
              <div style={{ fontWeight: 800, fontSize: "16px" }}>Compte et abonnement</div>
            </div>
            <div style={{ display: "grid", gap: "10px" }}>
              {[
                { label: "Plan actif", value: "Premium" },
                { label: "Participants max", value: "5 par salle" },
                { label: "Langues disponibles", value: "10 langues" },
                { label: "Support", value: "Email" },
              ].map(({ label: l, value: v }) => (
                <div key={l} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: "14px", opacity: 0.65 }}>{l}</span>
                  <span style={{ fontWeight: 700, fontSize: "14px" }}>{v}</span>
                </div>
              ))}
            </div>
            <Link href="/pricing" style={{ textDecoration: "none" }}>
              <div style={{ marginTop: "16px", height: 40, borderRadius: "11px", background: "linear-gradient(135deg, #6366f1, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px", boxShadow: "0 6px 24px rgba(99,102,241,0.35)" }}>
                Passer a Business ou Enterprise
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
