"use client";

import { useEffect, useMemo, useState } from "react";

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
  createdAt?: string;
  updatedAt?: string;
  invitees: { id: string; email: string; status: string }[];
  reminders?: { id: string; remindAt: string; sentAt?: string | null }[];
  joinLink: string;
};

function formatInputDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatPretty(date: string) {
  return new Date(date).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function initials(value: string) {
  return value
    .split(" ")
    .map((v) => v[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hostEmail, setHostEmail] = useState("");
  const [invitees, setInvitees] = useState("");
  const [startsAt, setStartsAt] = useState(formatInputDate(new Date(Date.now() + 60 * 60 * 1000)));
  const [endsAt, setEndsAt] = useState(formatInputDate(new Date(Date.now() + 2 * 60 * 60 * 1000)));
  const [createdLink, setCreatedLink] = useState("");
  const [status, setStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [apiReady, setApiReady] = useState(true);

  async function loadMeetings() {
    try {
      const res = await fetch("/api/meetings");
      const text = await res.text();
      const data = text ? JSON.parse(text) : { meetings: [], prismaReady: false };
      setMeetings(data.meetings || []);
      setApiReady(data.prismaReady !== false);
    } catch {
      setMeetings([]);
      setApiReady(false);
    }
  }

  useEffect(() => {
    loadMeetings();
  }, []);

  const futureMeetings = useMemo(
    () => meetings.filter((m) => new Date(m.endsAt).getTime() >= Date.now()),
    [meetings]
  );

  const pastMeetings = useMemo(
    () => meetings.filter((m) => new Date(m.endsAt).getTime() < Date.now()),
    [meetings]
  );

  const todayMeetings = useMemo(
    () =>
      meetings.filter((m) => {
        const d = new Date(m.startsAt).toISOString().slice(0, 10);
        return d === selectedDate;
      }),
    [meetings, selectedDate]
  );

  async function createMeeting() {
    setStatus("Création en cours...");

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
          invitees: invitees
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean),
        }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (!res.ok) {
        setStatus("Impossible de créer la réunion pour le moment");
        return;
      }

      setCreatedLink(data.joinLink || "");
      setStatus("Réunion programmée avec succès");
      setTitle("");
      setDescription("");
      setHostEmail("");
      setInvitees("");
      await loadMeetings();
    } catch {
      setStatus("Erreur réseau ou API");
    }
  }

  async function copyLink(joinLink: string) {
    await navigator.clipboard.writeText(joinLink);
    setStatus("Lien copié");
  }

  async function sendInvites(id: string) {
    setStatus("Envoi des invitations...");
    try {
      const res = await fetch(`/api/meetings/${id}/invite`, { method: "POST" });
      if (!res.ok) {
        setStatus("Impossible d’envoyer les invitations");
        return;
      }
      setStatus("Invitations envoyées");
      await loadMeetings();
    } catch {
      setStatus("Erreur envoi invitations");
    }
  }

  async function deleteMeeting(id: string) {
    try {
      await fetch(`/api/meetings/${id}`, { method: "DELETE" });
      setStatus("Réunion supprimée");
      await loadMeetings();
    } catch {
      setStatus("Erreur suppression");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(87,114,255,0.18), transparent 22%), radial-gradient(circle at top right, rgba(20,184,166,0.14), transparent 18%), linear-gradient(180deg, #060b16 0%, #09111f 46%, #0a1220 100%)",
        color: "white",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "270px 1fr", minHeight: "100vh" }}>
        <aside
          style={{
            borderRight: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(7,12,24,0.72)",
            backdropFilter: "blur(18px)",
            padding: "28px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <div>
            <div style={{ fontSize: "13px", letterSpacing: "0.18em", opacity: 0.65, marginBottom: "10px" }}>
              INSTANT TALK GLOBAL
            </div>
            <div style={{ fontSize: "28px", fontWeight: 800, lineHeight: 1.05 }}>
              Meetings
              <div style={{ color: "#8ba3ff" }}>Workspace</div>
            </div>
          </div>

          <div
            style={{
              background: "linear-gradient(180deg, rgba(99,102,241,0.2), rgba(99,102,241,0.08))",
              border: "1px solid rgba(139,163,255,0.22)",
              borderRadius: "20px",
              padding: "16px",
            }}
          >
            <div style={{ fontSize: "12px", opacity: 0.75, marginBottom: "8px" }}>Planification premium</div>
            <div style={{ fontSize: "22px", fontWeight: 800, marginBottom: "8px" }}>Plus simple que Meet</div>
            <div style={{ fontSize: "14px", opacity: 0.8, lineHeight: 1.5 }}>
              Crée des sessions, génère des liens, invite tes participants et pilote tout depuis un seul espace.
            </div>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            {[
              "Vue d’ensemble",
              "Réunions à venir",
              "Historique",
              "Calendrier",
              "Invitations",
              "Salles sécurisées",
            ].map((item, i) => (
              <div
                key={item}
                style={{
                  height: "46px",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 14px",
                  borderRadius: "14px",
                  background: i === 0 ? "rgba(99,102,241,0.18)" : "transparent",
                  border: i === 0 ? "1px solid rgba(139,163,255,0.22)" : "1px solid transparent",
                  color: i === 0 ? "#dfe5ff" : "rgba(255,255,255,0.72)",
                  fontWeight: 600,
                }}
              >
                {item}
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: "auto",
              padding: "16px",
              borderRadius: "18px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ fontSize: "13px", opacity: 0.7, marginBottom: "8px" }}>Statut backend</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: apiReady ? "#86efac" : "#fca5a5" }}>
              {apiReady ? "API réunions prête" : "API réunions à finaliser"}
            </div>
          </div>
        </aside>

        <main style={{ padding: "28px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "24px",
              gap: "16px",
            }}
          >
            <div>
              <div style={{ fontSize: "42px", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>
                Planification & calendrier
              </div>
              <div style={{ marginTop: "10px", opacity: 0.72, fontSize: "16px" }}>
                Un cockpit de réunion plus premium, plus net et plus crédible.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  height: "44px",
                  padding: "0 16px",
                  borderRadius: "999px",
                  display: "flex",
                  alignItems: "center",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontWeight: 700,
                }}
              >
                {futureMeetings.length} à venir
              </div>
              <div
                style={{
                  height: "44px",
                  padding: "0 16px",
                  borderRadius: "999px",
                  display: "flex",
                  alignItems: "center",
                  background: "linear-gradient(135deg, #6d74ff, #7c3aed)",
                  fontWeight: 800,
                  boxShadow: "0 18px 40px rgba(92,99,255,0.32)",
                }}
              >
                Workspace premium
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
            {[
              { label: "Réunions futures", value: String(futureMeetings.length) },
              { label: "Réunions passées", value: String(pastMeetings.length) },
              { label: "Sessions du jour", value: String(todayMeetings.length) },
              { label: "Invités estimés", value: String(meetings.reduce((a, m) => a + m.invitees.length, 0)) },
            ].map((card) => (
              <div
                key={card.label}
                style={{
                  borderRadius: "22px",
                  padding: "20px",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.035))",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.18)",
                }}
              >
                <div style={{ fontSize: "13px", opacity: 0.7, marginBottom: "10px" }}>{card.label}</div>
                <div style={{ fontSize: "34px", fontWeight: 900, letterSpacing: "-0.04em" }}>{card.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: "18px", marginBottom: "18px" }}>
            <section
              style={{
                borderRadius: "28px",
                padding: "24px",
                background: "linear-gradient(180deg, rgba(14,20,38,0.96), rgba(10,16,31,0.95))",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 30px 80px rgba(0,0,0,0.24)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                <div>
                  <div style={{ fontSize: "26px", fontWeight: 800 }}>Programmer une réunion</div>
                  <div style={{ opacity: 0.68, marginTop: "6px" }}>
                    Crée une session premium avec lien sécurisé, invités et calendrier.
                  </div>
                </div>
                <div
                  style={{
                    height: "42px",
                    padding: "0 14px",
                    borderRadius: "999px",
                    background: "rgba(99,102,241,0.14)",
                    border: "1px solid rgba(139,163,255,0.2)",
                    display: "flex",
                    alignItems: "center",
                    fontWeight: 700,
                    color: "#cfd8ff",
                  }}
                >
                  Nouveau rendez-vous
                </div>
              </div>

              <div style={{ display: "grid", gap: "14px" }}>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de la réunion" style={{ height: "54px", borderRadius: "16px", padding: "0 16px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "white", fontSize: "15px" }} />
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description, objectif, ordre du jour..." style={{ minHeight: "120px", borderRadius: "16px", padding: "16px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "white", fontSize: "15px", resize: "vertical" }} />
                <input value={hostEmail} onChange={(e) => setHostEmail(e.target.value)} placeholder="Email organisateur" style={{ height: "54px", borderRadius: "16px", padding: "0 16px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "white", fontSize: "15px" }} />
                <input value={invitees} onChange={(e) => setInvitees(e.target.value)} placeholder="Invités séparés par virgule" style={{ height: "54px", borderRadius: "16px", padding: "0 16px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "white", fontSize: "15px" }} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} style={{ height: "54px", borderRadius: "16px", padding: "0 16px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "white", fontSize: "15px" }} />
                  <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} style={{ height: "54px", borderRadius: "16px", padding: "0 16px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "white", fontSize: "15px" }} />
                </div>

                <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    onClick={createMeeting}
                    style={{
                      height: "54px",
                      padding: "0 22px",
                      borderRadius: "999px",
                      border: "0",
                      background: "linear-gradient(135deg, #6d74ff, #7c3aed)",
                      color: "white",
                      fontWeight: 800,
                      cursor: "pointer",
                      boxShadow: "0 18px 40px rgba(92,99,255,0.32)",
                    }}
                  >
                    Programmer une réunion
                  </button>

                  <div
                    style={{
                      height: "54px",
                      padding: "0 18px",
                      borderRadius: "999px",
                      display: "flex",
                      alignItems: "center",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.76)",
                      fontWeight: 600,
                    }}
                  >
                    {status || "Prêt"}
                  </div>
                </div>

                {createdLink ? (
                  <div
                    style={{
                      marginTop: "4px",
                      borderRadius: "18px",
                      padding: "16px",
                      background: "linear-gradient(180deg, rgba(99,102,241,0.12), rgba(99,102,241,0.05))",
                      border: "1px solid rgba(139,163,255,0.18)",
                    }}
                  >
                    <div style={{ fontWeight: 800, marginBottom: "8px" }}>Lien généré</div>
                    <div style={{ wordBreak: "break-all", opacity: 0.86 }}>{createdLink}</div>
                  </div>
                ) : null}
              </div>
            </section>

            <section
              style={{
                borderRadius: "28px",
                padding: "24px",
                background: "linear-gradient(180deg, rgba(14,20,38,0.96), rgba(10,16,31,0.95))",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 30px 80px rgba(0,0,0,0.24)",
                display: "grid",
                alignContent: "start",
                gap: "18px",
              }}
            >
              <div>
                <div style={{ fontSize: "26px", fontWeight: 800 }}>Calendrier</div>
                <div style={{ opacity: 0.68, marginTop: "6px" }}>
                  Vue rapide des sessions du jour.
                </div>
              </div>

              <div
                style={{
                  borderRadius: "20px",
                  padding: "18px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    width: "100%",
                    height: "50px",
                    borderRadius: "14px",
                    padding: "0 14px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.04)",
                    color: "white",
                    fontSize: "15px",
                  }}
                />
              </div>

              <div style={{ display: "grid", gap: "12px" }}>
                {todayMeetings.length === 0 ? (
                  <div
                    style={{
                      borderRadius: "18px",
                      padding: "18px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      opacity: 0.78,
                    }}
                  >
                    Aucune réunion à cette date
                  </div>
                ) : (
                  todayMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      style={{
                        borderRadius: "18px",
                        padding: "18px",
                        background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.035))",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: "16px" }}>{meeting.title}</div>
                      <div style={{ opacity: 0.72, marginTop: "6px" }}>{formatPretty(meeting.startsAt)}</div>
                      <div style={{ opacity: 0.72, marginTop: "4px" }}>{meeting.invitees.length} invité(s)</div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
            <section
              style={{
                borderRadius: "28px",
                padding: "24px",
                background: "linear-gradient(180deg, rgba(14,20,38,0.96), rgba(10,16,31,0.95))",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 30px 80px rgba(0,0,0,0.24)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                <div>
                  <div style={{ fontSize: "24px", fontWeight: 800 }}>Réunions futures</div>
                  <div style={{ opacity: 0.68, marginTop: "6px" }}>Les prochains rendez-vous planifiés.</div>
                </div>
                <div style={{ fontWeight: 800, color: "#b9c6ff" }}>{futureMeetings.length}</div>
              </div>

              <div style={{ display: "grid", gap: "14px" }}>
                {futureMeetings.length === 0 ? (
                  <div
                    style={{
                      borderRadius: "18px",
                      padding: "18px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      opacity: 0.78,
                    }}
                  >
                    Aucune réunion programmée
                  </div>
                ) : (
                  futureMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      style={{
                        borderRadius: "20px",
                        padding: "18px",
                        background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.035))",
                        border: "1px solid rgba(255,255,255,0.08)",
                        display: "grid",
                        gap: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                        <div>
                          <div style={{ fontSize: "18px", fontWeight: 800 }}>{meeting.title}</div>
                          <div style={{ opacity: 0.72, marginTop: "6px" }}>
                            {formatPretty(meeting.startsAt)} → {formatPretty(meeting.endsAt)}
                          </div>
                        </div>
                        <div
                          style={{
                            height: "42px",
                            minWidth: "42px",
                            borderRadius: "999px",
                            background: "rgba(99,102,241,0.18)",
                            border: "1px solid rgba(139,163,255,0.18)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                          }}
                        >
                          {initials(meeting.title)}
                        </div>
                      </div>

                      <div style={{ opacity: 0.74 }}>
                        {meeting.invitees.map((i) => i.email).join(", ") || "Aucun invité"}
                      </div>

                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <button onClick={() => copyLink(meeting.joinLink)} style={{ height: "40px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.08)", padding: "0 14px", background: "rgba(255,255,255,0.05)", color: "white", fontWeight: 700, cursor: "pointer" }}>
                          Copier le lien réunion
                        </button>
                        <button onClick={() => sendInvites(meeting.id)} style={{ height: "40px", borderRadius: "999px", border: "1px solid rgba(139,163,255,0.18)", padding: "0 14px", background: "rgba(99,102,241,0.16)", color: "white", fontWeight: 700, cursor: "pointer" }}>
                          Inviter
                        </button>
                        <button onClick={() => window.open(meeting.joinLink, "_blank")} style={{ height: "40px", borderRadius: "999px", border: "0", padding: "0 14px", background: "linear-gradient(135deg, #6d74ff, #7c3aed)", color: "white", fontWeight: 800, cursor: "pointer" }}>
                          Démarrer
                        </button>
                        <button onClick={() => deleteMeeting(meeting.id)} style={{ height: "40px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.08)", padding: "0 14px", background: "rgba(220,38,38,0.16)", color: "white", fontWeight: 700, cursor: "pointer" }}>
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section
              style={{
                borderRadius: "28px",
                padding: "24px",
                background: "linear-gradient(180deg, rgba(14,20,38,0.96), rgba(10,16,31,0.95))",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 30px 80px rgba(0,0,0,0.24)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                <div>
                  <div style={{ fontSize: "24px", fontWeight: 800 }}>Réunions passées</div>
                  <div style={{ opacity: 0.68, marginTop: "6px" }}>Historique de tes précédentes sessions.</div>
                </div>
                <div style={{ fontWeight: 800, color: "#b9c6ff" }}>{pastMeetings.length}</div>
              </div>

              <div style={{ display: "grid", gap: "14px" }}>
                {pastMeetings.length === 0 ? (
                  <div
                    style={{
                      borderRadius: "18px",
                      padding: "18px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      opacity: 0.78,
                    }}
                  >
                    Aucune réunion passée
                  </div>
                ) : (
                  pastMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      style={{
                        borderRadius: "20px",
                        padding: "18px",
                        background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.035))",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div style={{ fontSize: "18px", fontWeight: 800 }}>{meeting.title}</div>
                      <div style={{ opacity: 0.72, marginTop: "8px" }}>{formatPretty(meeting.startsAt)}</div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}


