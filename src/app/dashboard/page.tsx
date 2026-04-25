"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  Video, Globe, Users, Mic, Calendar, Film, ArrowRight,
  Clock, Zap, TrendingUp, Shield, Star,
} from "lucide-react";

type Meeting = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  invitees: { id: string; email: string; status: string }[];
  joinLink?: string;
  roomId?: string;
  status: string;
};

const CARD = {
  borderRadius: "22px",
  border: "1px solid rgba(255,255,255,0.07)",
  background: "linear-gradient(145deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.018) 100%)",
  backdropFilter: "blur(20px)",
  boxShadow:
    "0 2px 4px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.45), 0 28px 56px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.07)",
  padding: "24px",
};

const PILL = {
  height: "30px",
  padding: "0 12px",
  borderRadius: "999px",
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  fontWeight: 700,
  fontSize: "12px",
};

export default function Dashboard() {
  const router = useRouter();
  const { lang, t } = useLanguage();
  const [joinId, setJoinId] = useState("");
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  function formatTime(d: string) {
    return new Date(d).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" });
  }
  function formatDate(d: string) {
    return new Date(d).toLocaleDateString(lang, { day: "numeric", month: "long" });
  }

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return lang === "fr" ? "Bonjour" : lang === "es" ? "Buenos días" : lang === "de" ? "Guten Morgen" : "Good morning";
    if (h < 18) return lang === "fr" ? "Bonjour" : lang === "es" ? "Buenas tardes" : lang === "de" ? "Guten Tag" : "Good afternoon";
    return lang === "fr" ? "Bonsoir" : lang === "es" ? "Buenas noches" : lang === "de" ? "Guten Abend" : "Good evening";
  }

  useEffect(() => {
    fetch("/api/meetings")
      .then((r) => r.json())
      .then((d) => setMeetings(Array.isArray(d.meetings) ? d.meetings : []))
      .catch(() => setMeetings([]));
  }, []);

  const upcoming = meetings
    .filter((m) => new Date(m.startsAt).getTime() > Date.now())
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 4);

  const startMeeting = () => {
    const id = Math.random().toString(36).substring(2, 12);
    router.push(`/room/${id}?host=1`);
  };

  const joinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinId.trim()) return;
    router.push(`/room/${joinId.trim().replace(/[^a-zA-Z0-9-]/g, "")}`);
  };

  const stats = [
    {
      label: t("dashboard.statsActive"),
      value: "0",
      sub: t("dashboard.statsActiveSub"),
      icon: Video,
      color: "#6366f1",
      glow: "rgba(99,102,241,0.25)",
    },
    {
      label: t("dashboard.statsUpcoming"),
      value: String(upcoming.length),
      sub: t("dashboard.statsUpcomingSub"),
      icon: Calendar,
      color: "#06b6d4",
      glow: "rgba(6,182,212,0.22)",
    },
    {
      label: t("dashboard.statsLangs"),
      value: "26",
      sub: t("dashboard.statsLangsSub"),
      icon: Globe,
      color: "#a855f7",
      glow: "rgba(168,85,247,0.22)",
    },
    {
      label: t("dashboard.statsLatency"),
      value: "<400",
      sub: t("dashboard.statsLatencySub"),
      icon: Zap,
      color: "#10b981",
      glow: "rgba(16,185,129,0.22)",
    },
  ];

  const quickActions = [
    {
      title: t("dashboard.instantTitle"),
      desc: t("dashboard.instantDesc"),
      cta: t("dashboard.instantCta"),
      icon: Video,
      gradient: "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
      glow: "rgba(99,102,241,0.4)",
      action: startMeeting,
    },
    {
      title: t("dashboard.scheduleTitle"),
      desc: t("dashboard.scheduleDesc"),
      cta: t("dashboard.scheduleCta"),
      icon: Calendar,
      gradient: "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)",
      glow: "rgba(6,182,212,0.35)",
      href: "/dashboard/meetings",
    },
    {
      title: t("dashboard.joinTitle"),
      desc: t("dashboard.joinDesc"),
      cta: null,
      icon: Users,
      gradient: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
      glow: "rgba(168,85,247,0.35)",
      isJoin: true,
    },
  ];

  const features = [
    { icon: Globe, label: t("dashboard.feat1Label"), desc: t("dashboard.feat1Desc"), color: "#6366f1" },
    { icon: Mic, label: t("dashboard.feat2Label"), desc: t("dashboard.feat2Desc"), color: "#06b6d4" },
    { icon: Film, label: t("dashboard.feat3Label"), desc: t("dashboard.feat3Desc"), color: "#a855f7" },
    { icon: Shield, label: t("dashboard.feat4Label"), desc: t("dashboard.feat4Desc"), color: "#10b981" },
    { icon: TrendingUp, label: t("dashboard.feat5Label"), desc: t("dashboard.feat5Desc"), color: "#f59e0b" },
    { icon: Star, label: t("dashboard.feat6Label"), desc: t("dashboard.feat6Desc"), color: "#ec4899" },
  ];

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontSize: "12px", letterSpacing: "0.16em", opacity: 0.5, marginBottom: "8px", fontWeight: 600 }}>
          INSTANT TALK · WORKSPACE
        </div>
        <h1
          style={{
            fontSize: "clamp(32px, 4vw, 48px)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            background: "linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.7) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            margin: 0,
          }}
        >
          {getGreeting()}.
        </h1>
        <p style={{ marginTop: "10px", opacity: 0.6, fontSize: "15px" }}>
          {new Date().toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              ...CARD,
              padding: "20px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-20px",
                right: "-20px",
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: s.glow,
                filter: "blur(24px)",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ fontSize: "12px", opacity: 0.55, fontWeight: 600, letterSpacing: "0.04em" }}>{s.label}</div>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "9px",
                  background: `${s.color}22`,
                  border: `1px solid ${s.color}33`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <s.icon size={15} color={s.color} />
              </div>
            </div>
            <div style={{ fontSize: "36px", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: "12px", opacity: 0.5, marginTop: "6px" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {quickActions.map((a, i) => (
          <div
            key={a.title}
            style={{
              ...CARD,
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-40px",
                left: "-20px",
                width: "140px",
                height: "140px",
                borderRadius: "50%",
                background: a.glow,
                filter: "blur(40px)",
                opacity: 0.5,
              }}
            />
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "14px",
                background: a.gradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
                boxShadow: `0 8px 24px ${a.glow}`,
                flexShrink: 0,
              }}
            >
              <a.icon size={20} color="white" />
            </div>

            <div style={{ fontWeight: 800, fontSize: "18px", marginBottom: "8px", letterSpacing: "-0.02em" }}>
              {a.title}
            </div>
            <div style={{ fontSize: "14px", opacity: 0.65, lineHeight: 1.6, flex: 1, marginBottom: "20px" }}>
              {a.desc}
            </div>

            {a.isJoin ? (
              <form onSubmit={joinMeeting} style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                  placeholder={t("dashboard.joinPlaceholder")}
                  style={{
                    flex: 1,
                    height: "40px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.06)",
                    color: "white",
                    padding: "0 12px",
                    fontSize: "13.5px",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={!joinId.trim()}
                  style={{
                    height: "40px",
                    padding: "0 16px",
                    borderRadius: "10px",
                    border: 0,
                    background: a.gradient,
                    color: "white",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                    opacity: joinId.trim() ? 1 : 0.5,
                  }}
                >
                  {t("dashboard.joinBtn")}
                </button>
              </form>
            ) : a.href ? (
              <Link href={a.href} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    height: "40px",
                    borderRadius: "10px",
                    background: a.gradient,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "7px",
                    fontWeight: 700,
                    fontSize: "13.5px",
                    boxShadow: `0 6px 24px ${a.glow}`,
                  }}
                >
                  {a.cta}
                  <ArrowRight size={14} />
                </div>
              </Link>
            ) : (
              <button
                onClick={a.action}
                style={{
                  height: "40px",
                  borderRadius: "10px",
                  border: 0,
                  background: a.gradient,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  fontWeight: 700,
                  fontSize: "13.5px",
                  cursor: "pointer",
                  boxShadow: `0 6px 24px ${a.glow}`,
                  width: "100%",
                }}
              >
                {a.cta}
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Upcoming + Features */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "16px" }}>
        {/* Upcoming meetings */}
        <div style={{ ...CARD }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: "18px", letterSpacing: "-0.02em" }}>{t("dashboard.upcomingTitle")}</div>
              <div style={{ fontSize: "13px", opacity: 0.55, marginTop: "3px" }}>{upcoming.length} {t("dashboard.upcomingCount")}</div>
            </div>
            <Link href="/dashboard/meetings" style={{ textDecoration: "none" }}>
              <div
                style={{
                  ...PILL,
                  background: "rgba(99,102,241,0.12)",
                  border: "1px solid rgba(99,102,241,0.22)",
                  color: "#a5b4fc",
                }}
              >
                {t("dashboard.viewAll")} <ArrowRight size={11} />
              </div>
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                opacity: 0.45,
                fontSize: "14px",
              }}
            >
              <Calendar size={32} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
              {t("dashboard.noMeetings")}
              <br />
              <Link href="/dashboard/meetings" style={{ color: "#818cf8", textDecoration: "none", fontWeight: 700 }}>
                {t("dashboard.scheduleNow")}
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {upcoming.map((m) => (
                <div
                  key={m.id}
                  style={{
                    borderRadius: "14px",
                    padding: "14px 16px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(99,102,241,0.08))",
                      border: "1px solid rgba(99,102,241,0.2)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ fontSize: "14px", fontWeight: 900, lineHeight: 1 }}>
                      {new Date(m.startsAt).getDate()}
                    </div>
                    <div style={{ fontSize: "9px", opacity: 0.6, letterSpacing: "0.04em" }}>
                      {new Date(m.startsAt).toLocaleDateString(lang, { month: "short" }).toUpperCase()}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "14px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {m.title}
                    </div>
                    <div style={{ fontSize: "12px", opacity: 0.55, marginTop: "3px", display: "flex", alignItems: "center", gap: "5px" }}>
                      <Clock size={11} />
                      {formatTime(m.startsAt)} · {m.invitees.length} {t("dashboard.invitees")}
                    </div>
                  </div>
                  <a href={m.roomId ? `/room/${m.roomId}` : (m.joinLink ?? "#")} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                    <div
                      style={{
                        height: "32px",
                        padding: "0 12px",
                        borderRadius: "999px",
                        background: "linear-gradient(135deg, #6366f1, #7c3aed)",
                        fontSize: "12px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                        flexShrink: 0,
                      }}
                    >
                      {t("dashboard.joinMeeting")}
                    </div>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Features grid */}
        <div style={{ ...CARD }}>
          <div style={{ fontWeight: 800, fontSize: "18px", letterSpacing: "-0.02em", marginBottom: "20px" }}>
            {t("dashboard.featuresTitle")}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {features.map((f) => (
              <div
                key={f.label}
                style={{
                  borderRadius: "14px",
                  padding: "14px",
                  background: "rgba(255,255,255,0.035)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "9px",
                    background: `${f.color}1a`,
                    border: `1px solid ${f.color}2a`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "10px",
                  }}
                >
                  <f.icon size={14} color={f.color} />
                </div>
                <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "4px" }}>{f.label}</div>
                <div style={{ fontSize: "11.5px", opacity: 0.55, lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
