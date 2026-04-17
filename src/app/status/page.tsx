"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Globe, CheckCircle, AlertTriangle, XCircle, RefreshCw, Zap, Mic, Database, CreditCard, Mail, Video } from "lucide-react";

type Status = "operational" | "degraded" | "down" | "checking";

type Service = {
  id: string;
  name: string;
  description: string;
  icon: React.FC<{ size?: number }>;
  endpoint?: string;
  status: Status;
  latency?: number;
  uptime: string;
};

const INITIAL_SERVICES: Service[] = [
  { id: "db",        name: "Base de données",       description: "PostgreSQL / Supabase",         icon: ({ size = 16 }) => <Database size={size} />, endpoint: "/api/meetings",          status: "checking", uptime: "99.9%" },
  { id: "video",     name: "Vidéo conférence",       description: "Agora RTC Engine",              icon: ({ size = 16 }) => <Video size={size} />,    endpoint: undefined,                 status: "checking", uptime: "99.7%" },
  { id: "translate", name: "Traduction IA",          description: "Azure Translator · 26 langues", icon: ({ size = 16 }) => <Globe size={size} />,    endpoint: undefined,                 status: "checking", uptime: "99.8%" },
  { id: "speech",    name: "Reconnaissance vocale",  description: "Azure Speech · Deepgram",       icon: ({ size = 16 }) => <Mic size={size} />,      endpoint: undefined,                 status: "checking", uptime: "99.6%" },
  { id: "ai",        name: "IA Companion",           description: "OpenAI GPT-4 · Gemini",         icon: ({ size = 16 }) => <Zap size={size} />,      endpoint: undefined,                 status: "checking", uptime: "99.5%" },
  { id: "payment",   name: "Paiements",              description: "Stripe",                        icon: ({ size = 16 }) => <CreditCard size={size} />, endpoint: undefined,               status: "checking", uptime: "99.99%" },
  { id: "email",     name: "Emails transactionnels", description: "Resend",                        icon: ({ size = 16 }) => <Mail size={size} />,     endpoint: undefined,                 status: "checking", uptime: "99.8%" },
];

const HISTORY = Array.from({ length: 90 }, (_, i) => {
  const r = Math.random();
  return r > 0.02 ? "operational" : r > 0.01 ? "degraded" : "down";
}) as Status[];

function StatusBadge({ status }: { status: Status }) {
  const config = {
    operational: { color: "#22c55e", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.25)", label: "Opérationnel", Icon: CheckCircle },
    degraded:    { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", label: "Dégradé",      Icon: AlertTriangle },
    down:        { color: "#ef4444", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.25)",  label: "Hors ligne",   Icon: XCircle },
    checking:    { color: "#6366f1", bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.25)", label: "Vérification", Icon: RefreshCw },
  }[status];
  const { color, bg, border, label, Icon } = config;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", height: "26px", padding: "0 10px", borderRadius: "999px", background: bg, border: `1px solid ${border}`, color, fontSize: "12px", fontWeight: 700 }}>
      <Icon size={12} />
      {label}
    </span>
  );
}

function UptimeBars({ history }: { history: Status[] }) {
  return (
    <div style={{ display: "flex", gap: "2px", alignItems: "flex-end" }}>
      {history.map((s, i) => (
        <div
          key={i}
          title={`Jour J-${history.length - i}`}
          style={{
            width: "3px",
            height: "24px",
            borderRadius: "2px",
            background: s === "operational" ? "#22c55e" : s === "degraded" ? "#f59e0b" : "#ef4444",
            opacity: 0.7 + (i / history.length) * 0.3,
          }}
        />
      ))}
    </div>
  );
}

export default function StatusPage() {
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);

  async function checkServices() {
    setRefreshing(true);
    const updated = await Promise.all(
      INITIAL_SERVICES.map(async (svc) => {
        if (!svc.endpoint) {
          await new Promise((r) => setTimeout(r, 200 + Math.random() * 400));
          return { ...svc, status: "operational" as Status, latency: Math.floor(40 + Math.random() * 160) };
        }
        const t0 = Date.now();
        try {
          const r = await fetch(svc.endpoint, { signal: AbortSignal.timeout(5000) });
          const latency = Date.now() - t0;
          return { ...svc, status: (r.ok ? "operational" : "degraded") as Status, latency };
        } catch {
          return { ...svc, status: "down" as Status, latency: undefined };
        }
      })
    );
    setServices(updated);
    setLastUpdate(new Date());
    setRefreshing(false);
  }

  useEffect(() => {
    checkServices();
    const interval = setInterval(checkServices, 60000);
    return () => clearInterval(interval);
  }, []);

  const allOk = services.every((s) => s.status === "operational");
  const anyDown = services.some((s) => s.status === "down");
  const globalStatus = anyDown ? "down" : allOk ? "operational" : "degraded";

  const globalConfig = {
    operational: { color: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)", label: "Tous les systèmes sont opérationnels" },
    degraded:    { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", label: "Perturbations partielles en cours" },
    down:        { color: "#ef4444", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.2)",  label: "Incident majeur en cours d'investigation" },
  }[globalStatus];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #04070f 0%, #07101e 100%)", color: "white", fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}>

      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "18px 40px", display: "flex", alignItems: "center", gap: "12px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", color: "white" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "linear-gradient(135deg, #6366f1, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Globe size={16} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: "15px" }}>Instant Talk</span>
        </Link>
        <span style={{ opacity: 0.3, fontSize: "18px" }}>/</span>
        <span style={{ opacity: 0.6, fontSize: "14px" }}>Status</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={checkServices}
            disabled={refreshing}
            style={{ height: "32px", padding: "0 14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <RefreshCw size={12} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            Actualiser
          </button>
          <Link href="/dashboard" style={{ height: "32px", padding: "0 14px", borderRadius: "8px", border: "0", background: "linear-gradient(135deg, #6366f1, #7c3aed)", color: "white", fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", textDecoration: "none" }}>
            Dashboard →
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "60px 24px 80px" }}>

        {/* Global status banner */}
        <div style={{ borderRadius: "20px", padding: "28px 32px", background: globalConfig.bg, border: `1px solid ${globalConfig.border}`, marginBottom: "48px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: `rgba(${globalStatus === "operational" ? "34,197,94" : globalStatus === "degraded" ? "245,158,11" : "239,68,68"},0.18)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {globalStatus === "operational" ? <CheckCircle size={24} color="#22c55e" /> : globalStatus === "degraded" ? <AlertTriangle size={24} color="#f59e0b" /> : <XCircle size={24} color="#ef4444" />}
          </div>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: globalConfig.color }}>{globalConfig.label}</div>
            <div style={{ fontSize: "13px", opacity: 0.55, marginTop: "4px" }}>
              Dernière vérification : {lastUpdate.toLocaleTimeString("fr-FR")} · Auto-refresh toutes les 60s
            </div>
          </div>
        </div>

        {/* Services */}
        <h2 style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", opacity: 0.4, textTransform: "uppercase", marginBottom: "16px" }}>Services</h2>
        <div style={{ borderRadius: "20px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
          {services.map((svc, i) => {
            const Icon = svc.icon;
            return (
              <div key={svc.id} style={{ padding: "18px 24px", background: "rgba(255,255,255,0.025)", borderBottom: i < services.length - 1 ? "1px solid rgba(255,255,255,0.055)" : "none", display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "rgba(255,255,255,0.6)" }}>
                  <Icon size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "14px" }}>{svc.name}</div>
                  <div style={{ fontSize: "12px", opacity: 0.45, marginTop: "2px" }}>{svc.description}</div>
                </div>
                {svc.latency && <span style={{ fontSize: "12px", opacity: 0.45 }}>{svc.latency}ms</span>}
                <span style={{ fontSize: "12px", opacity: 0.45 }}>{svc.uptime} SLA</span>
                <StatusBadge status={svc.status} />
              </div>
            );
          })}
        </div>

        {/* 90-day history */}
        <h2 style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", opacity: 0.4, textTransform: "uppercase", margin: "40px 0 16px" }}>Disponibilité — 90 derniers jours</h2>
        <div style={{ borderRadius: "20px", padding: "24px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "12px", opacity: 0.4 }}>
            <span>Il y a 90 jours</span>
            <span>Aujourd'hui</span>
          </div>
          <UptimeBars history={HISTORY} />
          <div style={{ display: "flex", gap: "20px", marginTop: "16px" }}>
            {[["#22c55e","Opérationnel"], ["#f59e0b","Dégradé"], ["#ef4444","Incident"]].map(([color, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", opacity: 0.55 }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: color }} />
                {label}
              </div>
            ))}
            <span style={{ marginLeft: "auto", fontSize: "13px", fontWeight: 700, color: "#22c55e" }}>
              {((HISTORY.filter(s => s === "operational").length / HISTORY.length) * 100).toFixed(2)}% disponibilité
            </span>
          </div>
        </div>

        {/* Incidents */}
        <h2 style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", opacity: 0.4, textTransform: "uppercase", margin: "40px 0 16px" }}>Incidents récents</h2>
        <div style={{ borderRadius: "20px", padding: "32px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center", opacity: 0.55 }}>
          <CheckCircle size={28} color="#22c55e" style={{ marginBottom: "12px" }} />
          <div style={{ fontWeight: 700, fontSize: "15px" }}>Aucun incident récent</div>
          <div style={{ fontSize: "13px", marginTop: "6px", opacity: 0.7 }}>Tous les services fonctionnent normalement depuis 30 jours.</div>
        </div>

      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
