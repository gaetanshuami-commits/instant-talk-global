"use client";

import Link from "next/link";
import { Globe, ArrowLeft, Search, Video, BarChart3, Calendar } from "lucide-react";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #04070f 0%, #07101e 100%)",
      color: "white",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      textAlign: "center",
    }}>
      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", color: "white", marginBottom: "60px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Globe size={18} color="white" />
        </div>
        <span style={{ fontWeight: 800, fontSize: "16px" }}>Instant Talk</span>
      </Link>

      {/* 404 */}
      <div style={{
        fontSize: "120px",
        fontWeight: 900,
        letterSpacing: "-0.06em",
        lineHeight: 1,
        marginBottom: "24px",
        background: "linear-gradient(135deg, rgba(99,102,241,0.6), rgba(168,85,247,0.4))",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}>
        404
      </div>

      <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.03em" }}>
        Page introuvable
      </h1>
      <p style={{ opacity: 0.55, fontSize: "16px", maxWidth: "400px", lineHeight: 1.6, marginBottom: "40px" }}>
        Cette page n'existe pas ou a été déplacée. Revenez à l'accueil ou explorez le dashboard.
      </p>

      {/* Quick links */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", marginBottom: "48px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", height: "44px", padding: "0 20px", borderRadius: "999px", background: "linear-gradient(135deg, #6366f1, #7c3aed)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: "14px" }}>
          <ArrowLeft size={15} /> Accueil
        </Link>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "8px", height: "44px", padding: "0 20px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: "14px" }}>
          <BarChart3 size={15} /> Dashboard
        </Link>
        <Link href="/dashboard/meetings" style={{ display: "flex", alignItems: "center", gap: "8px", height: "44px", padding: "0 20px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: "14px" }}>
          <Video size={15} /> Réunions
        </Link>
        <Link href="/status" style={{ display: "flex", alignItems: "center", gap: "8px", height: "44px", padding: "0 20px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "white", textDecoration: "none", fontWeight: 700, fontSize: "14px" }}>
          <Search size={15} /> Statut
        </Link>
      </div>

      {/* Suggestions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", maxWidth: "500px", width: "100%" }}>
        {[
          { href: "/dashboard/meetings", icon: Video, label: "Réunions" },
          { href: "/dashboard/calendar", icon: Calendar, label: "Calendrier" },
          { href: "/status", icon: BarChart3, label: "Statut plateforme" },
        ].map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} style={{ padding: "20px 16px", borderRadius: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)", textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, transition: "background 0.15s" }}>
            <Icon size={20} style={{ opacity: 0.7 }} />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
