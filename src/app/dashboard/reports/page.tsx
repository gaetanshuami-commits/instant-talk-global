"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Globe, Users, Clock, Video, Zap, Loader2 } from "lucide-react";

const CARD = {
  borderRadius: "22px",
  border: "1px solid rgba(255,255,255,0.07)",
  background: "linear-gradient(145deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.018) 100%)",
  backdropFilter: "blur(20px)",
  boxShadow: "0 2px 4px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.45), 0 28px 56px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.07)",
};

type Analytics = {
  weeklyData: { day: string; meetings: number; minutes: number }[];
  monthly: { month: string; meetings: number }[];
  stats: {
    totalMeetings: number; totalParticipants: number; totalMinutes: number;
    upcomingCount: number; endedCount: number; avgParticipants: number;
  };
};


export default function ReportsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const weekly  = data?.weeklyData ?? [];
  const monthly = data?.monthly    ?? [];
  const stats   = data?.stats;
  const maxMin  = Math.max(...weekly.map(d => d.minutes), 1);
  const maxMth  = Math.max(...monthly.map(d => d.meetings), 1);

  const kpis = [
    { label: "Reunions totales",      value: stats?.totalMeetings ?? 0,    icon: Video,   color: "#6366f1", glow: "rgba(99,102,241,0.22)" },
    { label: "Participants uniques",  value: stats?.totalParticipants ?? 0, icon: Users,   color: "#06b6d4", glow: "rgba(6,182,212,0.22)"  },
    { label: "Minutes de reunion",    value: stats?.totalMinutes ?? 0,      icon: Clock,   color: "#a855f7", glow: "rgba(168,85,247,0.22)" },
    { label: "Moy. participants",     value: stats?.avgParticipants ?? 0,   icon: TrendingUp, color: "#10b981", glow: "rgba(16,185,129,0.22)" },
  ];

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontSize: "12px", letterSpacing: "0.16em", opacity: 0.5, marginBottom: "7px", fontWeight: 600 }}>ANALYTICS</div>
        <h1 style={{ fontSize: "36px", fontWeight: 900, letterSpacing: "-0.04em", margin: 0 }}>Tableau de bord analytique</h1>
        <p style={{ margin: "8px 0 0", opacity: 0.5, fontSize: "14px" }}>Donnees en temps reel issues de vos reunions</p>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px", opacity: 0.5 }}><Loader2 size={32} /></div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
            {kpis.map(k => (
              <div key={k.label} style={{ ...CARD, padding: "22px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: k.glow, filter: "blur(24px)" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <div style={{ fontSize: "12px", opacity: 0.55, fontWeight: 600 }}>{k.label}</div>
                  <div style={{ width: 32, height: 32, borderRadius: "9px", background: k.color + "22", border: `1px solid ${k.color}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <k.icon size={15} color={k.color} />
                  </div>
                </div>
                <div style={{ fontSize: "38px", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>{k.value.toLocaleString("fr-FR")}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "16px" }}>
            {/* Weekly bar chart */}
            <div style={{ ...CARD, padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
                <BarChart3 size={18} color="#6366f1" />
                <div style={{ fontWeight: 800, fontSize: "17px" }}>Activite hebdomadaire</div>
              </div>
              {weekly.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", opacity: 0.4, fontSize: "14px" }}>Aucune donnee disponible</div>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", height: "160px" }}>
                  {weekly.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%" }}>
                      <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                        <div style={{ width: "100%", borderRadius: "6px 6px 0 0", background: d.minutes > 0 ? "linear-gradient(180deg, #6366f1, #4338ca)" : "rgba(255,255,255,0.06)", height: `${Math.max(4, (d.minutes / maxMin) * 100)}%`, transition: "height 0.4s ease", boxShadow: d.minutes > 0 ? "0 4px 16px rgba(99,102,241,0.3)" : "none" }} />
                      </div>
                      <div style={{ fontSize: "11px", opacity: 0.5, fontWeight: 700 }}>{d.day}</div>
                      {d.meetings > 0 && <div style={{ fontSize: "10px", color: "#818cf8", fontWeight: 700 }}>{d.meetings}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Language breakdown */}
            <div style={{ ...CARD, padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <Globe size={18} color="#a855f7" />
                <div style={{ fontWeight: 800, fontSize: "17px" }}>Langues utilisees</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "24px 0", textAlign: "center" }}>
                <Globe size={32} color="#a855f7" opacity={0.4} />
                <div style={{ fontSize: "14px", fontWeight: 700, opacity: 0.7 }}>Disponible apres vos premieres reunions</div>
                <div style={{ fontSize: "12px", opacity: 0.45, lineHeight: 1.6 }}>
                  La repartition des langues apparaitra<br />
                  automatiquement au fil de vos sessions.
                </div>
                <div style={{ marginTop: "6px", padding: "6px 14px", borderRadius: "999px", background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.2)", fontSize: "12px", color: "#c4b5fd", fontWeight: 700 }}>
                  26 langues supportees
                </div>
              </div>
            </div>
          </div>

          {/* Monthly trend */}
          <div style={{ ...CARD, padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
              <TrendingUp size={18} color="#06b6d4" />
              <div style={{ fontWeight: 800, fontSize: "17px" }}>Tendance mensuelle (6 mois)</div>
            </div>
            {monthly.every(m => m.meetings === 0) ? (
              <div style={{ textAlign: "center", padding: "24px", opacity: 0.4, fontSize: "14px" }}>Aucune reunion enregistree sur la periode</div>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-end", gap: "16px", height: "120px" }}>
                {monthly.map((m, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", height: "100%" }}>
                    <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                      <div style={{ width: "100%", borderRadius: "6px 6px 0 0", background: m.meetings > 0 ? "linear-gradient(180deg, #06b6d4, #0891b2)" : "rgba(255,255,255,0.06)", height: `${Math.max(4, (m.meetings / maxMth) * 100)}%`, transition: "height 0.4s ease", boxShadow: m.meetings > 0 ? "0 4px 16px rgba(6,182,212,0.3)" : "none" }} />
                    </div>
                    <div style={{ fontSize: "12px", opacity: 0.5, fontWeight: 700, textTransform: "capitalize" }}>{m.month}</div>
                    {m.meetings > 0 && <div style={{ fontSize: "11px", color: "#22d3ee", fontWeight: 700 }}>{m.meetings}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Platform stats */}
          <div style={{ ...CARD, padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <Zap size={18} color="#f59e0b" />
              <div style={{ fontWeight: 800, fontSize: "17px" }}>Performance de la plateforme</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
              {[
                { label: "Latence traduction", value: "< 400 ms", color: "#10b981" },
                { label: "Disponibilite", value: "99.9%", color: "#6366f1" },
                { label: "Langues supportees", value: "26", color: "#a855f7" },
                { label: "Reunions a venir", value: String(stats?.upcomingCount ?? 0), color: "#06b6d4" },
                { label: "Reunions terminees", value: String(stats?.endedCount ?? 0), color: "#f59e0b" },
                { label: "Codec video", value: "H.264", color: "#ec4899" },
              ].map(s => (
                <div key={s.label} style={{ padding: "16px", borderRadius: "14px", background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: "12px", opacity: 0.55, marginBottom: "6px" }}>{s.label}</div>
                  <div style={{ fontSize: "22px", fontWeight: 900, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
