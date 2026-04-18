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

function Toast({ msg, type }: { msg: string; type: "ok" | "err" | "info" }) {
  const bg = type === "ok" ? "linear-gradient(135deg,#16a34a,#15803d)" : type === "err" ? "linear-gradient(135deg,#dc2626,#b91c1c)" : "linear-gradient(135deg,#2563eb,#4f46e5)";
  return (
    <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, maxWidth: 360, padding: "14px 20px", borderRadius: 16, background: bg, color: "#fff", fontWeight: 700, fontSize: 15, boxShadow: "0 20px 60px rgba(0,0,0,.4)", pointerEvents: "none" }}>
      {msg}
    </div>
  );
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
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" | "info" } | null>(null);
  const [busy, setBusy] = useState(false);
  const [day, setDay] = useState(prefill ?? new Date().toISOString().slice(0, 10));
  const formRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function notify(msg: string, type: "ok" | "err" | "info" = "info") {
    setToast({ msg, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }

  async function load() {
    try {
      const r = await fetch("/api/meetings");
      if (!r.ok) { setMeetings([]); return; }
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
    if (!title.trim()) { notify("Remplis le titre de la réunion", "err"); return; }
    if (!host.trim()) { notify("Remplis l'email organisateur", "err"); return; }
    setBusy(true);
    notify("Création en cours...", "info");
    try {
      const r = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: desc, hostEmail: host, startsAt: start, endsAt: end, timezone: tz(), invitees: guests.split(",").map((g) => g.trim()).filter(Boolean) }),
      });
      const d = await r.json();
      if (!r.ok) {
        notify(d.error === "invalid_payload" ? "Titre et email requis" : d.error === "db_unavailable" ? "Base de données indisponible" : "Erreur lors de la création", "err");
        return;
      }
      setLink(d.joinLink ?? "");
      notify("Réunion créée avec succès !", "ok");
      setTitle(""); setDesc(""); setHost(""); setGuests("");
      load();
    } catch {
      notify("Erreur réseau — vérifiez votre connexion", "err");
    } finally {
      setBusy(false);
    }
  }

  async function instant() {
    setBusy(true);
    notify("Création en cours...", "info");
    const now = new Date();
    try {
      const r = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Nouvelle réunion", description: "Instantanée", hostEmail: host || "host@instant-talk.com", startsAt: toInput(now), endsAt: toInput(new Date(now.getTime() + 3600000)), timezone: tz(), invitees: [] }),
      });
      const d = await r.json();
      if (!r.ok) {
        notify(d.error === "db_unavailable" ? "Base de données indisponible" : "Erreur lors de la création", "err");
        return;
      }
      setLink(d.joinLink ?? "");
      notify("Réunion instantanée créée !", "ok");
      load();
    } catch {
      notify("Erreur réseau — vérifiez votre connexion", "err");
    } finally {
      setBusy(false);
    }
  }

  async function invite(id: string) {
    notify("Envoi des invitations...", "info");
    try {
      const r = await fetch(`/api/meetings/${id}/invite`, { method: "POST" });
      notify(r.ok ? "Invitations envoyées !" : "Erreur lors de l'envoi", r.ok ? "ok" : "err");
      if (r.ok) load();
    } catch {
      notify("Erreur réseau", "err");
    }
  }

  async function remove(id: string) {
    notify("Suppression...", "info");
    try {
      await fetch(`/api/meetings/${id}`, { method: "DELETE" });
      notify("Réunion supprimée", "ok");
      load();
    } catch {
      notify("Erreur lors de la suppression", "err");
    }
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      notify("Lien copié dans le presse-papier !", "ok");
    } catch {
      notify("Impossible de copier le lien", "err");
    }
  }

  /* ── styles ── */
  const S = {
    card: { borderRadius: 28, padding: 24, background: "linear-gradient(180deg,rgba(14,20,38,.96),rgba(10,16,31,.95))", border: "1px solid rgba(255,255,255,.08)", boxShadow: "0 30px 80px rgba(0,0,0,.24)" } as React.CSSProperties,
    input: { height: 54, borderRadius: 16, padding: "0 16px", border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.04)", color: "#fff", fontSize: 15, width: "100%", boxSizing: "border-box" as const },
    btn: (bg: string) => ({ height: 40, borderRadius: 999, border: 0, padding: "0 16px", background: bg, color: "#fff", fontWeight: 700, cursor: "pointer", opacity: busy ? 0.6 : 1 } as React.CSSProperties),
  };

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", color: "#fff" }}>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 42, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>Planification & calendrier</h1>
          <p style={{ margin: "10px 0 0", opacity: .72, fontSize: 16 }}>Cockpit de réunions premium.</p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={instant}
            disabled={busy}
            style={{ height: 48, padding: "0 20px", borderRadius: 999, border: 0, background: "linear-gradient(135deg,#2563eb,#4f46e5)", color: "#fff", fontWeight: 800, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1, boxShadow: "0 18px 40px rgba(37,99,235,.28)" }}
          >
            {busy ? "Création..." : "Nouvelle réunion"}
          </button>
          <button
            onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}
            style={{ height: 48, padding: "0 20px", borderRadius: 999, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.06)", color: "#fff", fontWeight: 800, cursor: "pointer" }}
          >
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
            <button onClick={book} disabled={busy} style={{ height: 50, padding: "0 24px", borderRadius: 999, border: 0, background: "linear-gradient(135deg,#6d74ff,#7c3aed)", color: "#fff", fontWeight: 800, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1 }}>
              {busy ? "Création..." : "Programmer"}
            </button>
            {link && (
              <div style={{ borderRadius: 16, padding: 16, background: "rgba(99,102,241,.1)", border: "1px solid rgba(139,163,255,.2)" }}>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Lien créé</div>
                <div style={{ wordBreak: "break-all", opacity: .85, fontSize: 14 }}>{link}</div>
                <button onClick={() => copy(link)} style={{ marginTop: 10, height: 36, padding: "0 16px", borderRadius: 999, border: 0, background: "rgba(99,102,241,.3)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                  Copier
                </button>
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
