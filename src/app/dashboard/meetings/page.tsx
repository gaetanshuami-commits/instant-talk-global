"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Invitee = { id: string; email: string; status: string };

type Meeting = {
  id: string;
  title: string;
  description?: string | null;
  hostEmail: string;
  roomId: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  status: string;
  invitees: Invitee[];
  joinLink: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function pretty(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}
function initials(s: string) {
  return s.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}
function tz() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris";
}

function MeetingsInner() {
  const params = useSearchParams();
  const prefill = params?.get("date") ?? null;

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [host, setHost] = useState("");
  const [guests, setGuests] = useState("");
  const [start, setStart] = useState(prefill ? toInput(new Date(`${prefill}T09:00`)) : toInput(new Date(Date.now() + 3600000)));
  const [end, setEnd] = useState(prefill ? toInput(new Date(`${prefill}T10:00`)) : toInput(new Date(Date.now() + 7200000)));
  const [link, setLink] = useState("");
  const [msg, setMsg] = useState("");
  const [day, setDay] = useState(prefill ?? new Date().toISOString().slice(0, 10));
  const formRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const r = await fetch("/api/meetings");
      const d = await r.json();
      setMeetings(Array.isArray(d.meetings) ? d.meetings : []);
    } catch {
      setMeetings([]);
    }
  }

  useEffect(() => { load(); }, []);

  const future = useMemo(() => meetings.filter((m) => new Date(m.endsAt) >= new Date()), [meetings]);
  const past = useMemo(() => meetings.filter((m) => new Date(m.endsAt) < new Date()), [meetings]);
  const today = useMemo(() => meetings.filter((m) => m.startsAt.slice(0, 10) === day), [meetings, day]);

  async function book() {
    setMsg("Création...");
    const r = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description: desc, hostEmail: host, startsAt: start, endsAt: end, timezone: tz(), invitees: guests.split(",").map((g) => g.trim()).filter(Boolean) }),
    });
    const d = await r.json();
    if (!r.ok) { setMsg(d.error === "invalid_payload" ? "Remplis titre et email" : "Erreur"); return; }
    setLink(d.joinLink ?? "");
    setMsg("Réunion créée ✓");
    setTitle(""); setDesc(""); setHost(""); setGuests("");
    load();
  }

  async function instant() {
    setMsg("Création...");
    const now = new Date();
    const r = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Nouvelle réunion", description: "Instantanée", hostEmail: host || "host@instant-talk.com", startsAt: toInput(now), endsAt: toInput(new Date(now.getTime() + 3600000)), timezone: tz(), invitees: [] }),
    });
    const d = await r.json();
    if (!r.ok) { setMsg("Erreur"); return; }
    setLink(d.joinLink ?? "");
    setMsg("Réunion créée ✓");
    load();
  }

  async function invite(id: string) {
    setMsg("Envoi...");
    const r = await fetch(`/api/meetings/${id}/invite`, { method: "POST" });
    setMsg(r.ok ? "Invitations envoyées ✓" : "Erreur envoi");
    if (r.ok) load();
  }

  async function remove(id: string) {
    await fetch(`/api/meetings/${id}`, { method: "DELETE" });
    setMsg("Supprimée");
    load();
  }

  async function copy(url: string) {
    await navigator.clipboard.writeText(url);
    setMsg("Lien copié ✓");
  }

  /* ── styles ── */
  const S = {
    card: { borderRadius: 28, padding: 24, background: "linear-gradient(180deg,rgba(14,20,38,.96),rgba(10,16,31,.95))", border: "1px solid rgba(255,255,255,.08)", boxShadow: "0 30px 80px rgba(0,0,0,.24)" } as React.CSSProperties,
    input: { height: 54, borderRadius: 16, padding: "0 16px", border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.04)", color: "#fff", fontSize: 15, width: "100%", boxSizing: "border-box" as const },
    btn: (bg: string) => ({ height: 40, borderRadius: 999, border: 0, padding: "0 16px", background: bg, color: "#fff", fontWeight: 700, cursor: "pointer" } as React.CSSProperties),
  };

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", color: "#fff" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 42, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>Planification & calendrier</h1>
          <p style={{ margin: "10px 0 0", opacity: .72, fontSize: 16 }}>Cockpit de réunions premium.</p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={instant} style={{ height: 48, padding: "0 20px", borderRadius: 999, border: 0, background: "linear-gradient(135deg,#2563eb,#4f46e5)", color: "#fff", fontWeight: 800, cursor: "pointer", boxShadow: "0 18px 40px rgba(37,99,235,.28)" }}>
            Nouvelle réunion
          </button>
          <button onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })} style={{ height: 48, padding: "0 20px", borderRadius: 999, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.06)", color: "#fff", fontWeight: 800, cursor: "pointer" }}>
            Planifier
          </button>
          <span style={{ height: 44, padding: "0 16px", borderRadius: 999, display: "flex", alignItems: "center", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)", fontWeight: 700 }}>
            {future.length} à venir
          </span>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          ["Réunions futures", future.length],
          ["Réunions passées", past.length],
          ["Sessions du jour", today.length],
          ["Invités estimés", meetings.reduce((a, m) => a + m.invitees.length, 0)],
        ].map(([label, value]) => (
          <div key={String(label)} style={{ borderRadius: 22, padding: 20, background: "linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.035))", border: "1px solid rgba(255,255,255,.1)" }}>
            <div style={{ fontSize: 13, opacity: .7, marginBottom: 10 }}>{label}</div>
            <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-0.04em" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Form + Calendar ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 18, marginBottom: 18 }}>

        {/* Form */}
        <div ref={formRef} style={S.card}>
          <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Programmer une réunion</div>
          <div style={{ opacity: .68, marginBottom: 18 }}>Crée une session avec lien sécurisé et invités.</div>
          <div style={{ display: "grid", gap: 12 }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre *" style={S.input} />
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optionnel)" style={{ ...S.input, height: "auto", minHeight: 100, padding: 16, resize: "vertical" }} />
            <input value={host} onChange={(e) => setHost(e.target.value)} placeholder="Email organisateur *" style={S.input} />
            <input value={guests} onChange={(e) => setGuests(e.target.value)} placeholder="Invités : email1, email2, ..." style={S.input} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} style={S.input} />
              <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} style={S.input} />
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <button onClick={book} style={{ height: 50, padding: "0 24px", borderRadius: 999, border: 0, background: "linear-gradient(135deg,#6d74ff,#7c3aed)", color: "#fff", fontWeight: 800, cursor: "pointer" }}>
                Programmer
              </button>
              {msg && <span style={{ opacity: .8, fontWeight: 600 }}>{msg}</span>}
            </div>
            {link && (
              <div style={{ borderRadius: 16, padding: 16, background: "rgba(99,102,241,.1)", border: "1px solid rgba(139,163,255,.2)" }}>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Lien créé</div>
                <div style={{ wordBreak: "break-all", opacity: .85, fontSize: 14 }}>{link}</div>
              </div>
            )}
          </div>
        </div>

        {/* Calendar */}
        <div style={{ ...S.card, display: "grid", alignContent: "start", gap: 16 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Calendrier</div>
            <div style={{ opacity: .68 }}>Sessions du jour sélectionné.</div>
          </div>
          <input type="date" value={day} onChange={(e) => setDay(e.target.value)} style={{ ...S.input, height: 50 }} />
          {today.length === 0
            ? <div style={{ padding: 16, borderRadius: 16, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", opacity: .7 }}>Aucune réunion ce jour</div>
            : today.map((m) => (
              <div key={m.id} style={{ padding: 16, borderRadius: 16, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}>
                <div style={{ fontWeight: 800 }}>{m.title}</div>
                <div style={{ opacity: .7, marginTop: 4, fontSize: 14 }}>{pretty(m.startsAt)}</div>
                <div style={{ opacity: .7, fontSize: 14 }}>{m.invitees.length} invité(s)</div>
              </div>
            ))}
        </div>
      </div>

      {/* ── Future / Past ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

        {/* Future */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>Réunions futures</div>
              <div style={{ opacity: .68, marginTop: 4 }}>Prochains rendez-vous planifiés.</div>
            </div>
            <span style={{ fontWeight: 800, color: "#b9c6ff" }}>{future.length}</span>
          </div>
          <div style={{ display: "grid", gap: 14 }}>
            {future.length === 0
              ? <div style={{ padding: 18, borderRadius: 16, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", opacity: .75 }}>Aucune réunion planifiée</div>
              : future.map((m) => (
                <div key={m.id} style={{ borderRadius: 20, padding: 18, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", display: "grid", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{m.title}</div>
                      <div style={{ opacity: .7, marginTop: 4, fontSize: 14 }}>{pretty(m.startsAt)} → {pretty(m.endsAt)}</div>
                    </div>
                    <div style={{ height: 40, minWidth: 40, borderRadius: 999, background: "rgba(99,102,241,.2)", border: "1px solid rgba(139,163,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>
                      {initials(m.title)}
                    </div>
                  </div>
                  <div style={{ opacity: .7, fontSize: 14 }}>{m.invitees.map((i) => i.email).join(", ") || "Aucun invité"}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => copy(m.joinLink)} style={S.btn("rgba(255,255,255,.08)")}>Copier lien</button>
                    <button onClick={() => invite(m.id)} style={S.btn("rgba(99,102,241,.2)")}>Inviter</button>
                    <button onClick={() => window.open(m.joinLink, "_blank")} style={S.btn("linear-gradient(135deg,#6d74ff,#7c3aed)")}>Démarrer</button>
                    <button onClick={() => remove(m.id)} style={S.btn("rgba(220,38,38,.2)")}>Supprimer</button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Past */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>Réunions passées</div>
              <div style={{ opacity: .68, marginTop: 4 }}>Historique des sessions.</div>
            </div>
            <span style={{ fontWeight: 800, color: "#b9c6ff" }}>{past.length}</span>
          </div>
          <div style={{ display: "grid", gap: 14 }}>
            {past.length === 0
              ? <div style={{ padding: 18, borderRadius: 16, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", opacity: .75 }}>Aucune réunion passée</div>
              : past.map((m) => (
                <div key={m.id} style={{ borderRadius: 20, padding: 18, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}>
                  <div style={{ fontSize: 17, fontWeight: 800 }}>{m.title}</div>
                  <div style={{ opacity: .7, marginTop: 6, fontSize: 14 }}>{pretty(m.startsAt)}</div>
                  <div style={{ opacity: .6, fontSize: 14, marginTop: 2 }}>{m.invitees.length} invité(s)</div>
                </div>
              ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function MeetingsPage() {
  return (
    <Suspense fallback={<div style={{ color: "#fff", padding: 40 }}>Chargement...</div>}>
      <MeetingsInner />
    </Suspense>
  );
}
