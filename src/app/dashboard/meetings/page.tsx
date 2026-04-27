"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type Invitee = { id: string; email: string; status: string };

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
  joinLink: string;
  guestLink: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function pretty(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}
function initials(s: string) {
  return s.split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
}
function tz() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris";
}

function Toast({ msg, type }: { msg: string; type: "ok" | "err" | "info" }) {
  const bg = type === "ok" ? "linear-gradient(135deg,#16a34a,#15803d)" : type === "err" ? "linear-gradient(135deg,#dc2626,#b91c1c)" : "linear-gradient(135deg,#2563eb,#4f46e5)";
  return (
    <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, maxWidth: 360, padding: "14px 20px", borderRadius: 16, background: bg, color: "#fff", fontWeight: 700, fontSize: 15, boxShadow: "0 20px 60px rgba(0,0,0,.4)", pointerEvents: "none" }}>
      {msg}
    </div>
  );
}

function MeetingsInner() {
  const { t } = useLanguage();
  const params = useSearchParams();
  const prefill = params?.get("date") ?? null;

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [host, setHost] = useState(() => {
    if (typeof window === "undefined") return "";
    const saved = window.localStorage.getItem("instanttalk_host_email");
    if (saved) return saved;
    const match = document.cookie.match(/instanttalk_customer_email=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  });
  const [guests, setGuests] = useState("");
  const [start, setStart] = useState(prefill ? toInput(new Date(`${prefill}T09:00`)) : toInput(new Date(Date.now() + 3600000)));
  const [end, setEnd] = useState(prefill ? toInput(new Date(`${prefill}T10:00`)) : toInput(new Date(Date.now() + 7200000)));
  const [link, setLink] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" | "info" } | null>(null);
  const [busy, setBusy] = useState(false);
  const [day, setDay] = useState(prefill ?? new Date().toISOString().slice(0, 10));
  const formRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function notify(msg: string, type: "ok" | "err" | "info" = "info") {
    setToast({ msg, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }

  async function load() {
    try {
      const r = await fetch("/api/meetings");
      if (!r.ok) { setMeetings([]); return; }
      const d = await r.json();
      setMeetings(Array.isArray(d.meetings) ? d.meetings : []);
    } catch {
      setMeetings([]);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (host.trim()) {
      window.localStorage.setItem("instanttalk_host_email", host.trim().toLowerCase());
    }
  }, [host]);

  const future = useMemo(() => meetings.filter((m) => new Date(m.endsAt) >= new Date()), [meetings]);
  const past = useMemo(() => meetings.filter((m) => new Date(m.endsAt) < new Date()), [meetings]);
  const today = useMemo(() => meetings.filter((m) => m.startsAt.slice(0, 10) === day), [meetings, day]);

  async function book() {
    if (!title.trim()) { notify(t("dash.errTitle"), "err"); return; }
    const normalizedHost = host.trim().toLowerCase();
    if (!normalizedHost) { notify(t("dash.errHost"), "err"); return; }

    setBusy(true);
    notify(t("dash.errCreating"), "info");

    try {
      const r = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: desc,
          hostEmail: normalizedHost,
          startsAt: start,
          endsAt: end,
          timezone: tz(),
          invitees: guests.split(",").map((g) => g.trim()).filter(Boolean),
        }),
      });

      const d = await r.json();

      if (!r.ok) {
        const msg =
          d.error === "invalid_payload"      ? t("dash.errTitle") :
          d.error === "invalid_meeting_range" ? t("dash.errEndAfterStart") :
          d.error === "schema_missing"        ? t("dash.errDbMissing") :
          d.error === "connection_refused"    ? t("dash.errDbRefused") :
          d.error === "connection_timeout"    ? t("dash.errDbTimeout") :
          d.error === "duplicate_entry"       ? t("dash.errDuplicate") :
          d.detail                            ? `Erreur DB : ${d.detail.slice(0, 120)}` :
                                               t("dash.errCreate");
        notify(msg, "err");
        return;
      }

      setLink(d.guestLink ?? d.joinLink ?? "");

      const guestEmails = (guests || "").split(",").map((g) => g.trim()).filter(Boolean);

      if (guestEmails.length > 0 && d?.id) {
        try {
          const inviteRes = await fetch(`/api/meetings/${d.id}/invite`, { method: "POST" });
          const inviteJson = await inviteRes.json();
          const sentCount = Array.isArray(inviteJson?.results)
            ? inviteJson.results.filter((x: { sent?: boolean }) => x?.sent).length
            : 0;
          if (sentCount > 0) {
            notify(t("dash.meetingCreatedN").replace("{n}", String(sentCount)), "ok");
          } else {
            notify(t("dash.inviteFailed"), "err");
          }
        } catch {
          notify(t("dash.inviteFailed"), "err");
        }
      } else {
        notify(t("dash.meetingCreated"), "ok");
      }

      setTitle("");
      setDesc("");
      setGuests("");
      load();
    } catch {
      notify(t("dash.errNetwork"), "err");
    } finally {
      setBusy(false);
    }
  }

  async function instant() {
    const normalizedHost = host.trim().toLowerCase();
    if (!normalizedHost) {
      notify(t("dash.errHostInstant"), "err");
      return;
    }

    setBusy(true);
    notify(t("dash.errCreating"), "info");
    const now = new Date();

    try {
      const r = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t("dash.newMeeting"),
          description: t("dash.instantCreated"),
          hostEmail: normalizedHost,
          startsAt: toInput(now),
          endsAt: toInput(new Date(now.getTime() + 3600000)),
          timezone: tz(),
          invitees: [],
        }),
      });

      const d = await r.json();

      if (!r.ok) {
        const msg =
          d.error === "invalid_payload"    ? t("dash.errHost") :
          d.error === "schema_missing"     ? t("dash.errDbMissing") :
          d.error === "connection_refused" ? t("dash.errDbRefused") :
          d.error === "connection_timeout" ? t("dash.errDbTimeout") :
          d.detail                         ? `Erreur DB : ${d.detail.slice(0, 120)}` :
                                            t("dash.errCreate");
        notify(msg, "err");
        return;
      }

      setLink(d.guestLink ?? d.joinLink ?? "");
      notify(t("dash.instantCreated"), "ok");
      load();
    } catch {
      notify(t("dash.errNetwork"), "err");
    } finally {
      setBusy(false);
    }
  }

  async function invite(id: string) {
    notify(t("dash.sendingInvites"), "info");
    try {
      const r = await fetch(`/api/meetings/${id}/invite`, { method: "POST" });
      notify(r.ok ? t("dash.invitesSent") : t("dash.inviteError"), r.ok ? "ok" : "err");
      if (r.ok) load();
    } catch {
      notify(t("dash.errNetworkSimple"), "err");
    }
  }

  async function remove(id: string) {
    notify(t("dash.deleting"), "info");
    try {
      await fetch(`/api/meetings/${id}`, { method: "DELETE" });
      notify(t("dash.meetingDeleted"), "ok");
      load();
    } catch {
      notify(t("dash.deleteError"), "err");
    }
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      notify(t("dash.linkCopied"), "ok");
    } catch {
      notify(t("dash.copyError"), "err");
    }
  }

  const S = {
    card: { borderRadius: 28, padding: 24, background: "linear-gradient(180deg,rgba(14,20,38,.96),rgba(10,16,31,.95))", border: "1px solid rgba(255,255,255,.08)", boxShadow: "0 30px 80px rgba(0,0,0,.24)" } as React.CSSProperties,
    input: { height: 54, borderRadius: 16, padding: "0 16px", border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.04)", color: "#fff", fontSize: 15, width: "100%", boxSizing: "border-box" as const },
    btn: (bg: string) => ({ height: 40, borderRadius: 999, border: 0, padding: "0 16px", background: bg, color: "#fff", fontWeight: 700, cursor: "pointer", opacity: busy ? 0.6 : 1 } as React.CSSProperties),
  };

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", color: "#fff" }}>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 42, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>{t("dash.planningTitle")}</h1>
          <p style={{ margin: "10px 0 0", opacity: .72, fontSize: 16 }}>{t("dash.planningSubtitle")}</p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={instant}
            disabled={busy}
            style={{ height: 48, padding: "0 20px", borderRadius: 999, border: 0, background: "linear-gradient(135deg,#2563eb,#4f46e5)", color: "#fff", fontWeight: 800, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1, boxShadow: "0 18px 40px rgba(37,99,235,.28)" }}
          >
            {busy ? t("dash.creating") : t("dash.newMeeting")}
          </button>
          <button
            onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}
            style={{ height: 48, padding: "0 20px", borderRadius: 999, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.06)", color: "#fff", fontWeight: 800, cursor: "pointer" }}
          >
            {t("dash.schedule")}
          </button>
          <span style={{ height: 44, padding: "0 16px", borderRadius: 999, display: "flex", alignItems: "center", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.08)", fontWeight: 700 }}>
            {future.length} {t("dash.upcoming")}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
        {[
          [t("dash.upcomingMtgTitle"), future.length],
          [t("dash.pastMtgTitle"),     past.length],
          [t("dash.todaySessions"),    today.length],
          [t("dash.estimatedGuests"),  meetings.reduce((a, m) => a + m.invitees.length, 0)],
        ].map(([label, value]) => (
          <div key={String(label)} style={{ borderRadius: 22, padding: 20, background: "linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.035))", border: "1px solid rgba(255,255,255,.1)" }}>
            <div style={{ fontSize: 13, opacity: .7, marginBottom: 10 }}>{label}</div>
            <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-0.04em" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Form + Calendar */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 18, marginBottom: 18 }}>

        {/* Form */}
        <div ref={formRef} style={S.card}>
          <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>{t("dash.planForm")}</div>
          <div style={{ opacity: .68, marginBottom: 18 }}>{t("dash.planFormSub")}</div>
          <div style={{ display: "grid", gap: 12 }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("dash.titleField")} style={S.input} />
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t("dash.descField")} style={{ ...S.input, height: "auto", minHeight: 100, padding: 16, resize: "vertical" }} />
            <input value={host} onChange={(e) => setHost(e.target.value)} placeholder={t("dash.hostField")} style={S.input} />
            <input value={guests} onChange={(e) => setGuests(e.target.value)} placeholder={t("dash.guestsField")} style={S.input} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} style={S.input} />
              <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} style={S.input} />
            </div>
            <button onClick={book} disabled={busy} style={{ height: 50, padding: "0 24px", borderRadius: 999, border: 0, background: "linear-gradient(135deg,#6d74ff,#7c3aed)", color: "#fff", fontWeight: 800, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1 }}>
              {busy ? t("dash.creating") : t("dash.scheduleBtn")}
            </button>
            {link && (
              <div style={{ borderRadius: 16, padding: 16, background: "rgba(99,102,241,.1)", border: "1px solid rgba(139,163,255,.2)" }}>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>{t("dash.guestLink")}</div>
                <div style={{ wordBreak: "break-all", opacity: .85, fontSize: 14 }}>{link}</div>
                <button onClick={() => copy(link)} style={{ marginTop: 10, height: 36, padding: "0 16px", borderRadius: 999, border: 0, background: "rgba(99,102,241,.3)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                  {t("dash.copyBtn")}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Calendar */}
        <div style={{ ...S.card, display: "grid", alignContent: "start", gap: 16 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>{t("dash.calendar")}</div>
            <div style={{ opacity: .68 }}>{t("dash.calendarSub")}</div>
          </div>
          <input type="date" value={day} onChange={(e) => setDay(e.target.value)} style={{ ...S.input, height: 50 }} />
          {today.length === 0
            ? <div style={{ padding: 16, borderRadius: 16, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", opacity: .7 }}>{t("dash.noMeetings")}</div>
            : today.map((m) => (
              <div key={m.id} style={{ padding: 16, borderRadius: 16, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}>
                <div style={{ fontWeight: 800 }}>{m.title}</div>
                <div style={{ opacity: .7, marginTop: 4, fontSize: 14 }}>{pretty(m.startsAt)}</div>
                <div style={{ opacity: .7, fontSize: 14 }}>{m.invitees.length} {t("dash.guestCount")}</div>
              </div>
            ))}
        </div>
      </div>

      {/* Future / Past */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

        {/* Future */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{t("dash.upcomingMtgTitle")}</div>
              <div style={{ opacity: .68, marginTop: 4 }}>{t("dash.upcomingSub")}</div>
            </div>
            <span style={{ fontWeight: 800, color: "#b9c6ff" }}>{future.length}</span>
          </div>
          <div style={{ display: "grid", gap: 14 }}>
            {future.length === 0
              ? <div style={{ padding: 18, borderRadius: 16, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", opacity: .75 }}>{t("dash.noUpcoming")}</div>
              : future.map((m) => (
                <div key={m.id} style={{ borderRadius: 20, padding: 18, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", display: "grid", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ fontSize: 18, fontWeight: 800 }}>{m.title}</div>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                          background: m.status === "LIVE" ? "rgba(74,222,128,.15)" : "rgba(255,255,255,.08)",
                          color: m.status === "LIVE" ? "#4ade80" : "rgba(255,255,255,.5)",
                          border: `1px solid ${m.status === "LIVE" ? "rgba(74,222,128,.3)" : "rgba(255,255,255,.1)"}`,
                        }}>
                          {m.status === "LIVE" ? "● LIVE" : m.status}
                        </span>
                      </div>
                      <div style={{ opacity: .7, marginTop: 4, fontSize: 14 }}>{pretty(m.startsAt)} → {pretty(m.endsAt)}</div>
                    </div>
                    <div style={{ height: 40, minWidth: 40, borderRadius: 999, background: "rgba(99,102,241,.2)", border: "1px solid rgba(139,163,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14 }}>
                      {initials(m.title)}
                    </div>
                  </div>
                  <div style={{ opacity: .7, fontSize: 14 }}>{m.invitees.map((i) => i.email).join(", ") || t("dash.noGuests")}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => copy(m.guestLink || m.joinLink)} style={S.btn("rgba(255,255,255,.08)")}>{t("dash.copyGuestLink")}</button>
                    <button onClick={() => invite(m.id)} style={S.btn("rgba(99,102,241,.2)")}>{t("dash.inviteByEmail")}</button>
                    <button onClick={() => window.open(m.joinLink, "_blank")} style={S.btn("linear-gradient(135deg,#6d74ff,#7c3aed)")}>{t("dash.startHost")}</button>
                    <button onClick={() => remove(m.id)} style={S.btn("rgba(220,38,38,.2)")}>{t("dash.deleteBtn")}</button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Past */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{t("dash.pastMtgTitle")}</div>
              <div style={{ opacity: .68, marginTop: 4 }}>{t("dash.pastSub")}</div>
            </div>
            <span style={{ fontWeight: 800, color: "#b9c6ff" }}>{past.length}</span>
          </div>
          <div style={{ display: "grid", gap: 14 }}>
            {past.length === 0
              ? <div style={{ padding: 18, borderRadius: 16, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", opacity: .75 }}>{t("dash.noPast")}</div>
              : past.map((m) => (
                <div key={m.id} style={{ borderRadius: 20, padding: 18, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}>
                  <div style={{ fontSize: 17, fontWeight: 800 }}>{m.title}</div>
                  <div style={{ opacity: .7, marginTop: 6, fontSize: 14 }}>{pretty(m.startsAt)}</div>
                  <div style={{ opacity: .6, fontSize: 14, marginTop: 2 }}>{m.invitees.length} {t("dash.guestCount")}</div>
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
    <Suspense fallback={<div style={{ color: "#fff", padding: 40 }}>Chargement...</div>}>
      <MeetingsInner />
    </Suspense>
  );
}
