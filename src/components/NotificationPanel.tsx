"use client";

/**
 * Notification Panel — cloche dans le dashboard topbar
 * Affiche les réunions à venir dans les 24h
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Video, Calendar, ArrowRight, X, Check } from "lucide-react";

type Meeting = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  invitees: { id: string; email: string; status: string }[];
  joinLink: string;
};

function timeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return "En cours";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Dans ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Dans ${hrs}h`;
  return `Dans ${Math.floor(hrs / 24)}j`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function NotificationPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [read, setRead] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/meetings")
      .then((r) => r.json())
      .then((d) => {
        const upcoming = (d.meetings ?? [])
          .filter((m: Meeting) => new Date(m.startsAt).getTime() > Date.now() - 3600000)
          .sort((a: Meeting, b: Meeting) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
          .slice(0, 8);
        setMeetings(upcoming);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = meetings.filter((m) => !read.has(m.id)).length;

  function markAll() {
    setRead(new Set(meetings.map((m) => m.id)));
  }

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "34px", height: "34px", borderRadius: "10px",
          background: open ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)",
          border: open ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", position: "relative", transition: "all 0.15s",
        }}
      >
        <Bell size={15} style={{ color: open ? "#a5b4fc" : "rgba(255,255,255,0.65)" }} />
        {unread > 0 && (
          <span style={{
            position: "absolute", top: "6px", right: "6px",
            width: unread > 9 ? "14px" : "8px", height: "8px",
            borderRadius: "999px",
            background: "#6366f1",
            border: "1.5px solid #04070f",
            boxShadow: "0 0 6px rgba(99,102,241,0.7)",
            fontSize: "8px", color: "white", fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
            lineHeight: 1,
          }}>
            {unread > 9 ? "9+" : ""}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 10px)", right: 0,
          width: "340px", borderRadius: "18px",
          background: "rgba(6,10,22,0.98)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
          backdropFilter: "blur(40px)",
          zIndex: 500, overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Bell size={14} style={{ color: "#818cf8" }} />
            <span style={{ fontWeight: 700, fontSize: "14px" }}>Notifications</span>
            {unread > 0 && (
              <span style={{ height: "18px", padding: "0 7px", borderRadius: "999px", background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", fontSize: "11px", fontWeight: 800, display: "flex", alignItems: "center" }}>
                {unread}
              </span>
            )}
            <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
              {unread > 0 && (
                <button onClick={markAll} title="Tout marquer lu" style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: "2px", display: "flex" }}>
                  <Check size={14} />
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: "2px", display: "flex" }}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Items */}
          <div style={{ maxHeight: "360px", overflowY: "auto" }}>
            {meetings.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", opacity: 0.45 }}>
                <Calendar size={28} style={{ marginBottom: "10px", margin: "0 auto 10px" }} />
                <div style={{ fontSize: "13px" }}>Aucune réunion à venir</div>
              </div>
            ) : (
              meetings.map((m) => {
                const isUnread = !read.has(m.id);
                const isImminent = new Date(m.startsAt).getTime() - Date.now() < 30 * 60000;
                return (
                  <div
                    key={m.id}
                    onClick={() => { setRead((r) => new Set([...r, m.id])); router.push(m.joinLink); setOpen(false); }}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      cursor: "pointer",
                      background: isUnread ? "rgba(99,102,241,0.05)" : "transparent",
                      display: "flex", alignItems: "flex-start", gap: "12px",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = isUnread ? "rgba(99,102,241,0.05)" : "transparent")}
                  >
                    <div style={{
                      width: "34px", height: "34px", borderRadius: "9px",
                      background: isImminent ? "rgba(239,68,68,0.15)" : "rgba(99,102,241,0.15)",
                      border: `1px solid ${isImminent ? "rgba(239,68,68,0.25)" : "rgba(99,102,241,0.25)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <Video size={14} style={{ color: isImminent ? "#f87171" : "#a5b4fc" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</div>
                      <div style={{ fontSize: "12px", opacity: 0.55, marginTop: "2px" }}>
                        {formatTime(m.startsAt)} · {m.invitees.length} invité(s)
                      </div>
                      <div style={{ fontSize: "11px", fontWeight: 700, marginTop: "4px", color: isImminent ? "#f87171" : "#818cf8" }}>
                        {timeUntil(m.startsAt)}
                      </div>
                    </div>
                    {isUnread && <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#6366f1", flexShrink: 0, marginTop: "6px", boxShadow: "0 0 6px rgba(99,102,241,0.7)" }} />}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <button
              onClick={() => { router.push("/dashboard/meetings"); setOpen(false); }}
              style={{ width: "100%", height: "34px", borderRadius: "9px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              Voir toutes les réunions <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
