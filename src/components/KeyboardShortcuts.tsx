"use client";

/**
 * Keyboard Shortcuts Overlay — press ? anywhere in dashboard
 */

import { useEffect, useState } from "react";
import { X, Keyboard } from "lucide-react";

const SHORTCUTS = [
  { group: "Navigation",
    items: [
      { keys: ["⌘", "K"],   label: "Ouvrir la palette de commandes" },
      { keys: ["G", "H"],   label: "Aller au Dashboard" },
      { keys: ["G", "M"],   label: "Aller aux Réunions" },
      { keys: ["G", "C"],   label: "Aller au Calendrier" },
      { keys: ["G", "T"],   label: "Aller aux Contacts" },
      { keys: ["G", "S"],   label: "Aller aux Paramètres" },
    ],
  },
  { group: "Actions",
    items: [
      { keys: ["N"],         label: "Nouvelle réunion instantanée" },
      { keys: ["S"],         label: "Planifier une réunion" },
      { keys: ["?"],         label: "Afficher les raccourcis" },
      { keys: ["Esc"],       label: "Fermer / Annuler" },
    ],
  },
  { group: "Général",
    items: [
      { keys: ["⌘", "/"],   label: "Rechercher" },
      { keys: ["⌘", "C"],   label: "Copier le lien de réunion" },
      { keys: ["F"],         label: "Plein écran dans la salle" },
      { keys: ["M"],         label: "Couper / rétablir le micro" },
      { keys: ["V"],         label: "Activer / couper la caméra" },
    ],
  },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!open) return null;

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", zIndex: 9998 }}
      />
      <div style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(680px, 92vw)",
        maxHeight: "80vh",
        overflowY: "auto",
        borderRadius: "22px",
        background: "rgba(6,10,22,0.98)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 32px 100px rgba(0,0,0,0.8)",
        backdropFilter: "blur(40px)",
        zIndex: 9999,
        padding: "24px",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
          <Keyboard size={18} style={{ color: "#818cf8" }} />
          <span style={{ fontWeight: 800, fontSize: "17px" }}>Raccourcis clavier</span>
          <button
            onClick={() => setOpen(false)}
            style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: "4px", display: "flex", borderRadius: "6px" }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
          {SHORTCUTS.map((section) => (
            <div key={section.group}>
              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", opacity: 0.4, textTransform: "uppercase", marginBottom: "12px" }}>
                {section.group}
              </div>
              <div style={{ display: "grid", gap: "8px" }}>
                {section.items.map(({ keys, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ display: "flex", gap: "3px", flexShrink: 0 }}>
                      {keys.map((k) => (
                        <kbd key={k} style={{ padding: "3px 8px", borderRadius: "6px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)", fontSize: "12px", fontFamily: "monospace", fontWeight: 600, lineHeight: "18px" }}>
                          {k}
                        </kbd>
                      ))}
                    </div>
                    <span style={{ fontSize: "12.5px", opacity: 0.65, lineHeight: 1.3 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.07)", textAlign: "center", fontSize: "12px", opacity: 0.35 }}>
          Appuyez sur <kbd style={{ padding: "2px 6px", borderRadius: "4px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "monospace", fontSize: "11px" }}>?</kbd> pour ouvrir/fermer
        </div>
      </div>
    </>
  );
}
