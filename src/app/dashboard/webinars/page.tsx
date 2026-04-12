"use client";

import { useState, useEffect } from "react";
import { Radio, Plus, Users, Globe, Clock, Copy, CheckCheck, X, Loader2 } from "lucide-react";
import Link from "next/link";

const CARD = {
  borderRadius: "22px",
  border: "1px solid rgba(255,255,255,0.07)",
  background: "linear-gradient(145deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.018) 100%)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 2px 4px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.45), 0 28px 56px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.07)",
};

type Webinar = {
  id: string; title: string; topic?: string | null; host: string;
  startsAt: string; durationMins: number; maxAttendees: number;
  langs: string[]; color: string; status: string; roomId: string;
};

const STATUS_LABEL: Record<string, string> = { UPCOMING: "A venir", LIVE: "En direct", ENDED: "Termine", CANCELLED: "Annule" };
const STATUS_COLOR: Record<string, string> = { UPCOMING: "#6366f1", LIVE: "#22c55e", ENDED: "rgba(255,255,255,0.35)", CANCELLED: "#ef4444" };
const COLORS = ["#6366f1","#a855f7","#06b6d4","#10b981","#f59e0b","#ec4899"];
const LANG_OPTIONS = ["FR","EN","DE","ES","IT","PT","JA","ZH","AR","KO","HI","RU"];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function WebinarsPage() {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", topic: "", host: "Gaetan", startsAt: "", durationMins: 60,
    maxAttendees: 1000, langs: [] as string[], color: "#6366f1",
  });

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/webinars");
      if (r.ok) setWebinars((await r.json()).webinars);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const copyLink = async (roomId: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
    setCopied(roomId);
    setTimeout(() => setCopied(null), 2000);
  };

  const remove = async (id: string) => {
    setWebinars(prev => prev.filter(w => w.id !== id));
    await fetch(`/api/webinars/${id}`, { method: "DELETE" });
  };

  const createWebinar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch("/api/webinars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (r.ok) { await load(); setShowCreate(false); }
    } finally { setSaving(false); }
  };

  const toggleLang = (l: string) => {
    setForm(f => ({ ...f, langs: f.langs.includes(l) ? f.langs.filter(x => x !== l) : [...f.langs, l] }));
  };

  const upcoming = webinars.filter(w => w.status === "UPCOMING" || w.status === "LIVE");
  const past     = webinars.filter(w => w.status === "ENDED" || w.status === "CANCELLED");

  function WebinarCard({ w }: { w: Webinar }) {
    const color = STATUS_COLOR[w.status] || "#6366f1";
    return (
      <div style={{ ...CARD, padding: "22px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: w.color + "22", filter: "blur(30px)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
              <span style={{ height: 24, padding: "0 10px", borderRadius: "999px", background: color + "22", color, fontSize: "11px", fontWeight: 700, display: "inline-flex", alignItems: "center" }}>
                {w.status === "LIVE" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", marginRight: 5, boxShadow: "0 0 6px #22c55e" }} />}
                {STATUS_LABEL[w.status]}
              </span>
              {w.langs.map(l => <span key={l} style={{ height: 22, padding: "0 8px", borderRadius: "999px", background: "rgba(255,255,255,0.06)", fontSize: "11px", fontWeight: 600, display: "inline-flex", alignItems: "center" }}>{l}</span>)}
            </div>
            <h3 style={{ margin: "0 0 4px", fontWeight: 800, fontSize: "19px", letterSpacing: "-0.02em" }}>{w.title}</h3>
            {w.topic && <div style={{ fontSize: "13px", opacity: 0.55, marginBottom: "12px" }}>{w.topic}</div>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", fontSize: "12px", opacity: 0.6 }}>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><Clock size={11} />{formatDate(w.startsAt)} à {formatTime(w.startsAt)}</span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><Clock size={11} />{w.durationMins} min</span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><Users size={11} />Max {w.maxAttendees}</span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}><Globe size={11} />{w.langs.length} langue{w.langs.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
            {w.status !== "ENDED" && w.status !== "CANCELLED" && (
              <Link href={`/room/${w.roomId}`} style={{ textDecoration: "none" }}>
                <div style={{ height: 36, padding: "0 14px", borderRadius: "10px", background: `linear-gradient(135deg, ${w.color}, ${w.color}bb)`, display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, fontSize: "13px", boxShadow: `0 4px 16px ${w.color}44`, whiteSpace: "nowrap" }}>
                  <Radio size={12} /> Rejoindre
                </div>
              </Link>
            )}
            <button onClick={() => copyLink(w.roomId)} style={{ height: 36, padding: "0 12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: copied === w.roomId ? "#4ade80" : "rgba(255,255,255,0.7)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
              {copied === w.roomId ? <CheckCheck size={13} /> : <Copy size={13} />}
              {copied === w.roomId ? "Copie !" : "Lien"}
            </button>
            <button onClick={() => remove(w.id)} style={{ height: 36, width: 36, borderRadius: "10px", border: "1px solid rgba(239,68,68,0.2)", background: "transparent", color: "rgba(239,68,68,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <div style={{ fontSize: "12px", letterSpacing: "0.16em", opacity: 0.5, marginBottom: "7px", fontWeight: 600 }}>WEBINAIRES</div>
          <h1 style={{ fontSize: "36px", fontWeight: 900, letterSpacing: "-0.04em", margin: 0 }}>Webinaires</h1>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ height: "40px", padding: "0 18px", borderRadius: "11px", border: 0, background: "linear-gradient(135deg, #6366f1, #7c3aed)", color: "white", fontWeight: 700, fontSize: "13.5px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 6px 24px rgba(99,102,241,0.4)" }}>
          <Plus size={15} /> Nouveau webinaire
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px", opacity: 0.5 }}><Loader2 size={28} /></div>
      ) : webinars.length === 0 ? (
        <div style={{ ...CARD, padding: "60px", textAlign: "center", opacity: 0.5 }}>
          <Radio size={36} style={{ margin: "0 auto 16px", opacity: 0.4 }} />
          <div style={{ fontWeight: 700, fontSize: "18px", marginBottom: "6px" }}>Aucun webinaire</div>
          <div style={{ fontSize: "14px" }}>Planifiez votre premier webinaire multilingue.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "20px" }}>
          {upcoming.length > 0 && (
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, opacity: 0.4, letterSpacing: "0.12em", marginBottom: "12px" }}>A VENIR</div>
              <div style={{ display: "grid", gap: "12px" }}>{upcoming.map(w => <WebinarCard key={w.id} w={w} />)}</div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, opacity: 0.4, letterSpacing: "0.12em", marginBottom: "12px", marginTop: "8px" }}>TERMINES</div>
              <div style={{ display: "grid", gap: "12px" }}>{past.map(w => <WebinarCard key={w.id} w={w} />)}</div>
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, overflowY: "auto", padding: "20px" }}>
          <div style={{ ...CARD, width: "100%", maxWidth: "520px", padding: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: "22px" }}>Nouveau webinaire</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <form onSubmit={createWebinar} style={{ display: "grid", gap: "14px" }}>
              {[
                { k: "title", l: "Titre *", r: true }, { k: "topic", l: "Sujet" },
                { k: "host", l: "Organisateur" },
              ].map(({ k, l, r }) => (
                <div key={k}>
                  <div style={{ fontSize: "12px", opacity: 0.6, marginBottom: "5px", fontWeight: 600 }}>{l}</div>
                  <input required={r} value={form[k as keyof typeof form] as string} onChange={e => setForm(f => ({...f,[k]:e.target.value}))} style={{ width: "100%", height: "40px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "white", padding: "0 12px", fontSize: "13.5px", outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
              <div>
                <div style={{ fontSize: "12px", opacity: 0.6, marginBottom: "5px", fontWeight: 600 }}>Date et heure *</div>
                <input required type="datetime-local" value={form.startsAt} onChange={e => setForm(f => ({...f, startsAt: e.target.value}))} style={{ width: "100%", height: "40px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "white", padding: "0 12px", fontSize: "13.5px", outline: "none", boxSizing: "border-box", colorScheme: "dark" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "12px", opacity: 0.6, marginBottom: "5px", fontWeight: 600 }}>Duree (min)</div>
                  <input type="number" min={15} value={form.durationMins} onChange={e => setForm(f => ({...f, durationMins: +e.target.value}))} style={{ width: "100%", height: "40px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "white", padding: "0 12px", fontSize: "13.5px", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <div style={{ fontSize: "12px", opacity: 0.6, marginBottom: "5px", fontWeight: 600 }}>Max participants</div>
                  <input type="number" min={1} value={form.maxAttendees} onChange={e => setForm(f => ({...f, maxAttendees: +e.target.value}))} style={{ width: "100%", height: "40px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "white", padding: "0 12px", fontSize: "13.5px", outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", opacity: 0.6, marginBottom: "8px", fontWeight: 600 }}>Langues</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {LANG_OPTIONS.map(l => (
                    <button type="button" key={l} onClick={() => toggleLang(l)} style={{ height: 28, padding: "0 11px", borderRadius: "999px", border: "1px solid", borderColor: form.langs.includes(l) ? "#6366f1" : "rgba(255,255,255,0.12)", background: form.langs.includes(l) ? "rgba(99,102,241,0.2)" : "transparent", color: form.langs.includes(l) ? "#a5b4fc" : "rgba(255,255,255,0.55)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", opacity: 0.6, marginBottom: "8px", fontWeight: 600 }}>Couleur</div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {COLORS.map(c => (
                    <button type="button" key={c} onClick={() => setForm(f => ({...f, color: c}))} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: form.color === c ? "2px solid white" : "2px solid transparent", cursor: "pointer", boxShadow: form.color === c ? `0 0 10px ${c}` : "none" }} />
                  ))}
                </div>
              </div>
              <button type="submit" disabled={saving} style={{ height: "44px", borderRadius: "12px", border: 0, background: "linear-gradient(135deg, #6366f1, #7c3aed)", color: "white", fontWeight: 700, fontSize: "14px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                {saving && <Loader2 size={16} />}
                {saving ? "Creation..." : "Creer le webinaire"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
