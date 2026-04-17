"use client";

/**
 * CommandPalette — triggered by Cmd+K / Ctrl+K
 * Like Linear, Vercel, Notion — navigation ultra-rapide
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Video, Calendar, Users, MessageSquare, Radio,
  Film, BarChart3, Settings, Plus, ArrowRight, Globe,
  Mic, Zap, Hash, Keyboard, X,
} from "lucide-react";

type Result = { id: string; label: string; sub?: string; href: string; icon: React.FC<{ size?: number }> };

const QUICK_NAV: Result[] = [
  { id: "nav-dash",      label: "Vue d'ensemble",     sub: "Dashboard principal",           href: "/dashboard",               icon: ({ size = 15 }) => <BarChart3 size={size} /> },
  { id: "nav-meetings",  label: "Réunions",            sub: "Gérer vos meetings",            href: "/dashboard/meetings",      icon: ({ size = 15 }) => <Video size={size} /> },
  { id: "nav-calendar",  label: "Calendrier",          sub: "Planning mensuel",              href: "/dashboard/calendar",      icon: ({ size = 15 }) => <Calendar size={size} /> },
  { id: "nav-contacts",  label: "Contacts",            sub: "Carnet d'adresses",             href: "/dashboard/contacts",      icon: ({ size = 15 }) => <Users size={size} /> },
  { id: "nav-chat",      label: "Chat",                sub: "Messagerie instantanée",        href: "/dashboard/chat",          icon: ({ size = 15 }) => <MessageSquare size={size} /> },
  { id: "nav-webinars",  label: "Webinaires",          sub: "Sessions en direct",            href: "/dashboard/webinars",      icon: ({ size = 15 }) => <Radio size={size} /> },
  { id: "nav-reports",   label: "Rapports",            sub: "Analytiques & statistiques",    href: "/dashboard/reports",       icon: ({ size = 15 }) => <BarChart3 size={size} /> },
  { id: "nav-settings",  label: "Paramètres",          sub: "Compte & préférences",          href: "/dashboard/settings",      icon: ({ size = 15 }) => <Settings size={size} /> },
  { id: "nav-status",    label: "Statut de la plateforme", sub: "État des services",         href: "/status",                  icon: ({ size = 15 }) => <Zap size={size} /> },
  { id: "nav-device",    label: "Test appareil",       sub: "Vérifier caméra & micro",       href: "/device-check",            icon: ({ size = 15 }) => <Mic size={size} /> },
  { id: "nav-pricing",   label: "Tarifs",              sub: "Plans & abonnements",           href: "/pricing",                 icon: ({ size = 15 }) => <Hash size={size} /> },
];

const ACTIONS: Result[] = [
  { id: "act-instant",   label: "Nouvelle réunion instantanée", sub: "Démarrer maintenant",  href: "__instant__",              icon: ({ size = 15 }) => <Plus size={size} /> },
  { id: "act-schedule",  label: "Planifier une réunion",        sub: "Choisir date et heure", href: "/dashboard/meetings",     icon: ({ size = 15 }) => <Calendar size={size} /> },
  { id: "act-contact",   label: "Ajouter un contact",           sub: "Nouveau dans le carnet", href: "/dashboard/contacts",    icon: ({ size = 15 }) => <Users size={size} /> },
  { id: "act-webinar",   label: "Créer un webinaire",           sub: "Session enterprise",    href: "/dashboard/webinars",     icon: ({ size = 15 }) => <Radio size={size} /> },
  { id: "act-device",    label: "Tester ma caméra & micro",     sub: "Avant de rejoindre",    href: "/device-check",           icon: ({ size = 15 }) => <Mic size={size} /> },
];

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [apiResults, setApiResults] = useState<Result[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── open/close keyboard trigger ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ── focus input on open ── */
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  /* ── search API ── */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setApiResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`).catch(() => null);
      if (!r?.ok) return;
      const data = await r.json();
      setApiResults(
        (data.results || []).map((item: { type: string; id: string; label: string; sub?: string; href: string }) => ({
          id: item.id,
          label: item.label,
          sub: item.sub,
          href: item.href,
          icon: ({ size = 15 }: { size?: number }) => <Globe size={size} />,
        }))
      );
    }, 180);
  }, [query]);

  /* ── filtered results ── */
  const filtered: { group: string; items: Result[] }[] = query.length < 2
    ? [
        { group: "Actions rapides", items: ACTIONS },
        { group: "Navigation",      items: QUICK_NAV.slice(0, 6) },
      ]
    : [
        ...(apiResults.length > 0 ? [{ group: "Résultats", items: apiResults }] : []),
        {
          group: "Pages",
          items: [...QUICK_NAV, ...ACTIONS].filter(
            (r) => r.label.toLowerCase().includes(query.toLowerCase()) ||
                   (r.sub ?? "").toLowerCase().includes(query.toLowerCase())
          ),
        },
      ].filter((g) => g.items.length > 0);

  const flat = filtered.flatMap((g) => g.items);

  /* ── keyboard navigation ── */
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, flat.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && flat[selected]) { execute(flat[selected]); }
  }, [flat, selected]);

  const execute = useCallback((item: Result) => {
    setOpen(false);
    if (item.href === "__instant__") {
      const id = Math.random().toString(36).substring(2, 12);
      router.push(`/room/${id}?host=1`);
    } else {
      router.push(item.href);
    }
  }, [router]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", zIndex: 9998 }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "18%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(640px, 94vw)",
          borderRadius: "22px",
          background: "rgba(6,10,22,0.98)",
          border: "1px solid rgba(99,102,241,0.3)",
          boxShadow: "0 32px 100px rgba(0,0,0,0.9), 0 0 0 1px rgba(99,102,241,0.12)",
          backdropFilter: "blur(40px)",
          zIndex: 9999,
          overflow: "hidden",
        }}
      >
        {/* Input */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <Search size={17} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={onKeyDown}
            placeholder="Rechercher ou naviguer..."
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "white", fontSize: "16px", fontWeight: 500 }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", padding: 0 }}>
              <X size={14} />
            </button>
          )}
          <kbd style={{ padding: "3px 8px", borderRadius: "6px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: "11px", fontFamily: "monospace" }}>
            esc
          </kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: "420px", overflowY: "auto", padding: "8px 0" }}>
          {filtered.map((group) => (
            <div key={group.group}>
              <div style={{ padding: "6px 20px 4px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
                {group.group}
              </div>
              {group.items.map((item) => {
                const idx = flat.indexOf(item);
                const isSel = idx === selected;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => execute(item)}
                    onMouseEnter={() => setSelected(idx)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 20px",
                      background: isSel ? "rgba(99,102,241,0.18)" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      color: "white",
                      transition: "background 0.08s",
                    }}
                  >
                    <span style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "8px",
                      background: isSel ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.07)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: isSel ? "#a5b4fc" : "rgba(255,255,255,0.5)",
                    }}>
                      <Icon size={15} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: isSel ? "#e0e7ff" : "rgba(255,255,255,0.9)" }}>
                        {item.label}
                      </div>
                      {item.sub && (
                        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "1px" }}>
                          {item.sub}
                        </div>
                      )}
                    </div>
                    {isSel && <ArrowRight size={14} style={{ color: "#818cf8", flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && query.length >= 2 && (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: "14px" }}>
              Aucun résultat pour « {query} »
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div style={{ padding: "10px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "18px", alignItems: "center" }}>
          {[
            ["↑↓", "naviguer"],
            ["↵", "ouvrir"],
            ["esc", "fermer"],
            ["⌘K", "ouvrir/fermer"],
          ].map(([key, label]) => (
            <span key={key} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
              <kbd style={{ padding: "2px 6px", borderRadius: "5px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "monospace", fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>
                {key}
              </kbd>
              {label}
            </span>
          ))}
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>
            <Keyboard size={11} /> Instant Talk
          </span>
        </div>
      </div>
    </>
  );
}
