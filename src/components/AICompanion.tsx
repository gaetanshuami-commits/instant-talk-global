"use client"

import { useState, useCallback } from "react"
import { X, Zap, CheckSquare, Loader2, FileText, Globe } from "lucide-react"

type Action = { task: string; assignee?: string; priority?: string }

type Props = {
  transcript: string[]
  defaultLang?: string
  onClose: () => void
}

const PRIORITY_COLOR: Record<string, string> = {
  haute: "#ef4444", high: "#ef4444",
  moyenne: "#f59e0b", medium: "#f59e0b",
  basse: "#22c55e", low: "#22c55e",
}

const OUTPUT_LANGS = [
  { code: "fr", label: "FR — Francais" },
  { code: "en", label: "EN — English" },
  { code: "de", label: "DE — Deutsch" },
  { code: "es", label: "ES — Espanol" },
  { code: "it", label: "IT — Italiano" },
  { code: "pt", label: "PT — Portugues" },
  { code: "ar", label: "AR — Arabe" },
  { code: "ja", label: "JA — Japonais" },
  { code: "zh", label: "ZH — Chinois" },
  { code: "ru", label: "RU — Russe" },
]

export default function AICompanion({ transcript, defaultLang = "fr", onClose }: Props) {
  const [tab,        setTab]        = useState<"summary" | "actions">("summary")
  const [outputLang, setOutputLang] = useState(defaultLang)
  const [summary,    setSummary]    = useState<string | null>(null)
  const [actions,    setActions]    = useState<Action[] | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const call = useCallback(async (type: "summary" | "actions") => {
    if (transcript.length < 1) {
      setError("Aucune transcription — activez la traduction et parlez quelques secondes.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const r = await fetch("/api/ai-companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, type, outputLang }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      if (type === "summary") setSummary(d.result)
      else setActions(d.result)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [transcript, outputLang])

  // Clear result when lang changes so stale content is not shown
  const changeLang = (l: string) => {
    setOutputLang(l)
    setSummary(null)
    setActions(null)
  }

  return (
    <div style={{
      position: "absolute", bottom: "80px", right: "8px",
      width: "min(360px, calc(100vw - 16px))", zIndex: 50,
      borderRadius: "20px",
      border: "1px solid rgba(99,102,241,0.28)",
      background: "rgba(4,7,15,0.97)",
      backdropFilter: "blur(28px)",
      boxShadow: "0 24px 64px rgba(0,0,0,0.75), 0 0 0 1px rgba(99,102,241,0.1)",
      overflow: "hidden",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
    }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "14px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ width: 30, height: 30, borderRadius: "9px", background: "linear-gradient(135deg, #6366f1, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 14px rgba(99,102,241,0.45)" }}>
          <Zap size={15} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: "14px", letterSpacing: "-0.01em" }}>IA Companion</div>
          <div style={{ fontSize: "10px", opacity: 0.45, marginTop: "1px" }}>GPT-4o · {transcript.length} lignes capturees</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", padding: 4, display: "flex", borderRadius: "6px" }}>
          <X size={15} />
        </button>
      </div>

      {/* Language selector */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "9px" }}>
        <Globe size={13} color="#6366f1" />
        <span style={{ fontSize: "12px", opacity: 0.55, fontWeight: 600 }}>Langue de sortie</span>
        <select
          value={outputLang}
          onChange={e => changeLang(e.target.value)}
          style={{ flex: 1, height: 30, borderRadius: "8px", border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.1)", color: "#a5b4fc", fontSize: "12px", fontWeight: 700, outline: "none", paddingLeft: "8px", cursor: "pointer" }}
        >
          {OUTPUT_LANGS.map(l => (
            <option key={l.code} value={l.code} style={{ background: "#0d0d1a", color: "white" }}>{l.label}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {(["summary", "actions"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, height: 38, border: "none", background: "none", cursor: "pointer",
              fontSize: "12.5px", fontWeight: 700,
              color: tab === t ? "#a5b4fc" : "rgba(255,255,255,0.38)",
              borderBottom: tab === t ? "2px solid #6366f1" : "2px solid transparent",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              transition: "color 0.15s",
            }}
          >
            {t === "summary"
              ? <><FileText size={12} /> Resume</>
              : <><CheckSquare size={12} /> Actions</>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "14px 16px", minHeight: "130px", maxHeight: "280px", overflowY: "auto" }}>
        {error && (
          <div style={{ fontSize: "12px", color: "#fca5a5", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", padding: "10px 12px", marginBottom: "10px", lineHeight: 1.5 }}>
            {error}
          </div>
        )}

        {tab === "summary" && (
          summary
            ? <p style={{ fontSize: "13.5px", lineHeight: 1.7, color: "rgba(255,255,255,0.88)", margin: 0, whiteSpace: "pre-wrap" }}>{summary}</p>
            : <p style={{ fontSize: "13px", opacity: 0.45, lineHeight: 1.65, margin: 0 }}>
                Cliquez sur <strong style={{ color: "#a5b4fc", fontWeight: 700 }}>Generer</strong> pour obtenir un resume intelligent de la reunion en cours, dans la langue choisie.
              </p>
        )}

        {tab === "actions" && (
          actions && actions.length > 0
            ? <div style={{ display: "grid", gap: "8px" }}>
                {actions.map((a, i) => {
                  const dotColor = PRIORITY_COLOR[a.priority ?? "medium"] ?? "#f59e0b"
                  return (
                    <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "11px 12px", borderRadius: "12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, marginTop: 5, flexShrink: 0, boxShadow: `0 0 7px ${dotColor}` }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13.5px", fontWeight: 600, color: "white", lineHeight: 1.4 }}>{a.task}</div>
                        {a.assignee && <div style={{ fontSize: "11.5px", opacity: 0.5, marginTop: "3px" }}>{a.assignee}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            : actions !== null
              ? <p style={{ fontSize: "13px", opacity: 0.45, margin: 0 }}>Aucune action detectee dans cette transcription.</p>
              : <p style={{ fontSize: "13px", opacity: 0.45, lineHeight: 1.65, margin: 0 }}>
                  Cliquez sur <strong style={{ color: "#a5b4fc", fontWeight: 700 }}>Generer</strong> pour extraire automatiquement les taches et decisions de la reunion.
                </p>
        )}
      </div>

      {/* CTA */}
      <div style={{ padding: "10px 16px 14px" }}>
        <button
          onClick={() => call(tab)}
          disabled={loading}
          style={{
            width: "100%", height: 40, borderRadius: "11px", border: 0,
            background: loading ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #6366f1, #7c3aed)",
            color: "white", fontWeight: 700, fontSize: "13.5px",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            boxShadow: loading ? "none" : "0 6px 20px rgba(99,102,241,0.4)",
            transition: "all 0.2s",
          }}
        >
          {loading
            ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Analyse GPT-4o...</>
            : <><Zap size={14} /> Generer {tab === "summary" ? "le resume" : "les actions"}</>}
        </button>
      </div>
    </div>
  )
}
