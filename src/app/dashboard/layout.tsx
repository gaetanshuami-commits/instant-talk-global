"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  LayoutDashboard, Video, Calendar, Users, MessageSquare,
  Radio, Film, BarChart3, Globe, Bell, Search,
  Plus, ChevronDown, Zap, Mic, Shield, X, User,
} from "lucide-react";

const ThreeBackground = dynamic(() => import("@/components/ThreeBackground"), { ssr: false });

const NAV_KEYS = [
  { icon: LayoutDashboard, key: "overview",    href: "/dashboard", exact: true },
  { icon: Video,           key: "meetings",    href: "/dashboard/meetings" },
  { icon: Calendar,        key: "calendar",    href: "/dashboard/calendar" },
  { icon: Users,           key: "contacts",    href: "/dashboard/contacts" },
  { icon: MessageSquare,   key: "chat",        href: "/dashboard/chat" },
  { icon: Radio,           key: "webinars",    href: "/dashboard/webinars" },
  { icon: Film,            key: "recordings",  href: "/dashboard/recordings" },
  { icon: BarChart3,       key: "reports",     href: "/dashboard/reports" },
  { icon: Shield,          key: "settings",    href: "/dashboard/settings" },
];

const BG =
  "radial-gradient(ellipse at 18% 0%, rgba(99,102,241,0.18) 0%, transparent 48%)," +
  "radial-gradient(ellipse at 80% 5%, rgba(168,85,247,0.12) 0%, transparent 45%)," +
  "radial-gradient(ellipse at 50% 100%, rgba(6,182,212,0.07) 0%, transparent 55%)," +
  "linear-gradient(180deg, #04070f 0%, #07101e 100%)";

type SearchResult = { type: string; id: string; label: string; sub?: string; href: string };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : (pathname ?? "").startsWith(href);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (r.ok) setResults((await r.json()).results);
    }, 250);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const TYPE_ICON: Record<string, React.FC> = {
    meeting: () => <Calendar size={14} />,
    contact: () => <User size={14} />,
    webinar: () => <Radio size={14} />,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        color: "white",
        display: "flex",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif",
        position: "relative",
      }}
    >
      <ThreeBackground />
      {/* ── Layout (above 3D canvas) ─────────────────────────── */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flex: 1, minHeight: "100vh" }}>
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        style={{
          width: "256px",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid rgba(255,255,255,0.055)",
          background: "rgba(4,7,15,0.97)",
          backdropFilter: "blur(24px)",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{ padding: "22px 18px 18px" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "11px",
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 28px rgba(99,102,241,0.45)",
                flexShrink: 0,
              }}
            >
              <Globe size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "15px", letterSpacing: "-0.025em", color: "white" }}>
                Instant Talk
              </div>
              <div style={{ fontSize: "10px", opacity: 0.45, letterSpacing: "0.14em", marginTop: "1px" }}>
                GLOBAL · WORKSPACE
              </div>
            </div>
          </Link>
        </div>

        {/* New meeting CTA */}
        <div style={{ padding: "0 12px 14px" }}>
          <button
            onClick={() => {
              const id = Math.random().toString(36).substring(2, 12);
              router.push(`/room/${id}?host=1`);
            }}
            style={{
              width: "100%",
              height: "40px",
              borderRadius: "11px",
              border: "0",
              background: "linear-gradient(135deg, #6366f1, #7c3aed)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "7px",
              fontWeight: 700,
              fontSize: "13.5px",
              cursor: "pointer",
              boxShadow: "0 6px 28px rgba(99,102,241,0.38), inset 0 1px 0 rgba(255,255,255,0.14)",
              letterSpacing: "-0.01em",
            }}
          >
            <Plus size={15} />
            {t("dash.newMeeting")}
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "0 8px", overflowY: "auto" }}>
          {NAV_KEYS.map(({ icon: Icon, key, href, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link key={href} href={href} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    height: "40px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                    padding: "0 11px",
                    marginBottom: "2px",
                    background: active
                      ? "linear-gradient(135deg, rgba(99,102,241,0.22), rgba(99,102,241,0.07))"
                      : "transparent",
                    border: active
                      ? "1px solid rgba(99,102,241,0.28)"
                      : "1px solid transparent",
                    color: active ? "#c7d2fe" : "rgba(255,255,255,0.55)",
                    fontWeight: active ? 700 : 500,
                    fontSize: "13.5px",
                    transition: "all 0.12s ease",
                  }}
                >
                  <Icon size={16} />
                  {t(`dash.${key}`)}
                  {active && (
                    <div
                      style={{
                        marginLeft: "auto",
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        background: "#818cf8",
                        boxShadow: "0 0 8px #818cf8",
                      }}
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* AI badge */}
        <div style={{ padding: "10px 12px" }}>
          <div
            style={{
              borderRadius: "14px",
              padding: "13px 14px",
              background: "linear-gradient(135deg, rgba(6,182,212,0.1), rgba(99,102,241,0.07))",
              border: "1px solid rgba(6,182,212,0.18)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "5px" }}>
              <Zap size={13} color="#22d3ee" />
              <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#67e8f9" }}>
                {t("dash.aiActive")}
              </span>
              <div
                style={{
                  marginLeft: "auto",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 6px #22c55e",
                }}
              />
            </div>
            <div style={{ fontSize: "11.5px", opacity: 0.65, lineHeight: 1.5 }}>
              {t("dash.aiSub")}
            </div>
          </div>
        </div>

        {/* User */}
        <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.055)" }}>
          <div
            style={{
              height: "50px",
              borderRadius: "13px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "0 11px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "13px",
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
              }}
            >
              G
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Gaetan
              </div>
              <div
                style={{
                  fontSize: "11px",
                  opacity: 0.5,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Premium · Pro
              </div>
            </div>
            <ChevronDown size={13} opacity={0.45} />
          </div>
        </div>
      </aside>

      {/* ── Content ─────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowX: "hidden" }}>
        {/* Topbar */}
        <header
          style={{
            height: "58px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            padding: "0 24px",
            gap: "14px",
            background: "rgba(4,7,15,0.85)",
            backdropFilter: "blur(24px)",
            position: "sticky",
            top: 0,
            zIndex: 20,
            flexShrink: 0,
          }}
        >
          {/* Search */}
          <div ref={searchRef} style={{ flex: 1, maxWidth: "440px", position: "relative" }}>
            <div
              style={{
                height: "34px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${searchOpen ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.07)"}`,
                display: "flex",
                alignItems: "center",
                gap: "9px",
                padding: "0 14px",
                transition: "border-color 0.15s",
              }}
            >
              <Search size={14} opacity={0.45} />
              <input
                value={query}
                onChange={e => { setQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                placeholder={t("dash.search")}
                style={{ background: "none", border: "none", outline: "none", color: "white", fontSize: "13.5px", flex: 1 }}
              />
              {query && (
                <button onClick={() => { setQuery(""); setResults([]); setSearchOpen(false); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", padding: 0, display: "flex" }}>
                  <X size={13} />
                </button>
              )}
            </div>
            {searchOpen && results.length > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, borderRadius: "16px", background: "rgba(4,7,15,0.97)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(24px)", overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,0.7)", zIndex: 200 }}>
                {results.map((r, i) => (
                  <button key={r.id + i} onClick={() => { router.push(r.href); setSearchOpen(false); setQuery(""); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: "11px", padding: "11px 14px", background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", textAlign: "left", color: "white" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.1)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                  >
                    <span style={{ display: "flex", alignItems: "center", opacity: 0.6 }}>
                      {(() => { const Icon = TYPE_ICON[r.type]; return Icon ? <Icon /> : <Search size={14} />; })()}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13.5px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</div>
                      {r.sub && <div style={{ fontSize: "11px", opacity: 0.5, marginTop: "1px" }}>{r.sub}</div>}
                    </div>
                    <span style={{ fontSize: "10px", opacity: 0.35, textTransform: "capitalize", letterSpacing: "0.05em" }}>{r.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Mic quick start */}
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Mic size={15} opacity={0.65} />
            </div>

            {/* Notifications */}
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <Bell size={15} opacity={0.65} />
              <div
                style={{
                  position: "absolute",
                  top: "7px",
                  right: "7px",
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#6366f1",
                  border: "1.5px solid #04070f",
                  boxShadow: "0 0 6px rgba(99,102,241,0.7)",
                }}
              />
            </div>

            {/* Language badge */}
            <div
              style={{
                height: "34px",
                padding: "0 12px",
                borderRadius: "999px",
                background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(99,102,241,0.06))",
                border: "1px solid rgba(99,102,241,0.22)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: 700,
                fontSize: "12.5px",
                color: "#a5b4fc",
                cursor: "pointer",
              }}
            >
              <Globe size={12} />
              26 langues
            </div>

            {/* Avatar */}
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
              }}
            >
              G
            </div>
          </div>
        </header>

        {/* Dev mode activation banner (development only) */}
        {process.env.NODE_ENV === "development" && (
          <div style={{ padding: "8px 24px", background: "rgba(234,179,8,0.1)", borderBottom: "1px solid rgba(234,179,8,0.2)", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            <span style={{ fontSize: "11px", color: "#fbbf24", fontWeight: 700, letterSpacing: "0.1em" }}>DEV</span>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", flex: 1 }}>
              Mode développement — active les cookies de test pour accéder à toutes les fonctionnalités
            </span>
            <button
              onClick={async () => {
                await fetch("/api/dev/activate")
                window.location.reload()
              }}
              style={{ height: "26px", padding: "0 12px", borderRadius: "7px", border: "1px solid rgba(234,179,8,0.35)", background: "rgba(234,179,8,0.15)", color: "#fbbf24", fontWeight: 700, fontSize: "11px", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Activer session de test
            </button>
          </div>
        )}

        {/* Page */}
        <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
          {children}
        </main>
      </div>
      </div>
    </div>
  );
}
