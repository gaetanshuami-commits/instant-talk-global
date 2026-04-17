"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Invitee = { id: string; email: string; status: string };
type Reminder = { id: string; remindAt: string; sentAt?: string | null };

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
  reminders?: Reminder[];
  joinLink: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toInputDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function prettyDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

function initials(s: string) {
  return s.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function MeetingsPageInner() {
  const searchParams = useSearchParams();
  const prefillDate = searchParams?.get("date") ?? null;

  const defaultStart = prefillDate
    ? toInputDate(new Date(`${prefillDate}T09:00`))
    : toInputDate(new Date(Date.now() + 60 * 60 * 1000));
  const defaultEnd = prefillDate
    ? toInputDate(new Date(`${prefillDate}T10:00`))
    : toInputDate(new Date(Date.now() + 2 * 60 * 60 * 1000));

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hostEmail, setHostEmail] = useState("");
  const [invitees, setInvitees] = useState("");
  const [startsAt, setStartsAt] = useState(defaultStart);
  const [endsAt, setEndsAt] = useState(defaultEnd);
  const [createdLink, setCreatedLink] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [selectedDate, setSelectedDate] = useState(prefillDate ?? new Date().toISOString().slice(0, 10));

  const formRef = useRef<HTMLDivElement | null>(null);

  async function loadMeetings() {
    try {
      const res = await fetch("/api/meetings");
      const data = await res.json();
      setMeetings(data.meetings || []);
    } catch {
      setMeetings([]);
    }
  }

  useEffect(() => { loadMeetings(); }, []);

  const futureMeetings = useMemo(
    () => meetings.filter((m) => new Date(m.endsAt).getTime() >= Date.now()),
    [meetings]
  );
  const pastMeetings = useMemo(
    () => meetings.filter((m) => new Date(m.endsAt).getTime() < Date.now()),
    [meetings]
  );
  const todayMeetings = useMemo(
    () => meetings.filter((m) => m.startsAt.slice(0, 10) === selectedDate),
    [meetings, selectedDate]
  );

  async function createMeeting() {
    setStatusMsg("Création en cours...");
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          hostEmail,
          startsAt,
          endsAt,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris",
          invitees: invitees.split(",").map((v) => v.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg(data.error === "invalid_payload" ? "Champs manquants" : data.error || "Erreur");
        return;
      }
      setCreatedLink(data.joinLink || "");
      setStatusMsg("Réunion programmée ✓");
      setTitle(""); setDescription(""); setHostEmail(""); setInvitees("");
      await loadMeetings();
    } catch {
      setStatusMsg("Erreur réseau");
    }
  }

  async function createInstantMeeting() {
    setStatusMsg("Création...");
    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Nouvelle réunion",
          description: "Réunion instantanée",
          hostEmail: hostEmail || "host@instant-talk.com",
          startsAt: toInputDate(now),
          endsAt: toInputDate(end),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris",
          invitees: [],
        }),
      });
      const data = await res.json();
      if (!res.ok) { setStatusMsg(data.error || "Erreur"); return; }
      setCreatedLink(data.joinLink || "");
      setStatusMsg("Réunion créée ✓");
      await loadMeetings();
    } catch {
      setStatusMsg("Erreur réseau");
    }
  }

  async function copyLink(link: string) {
    await navigator.clipboard.writeText(link);
    setStatusMsg("Lien copié ✓");
  }

  async function sendInvites(id: string) {
    setStatusMsg("Envoi...");
    try {
      const res = await fetch(`/api/meetings/${id}/invite`, { method: "POST" });
      setStatusMsg(res.ok ? "Invitations envoyées ✓" : "Erreur envoi");
      if (res.ok) await loadMeetings();
    } catch { setStatusMsg("Erreur réseau"); }
  }

  async function deleteMeeting(id: string) {
    try {
      await fetch(`/api/meetings/${id}`, { method: "DELETE" });
      setStatusMsg("Réunion supprimée");
      await loadMeetings();
    } catch { setStatusMsg("Erreur réseau"); }
  }

  const input: React.CSSProperties = {
    height: "54px", borderRadius: "16px", padding: "0 16px",
    border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)",
    color: "white", fontSize: "15px", width: "100%", boxSizing: "border-box",
  };

  const card: React.CSSProperties = {
    borderRadius: "28px", padding: "24px",
    background: "linear-gradient(180deg, rgba(14,20,38,0.96), rgba(10,16,31,0.95))",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.24)",
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", color: "white" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "42px", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>
            Planification & calendrier
          </div>
          <div style={{ marginTop: "10px", opacity: 0.72, fontSize: "16px" }}>
            Un cockpit de réunion premium.
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={createInstantMeeting}
            style={{ height: "48px", padding: "0 20px", borderRadius: "999px", border: "0", background: "linear-gradient(135deg, #2563eb, #4f46e5)", color: "white", fontWeight: 800, cursor: "pointer", boxShadow: "0 18px 40px rgba(37,99,235,0.28)" }}
          >
            Nouvelle réunion
          </button>
          <button
            onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            style={{ height: "48px", padding: "0 20px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "white", fontWeight: 800, cursor: "pointer" }}
          >
            Planifier
          </button>
          <div style={{ height: "44px", padding: "0 16px", borderRadius: "999px", display: "flex", alignItems: "center", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", fontWeight: 700 }}>
            {futureMeetings.length} à venir
          </div>
          <div style={{ height: "44px", padding: "0 16px", borderRadius: "999px", display: "flex", alignItems: "center", background: "linear-gradient(135deg, #6d74ff, #7c3aed)", fontWeight: 800, boxShadow: "0 18px 40px rgba(92,99,255,0.32)" }}>
            Workspace premium
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Réunions futures", value: futureMeetings.length },
          { label: "Réunions passées", value: pastMeetings.length },
          { label: "Sessions du jour", value: todayMeetings.length },
          { label: "Invités estimés", value: meetings.reduce((a, m) => a + m.invitees.length, 0) },
        ].map((c) => (
          <div key={c.label} style={{ borderRadius: "22px", padding: "20px", background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.035))", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 40px rgba(0,0,0,0.18)" }}>
            <div style={{ fontSize: "13px", opacity: 0.7, marginBottom: "10px" }}>{c.label}</div>
            <div style={{ fontSize: "34px", fontWeight: 900, letterSpacing: "-0.04em" }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Form + Calendar */}
      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: "18px", marginBottom: "18px" }}>

        {/* Scheduler form */}
        <div ref={formRef} style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
            <div>
              <div style={{ fontSize: "26px", fontWeight: 800 }}>Programmer une réunion</div>
              <div style={{ opacity: 0.68, marginTop: "6px" }}>Crée une session avec lien sécurisé.</div>
            </div>
            <div style={{ height: "42px", padding: "0 14px", borderRadius: "999px", background: "rgba(99,102,241,0.14)", border: "1px solid rgba(139,163,255,0.2)", display: "flex", alignItems: "center", fontWeight: 700, color: "#cfd8ff" }}>
              Nouveau rendez-vous
            </div>
          </div>

          <div style={{ display: "grid", gap: "14px" }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de la réunion" style={input} />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description, objectif, ordre du jour..." style={{ ...input, height: "auto", minHeight: "120px", padding: "16px", resize: "vertical" }} />
            <input value={hostEmail} onChange={(e) => setHostEmail(e.target.value)} placeholder="Email organisateur" style={input} />
            <input value={invitees} onChange={(e) => setInvitees(e.target.value)} placeholder="Invités séparés par virgule" style={input} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} style={input} />
              <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} style={input} />
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <button
                onClick={createMeeting}
                style={{ height: "54px", padding: "0 22px", borderRadius: "999px", border: "0", background: "linear-gradient(135deg, #6d74ff, #7c3aed)", color: "white", fontWeight: 800, cursor: "pointer", boxShadow: "0 18px 40px rgba(92,99,255,0.32)" }}
              >
                Programmer une réunion
              </button>
              {statusMsg && (
                <div style={{ height: "54px", padding: "0 18px", borderRadius: "999px", display: "flex", alignItems: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.76)", fontWeight: 600 }}>
                  {statusMsg}
                </div>
              )}
            </div>
            {createdLink && (
              <div style={{ borderRadius: "18px", padding: "16px", background: "linear-gradient(180deg, rgba(99,102,241,0.12), rgba(99,102,241,0.05))", border: "1px solid rgba(139,163,255,0.18)" }}>
                <div style={{ fontWeight: 800, marginBottom: "8px" }}>Lien généré</div>
                <div style={{ wordBreak: "break-all", opacity: 0.86 }}>{createdLink}</div>
              </div>
            )}
          </div>
        </div>

        {/* Calendar */}
        <div style={{ ...card, display: "grid", alignContent: "start", gap: "18px" }}>
          <div>
            <div style={{ fontSize: "26px", fontWeight: 800 }}>Calendrier</div>
            <div style={{ opacity: 0.68, marginTop: "6px" }}>Vue rapide des sessions du jour.</div>
          </div>
          <div style={{ borderRadius: "20px", padding: "18px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ ...input, height: "50px" }} />
          </div>
          <div style={{ display: "grid", gap: "12px" }}>
            {todayMeetings.length === 0 ? (
              <div style={{ borderRadius: "18px", padding: "18px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", opacity: 0.78 }}>
                Aucune réunion à cette date
              </div>
            ) : todayMeetings.map((m) => (
              <div key={m.id} style={{ borderRadius: "18px", padding: "18px", background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.035))", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontWeight: 800, fontSize: "16px" }}>{m.title}</div>
                <div style={{ opacity: 0.72, marginTop: "6px" }}>{prettyDate(m.startsAt)}</div>
                <div style={{ opacity: 0.72, marginTop: "4px" }}>{m.invitees.length} invité(s)</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Future / Past meetings */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>

        {/* Future */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
            <div>
              <div style={{ fontSize: "24px", fontWeight: 800 }}>Réunions futures</div>
              <div style={{ opacity: 0.68, marginTop: "6px" }}>Les prochains rendez-vous planifiés.</div>
            </div>
            <div style={{ fontWeight: 800, color: "#b9c6ff" }}>{futureMeetings.length}</div>
          </div>
          <div style={{ display: "grid", gap: "14px" }}>
            {futureMeetings.length === 0 ? (
              <div style={{ borderRadius: "18px", padding: "18px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", opacity: 0.78 }}>
                Aucune réunion programmée
              </div>
            ) : futureMeetings.map((m) => (
              <div key={m.id} style={{ borderRadius: "20px", padding: "18px", background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.035))", border: "1px solid rgba(255,255,255,0.08)", display: "grid", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <div>
                    <div style={{ fontSize: "18px", fontWeight: 800 }}>{m.title}</div>
                    <div style={{ opacity: 0.72, marginTop: "6px" }}>{prettyDate(m.startsAt)} → {prettyDate(m.endsAt)}</div>
                  </div>
                  <div style={{ height: "42px", minWidth: "42px", borderRadius: "999px", background: "rgba(99,102,241,0.18)", border: "1px solid rgba(139,163,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                    {initials(m.title)}
                  </div>
                </div>
                <div style={{ opacity: 0.74 }}>{m.invitees.map((i) => i.email).join(", ") || "Aucun invité"}</div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button onClick={() => copyLink(m.joinLink)} style={{ height: "40px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.08)", padding: "0 14px", background: "rgba(255,255,255,0.05)", color: "white", fontWeight: 700, cursor: "pointer" }}>Copier le lien</button>
                  <button onClick={() => sendInvites(m.id)} style={{ height: "40px", borderRadius: "999px", border: "1px solid rgba(139,163,255,0.18)", padding: "0 14px", background: "rgba(99,102,241,0.16)", color: "white", fontWeight: 700, cursor: "pointer" }}>Inviter</button>
                  <button onClick={() => window.open(m.joinLink, "_blank")} style={{ height: "40px", borderRadius: "999px", border: "0", padding: "0 14px", background: "linear-gradient(135deg, #6d74ff, #7c3aed)", color: "white", fontWeight: 800, cursor: "pointer" }}>Démarrer</button>
                  <button onClick={() => deleteMeeting(m.id)} style={{ height: "40px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.08)", padding: "0 14px", background: "rgba(220,38,38,0.16)", color: "white", fontWeight: 700, cursor: "pointer" }}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Past */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
            <div>
              <div style={{ fontSize: "24px", fontWeight: 800 }}>Réunions passées</div>
              <div style={{ opacity: 0.68, marginTop: "6px" }}>Historique de tes précédentes sessions.</div>
            </div>
            <div style={{ fontWeight: 800, color: "#b9c6ff" }}>{pastMeetings.length}</div>
          </div>
          <div style={{ display: "grid", gap: "14px" }}>
            {pastMeetings.length === 0 ? (
              <div style={{ borderRadius: "18px", padding: "18px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", opacity: 0.78 }}>
                Aucune réunion passée
              </div>
            ) : pastMeetings.map((m) => (
              <div key={m.id} style={{ borderRadius: "20px", padding: "18px", background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.035))", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: "18px", fontWeight: 800 }}>{m.title}</div>
                <div style={{ opacity: 0.72, marginTop: "8px" }}>{prettyDate(m.startsAt)}</div>
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
    <Suspense fallback={null}>
      <MeetingsPageInner />
    </Suspense>
  );
}
