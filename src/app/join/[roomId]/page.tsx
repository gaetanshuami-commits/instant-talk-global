"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";

type MeetingInfo = {
  id: string;
  title: string;
  hostEmail: string;
  status: string;
  startsAt: string;
  endsAt: string;
  hostPresent: boolean;
};

function pretty(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });
}

function JoinInner() {
  const params      = useParams<{ roomId: string }>();
  const searchParams = useSearchParams();
  const roomId  = params?.roomId ?? "";
  const token   = searchParams?.get("t") ?? "";

  const [state, setState] = useState<"loading" | "ready" | "ended" | "invalid" | "expired">("loading");
  const [meeting, setMeeting] = useState<MeetingInfo | null>(null);
  const [joining,  setJoining]  = useState(false);

  useEffect(() => {
    if (!roomId || !token) { setState("invalid"); return; }
    fetch(`/api/meetings/guest-token?roomId=${encodeURIComponent(roomId)}&t=${encodeURIComponent(token)}`)
      .then(async r => {
        const d = await r.json();
        if (!r.ok) {
          if (d.error === "meeting_expired" || d.error === "meeting_cancelled") setState("expired");
          else setState("invalid");
          return;
        }
        const m: MeetingInfo = d.meeting;
        if (m.status === "CANCELLED" || m.status === "ENDED") { setState("ended"); return; }
        setMeeting(m);
        setState("ready");
      })
      .catch(() => setState("invalid"));
  }, [roomId, token]);

  function joinRoom() {
    setJoining(true);
    window.location.href = `/room/${roomId}?guest=1&t=${encodeURIComponent(token)}`;
  }

  /* ── Styles ── */
  const wrap: React.CSSProperties = {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "linear-gradient(135deg,#06060a 0%,#0d1120 60%,#090f1e 100%)",
    fontFamily: "system-ui, sans-serif", color: "#fff", padding: 24,
  };
  const card: React.CSSProperties = {
    maxWidth: 480, width: "100%", borderRadius: 28,
    padding: "40px 36px",
    background: "linear-gradient(180deg,rgba(20,28,52,.98),rgba(10,16,31,.95))",
    border: "1px solid rgba(255,255,255,.1)",
    boxShadow: "0 40px 100px rgba(0,0,0,.5)",
  };

  if (state === "loading") return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ textAlign: "center", opacity: .6 }}>Vérification du lien…</div>
      </div>
    </div>
  );

  if (state === "invalid") return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ fontSize: 40, marginBottom: 12, textAlign: "center" }}>🔒</div>
        <div style={{ fontSize: 22, fontWeight: 800, textAlign: "center", marginBottom: 8 }}>Lien invalide</div>
        <div style={{ opacity: .65, textAlign: "center", fontSize: 15 }}>
          Ce lien de réunion est invalide ou a expiré.
        </div>
        <a href="/" style={{ display: "block", marginTop: 28, height: 48, lineHeight: "48px", textAlign: "center", borderRadius: 999, background: "rgba(255,255,255,.08)", color: "#fff", textDecoration: "none", fontWeight: 700 }}>
          Retour à l&apos;accueil
        </a>
      </div>
    </div>
  );

  if (state === "expired" || state === "ended") return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ fontSize: 40, marginBottom: 12, textAlign: "center" }}>📴</div>
        <div style={{ fontSize: 22, fontWeight: 800, textAlign: "center", marginBottom: 8 }}>Session terminée</div>
        <div style={{ opacity: .65, textAlign: "center", fontSize: 15, lineHeight: 1.6 }}>
          La session est terminée. Créez votre propre réunion pour continuer.
        </div>
        <a href="/" style={{ display: "block", marginTop: 28, height: 48, lineHeight: "48px", textAlign: "center", borderRadius: 999, background: "linear-gradient(135deg,#6366f1,#7c3aed)", color: "#fff", textDecoration: "none", fontWeight: 700 }}>
          Créer une réunion
        </a>
      </div>
    </div>
  );

  if (!meeting) return null;

  const isScheduled = meeting.status === "SCHEDULED" && new Date(meeting.startsAt) > new Date();

  return (
    <div style={wrap}>
      <div style={card}>
        {/* Logo / branding */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, opacity: .5, letterSpacing: ".08em", textTransform: "uppercase" }}>
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}><path d="M3.5 7A1.5 1.5 0 002 8.5v5A1.5 1.5 0 003.5 15h8A1.5 1.5 0 0013 13.5v-1.3l2.15 1.43A.75.75 0 0016.5 13V9a.75.75 0 00-1.35-.45L13 9.9V8.5A1.5 1.5 0 0011.5 7h-8z"/></svg>
            instant-talk
          </div>
        </div>

        {/* Meeting title */}
        <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: 6 }}>
          {meeting.title}
        </div>
        <div style={{ opacity: .55, fontSize: 14, marginBottom: 28 }}>
          Organisé par {meeting.hostEmail}
        </div>

        {/* Meeting info */}
        <div style={{ borderRadius: 16, padding: "16px 20px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", marginBottom: 24, display: "grid", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <span style={{ opacity: .6 }}>Début</span>
            <span style={{ fontWeight: 700 }}>{pretty(meeting.startsAt)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <span style={{ opacity: .6 }}>Fin</span>
            <span style={{ fontWeight: 700 }}>{pretty(meeting.endsAt)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <span style={{ opacity: .6 }}>Statut</span>
            <span style={{
              fontWeight: 700,
              color: meeting.hostPresent ? "#4ade80" : meeting.status === "LIVE" ? "#fbbf24" : "#94a3b8"
            }}>
              {meeting.hostPresent ? "● Host présent" : meeting.status === "LIVE" ? "● En attente du host" : meeting.status === "SCHEDULED" ? "Planifiée" : meeting.status}
            </span>
          </div>
        </div>

        {/* Scheduled notice */}
        {isScheduled && (
          <div style={{ borderRadius: 12, padding: "12px 16px", background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.2)", fontSize: 14, color: "#fbbf24", marginBottom: 20 }}>
            ⏰ Réunion planifiée — vous pouvez rejoindre dès maintenant pour attendre le début.
          </div>
        )}

        {/* Join button */}
        <button
          onClick={joinRoom}
          disabled={joining}
          style={{
            width: "100%", height: 54, borderRadius: 999, border: 0,
            background: joining ? "rgba(255,255,255,.1)" : "linear-gradient(135deg,#2563eb,#4f46e5)",
            color: joining ? "rgba(255,255,255,.4)" : "#fff",
            fontWeight: 800, fontSize: 17, cursor: joining ? "not-allowed" : "pointer",
            boxShadow: joining ? "none" : "0 12px 40px rgba(37,99,235,.4)",
            transition: "all .2s",
          }}
        >
          {joining ? "Connexion…" : "Rejoindre la réunion"}
        </button>

        <div style={{ textAlign: "center", marginTop: 16, opacity: .4, fontSize: 12 }}>
          Accès invité gratuit · Aucun abonnement requis
        </div>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#06060a", color: "#fff" }}>
        Chargement…
      </div>
    }>
      <JoinInner />
    </Suspense>
  );
}
