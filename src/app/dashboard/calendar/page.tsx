"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ChevronLeft, ChevronRight, Plus, Clock, Users, Video } from "lucide-react";

type Meeting = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  status: string;
  invitees: { id: string; email: string; status: string }[];
  joinLink: string;
};

const CARD = {
  borderRadius: "22px",
  border: "1px solid rgba(255,255,255,0.07)",
  background: "linear-gradient(145deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.018) 100%)",
  backdropFilter: "blur(20px)",
  boxShadow:
    "0 2px 4px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.45), 0 28px 56px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.07)",
};

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  // Convert Sunday=0 to Monday=0 system
  const startOffset = (firstDay === 0 ? 6 : firstDay - 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { startOffset, daysInMonth };
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "#6366f1",
  LIVE: "#22c55e",
  ENDED: "rgba(255,255,255,0.3)",
  CANCELLED: "#ef4444",
};

export default function CalendarPage() {
  const today = new Date();
  const { t } = useLanguage();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<Date>(today);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    fetch("/api/meetings")
      .then((r) => r.json())
      .then((d) => setMeetings(d.meetings || []))
      .catch(() => {});
  }, []);

  const { startOffset, daysInMonth } = getMonthDays(year, month);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const meetingsForDay = (day: number) => {
    const d = new Date(year, month, day);
    return meetings.filter((m) => sameDay(new Date(m.startsAt), d));
  };

  const selectedMeetings = meetings.filter((m) =>
    sameDay(new Date(m.startsAt), selected)
  ).sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  // Build grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <div style={{ fontSize: "12px", letterSpacing: "0.16em", opacity: 0.5, marginBottom: "7px", fontWeight: 600 }}>
            CALENDRIER
          </div>
          <h1 style={{ fontSize: "36px", fontWeight: 900, letterSpacing: "-0.04em", margin: 0, lineHeight: 1 }}>
            {MONTHS_FR[month]} {year}
          </h1>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button onClick={prevMonth} style={{ width: "38px", height: "38px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelected(today); }}
            style={{ height: "38px", padding: "0 16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}
          >
            {t("dash.today")}
          </button>
          <button onClick={nextMonth} style={{ width: "38px", height: "38px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronRight size={16} />
          </button>
          <Link
            href={`/dashboard/meetings?date=${selected.toISOString().slice(0, 10)}`}
            style={{ textDecoration: "none" }}
          >
            <div style={{ height: "38px", padding: "0 16px", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #7c3aed)", color: "white", fontWeight: 700, fontSize: "13px", display: "flex", alignItems: "center", gap: "7px", boxShadow: "0 6px 24px rgba(99,102,241,0.4)", cursor: "pointer" }}>
              <Plus size={14} />
              {t("dash.schedule")}
            </div>
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "16px", alignItems: "start" }}>
        {/* Calendar grid */}
        <div style={{ ...CARD, padding: "24px" }}>
          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: "8px" }}>
            {DAYS_FR.map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: "12px", fontWeight: 700, opacity: 0.45, letterSpacing: "0.08em", padding: "6px 0" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
            {cells.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;

              const cellDate = new Date(year, month, day);
              const isToday = sameDay(cellDate, today);
              const isSelected = sameDay(cellDate, selected);
              const dayMeetings = meetingsForDay(day);
              const isPast = cellDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());

              return (
                <div
                  key={day}
                  onClick={() => setSelected(cellDate)}
                  style={{
                    borderRadius: "12px",
                    padding: "8px 6px",
                    cursor: "pointer",
                    background: isSelected
                      ? "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(99,102,241,0.08))"
                      : isToday
                      ? "rgba(99,102,241,0.1)"
                      : "transparent",
                    border: isSelected
                      ? "1px solid rgba(99,102,241,0.4)"
                      : isToday
                      ? "1px solid rgba(99,102,241,0.2)"
                      : "1px solid transparent",
                    transition: "all 0.12s ease",
                    minHeight: "72px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: isToday || isSelected ? 800 : 500,
                      color: isToday ? "#a5b4fc" : isSelected ? "#c7d2fe" : isPast ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.85)",
                      marginBottom: "4px",
                    }}
                  >
                    {day}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", marginTop: "auto" }}>
                    {dayMeetings.slice(0, 3).map((m) => (
                      <div
                        key={m.id}
                        style={{
                          height: "5px",
                          borderRadius: "999px",
                          background: STATUS_COLORS[m.status] || "#6366f1",
                          flex: "1 1 auto",
                          maxWidth: "100%",
                          minWidth: "12px",
                        }}
                      />
                    ))}
                    {dayMeetings.length > 3 && (
                      <div style={{ fontSize: "9px", opacity: 0.55, fontWeight: 700 }}>+{dayMeetings.length - 3}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected day panel */}
        <div style={{ display: "grid", gap: "12px" }}>
          <div style={{ ...CARD, padding: "20px" }}>
            <div style={{ fontWeight: 800, fontSize: "16px", marginBottom: "4px" }}>
              {selected.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </div>
            <div style={{ fontSize: "12px", opacity: 0.5, marginBottom: "18px" }}>
              {selectedMeetings.length} réunion(s)
            </div>

            {selectedMeetings.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", opacity: 0.45 }}>
                <Clock size={28} style={{ margin: "0 auto 10px", opacity: 0.4 }} />
                <div style={{ fontSize: "13px", marginBottom: "14px" }}>{t("dash.noMeetings")}</div>
                <Link
                  href={`/dashboard/meetings?date=${selected.toISOString().slice(0, 10)}`}
                  style={{ textDecoration: "none" }}
                >
                  <div style={{ height: "32px", borderRadius: "999px", background: "linear-gradient(135deg, #6366f1, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontWeight: 700, fontSize: "12px", opacity: 1, boxShadow: "0 4px 14px rgba(99,102,241,0.35)", padding: "0 14px" }}>
                    <Plus size={12} />
                    Programmer pour ce jour
                  </div>
                </Link>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "10px" }}>
                {selectedMeetings.map((m) => {
                  const color = STATUS_COLORS[m.status] || "#6366f1";
                  return (
                    <div
                      key={m.id}
                      style={{
                        borderRadius: "14px",
                        padding: "14px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderLeft: `3px solid ${color}`,
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "6px" }}>{m.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", opacity: 0.6, marginBottom: "4px" }}>
                        <Clock size={11} />
                        {formatTime(m.startsAt)} → {formatTime(m.endsAt)}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", opacity: 0.6, marginBottom: "12px" }}>
                        <Users size={11} />
                        {m.invitees.length} participant(s)
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <a href={m.joinLink} target="_blank" rel="noreferrer" style={{ textDecoration: "none", flex: 1 }}>
                          <div style={{ height: "32px", borderRadius: "999px", background: "linear-gradient(135deg, #6366f1, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontWeight: 700, fontSize: "12px", boxShadow: "0 4px 14px rgba(99,102,241,0.35)" }}>
                            <Video size={12} />
                            {t("dash.join")}
                          </div>
                        </a>
                        <button
                          onClick={() => navigator.clipboard.writeText(m.joinLink)}
                          title="Copier le lien"
                          style={{ height: "32px", width: "32px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mini stats */}
          <div style={{ ...CARD, padding: "18px" }}>
            <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "14px", opacity: 0.8 }}>{t("dash.thisMonth")}</div>
            {[
              { label: t("dash.totalScheduled"), value: meetings.filter(m => new Date(m.startsAt).getMonth() === month && new Date(m.startsAt).getFullYear() === year).length },
              { label: t("dash.past"), value: meetings.filter(m => new Date(m.startsAt).getMonth() === month && new Date(m.startsAt).getFullYear() === year && new Date(m.endsAt) < today).length },
              { label: t("dash.upcoming"), value: meetings.filter(m => new Date(m.startsAt).getMonth() === month && new Date(m.startsAt).getFullYear() === year && new Date(m.startsAt) > today).length },
            ].map((s) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: "13px", opacity: 0.6 }}>{s.label}</span>
                <span style={{ fontWeight: 800, fontSize: "18px" }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
