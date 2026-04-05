"use client";

import { useEffect, useMemo, useState } from "react"

const LANGUAGES = [
  { label: "Anglais", value: "en" },
  { label: "Français", value: "fr-FR" },
  { label: "Espagnol", value: "es" },
  { label: "Arabe", value: "ar" },
  { label: "Mandarin (Chinois)", value: "zh-Hans" },
  { label: "Allemand", value: "de" },
  { label: "Bulgare", value: "bg" },
  { label: "Danois", value: "da" },
  { label: "Finnois", value: "fi" },
  { label: "Grec", value: "el" },
  { label: "Hongrois", value: "hu" },
  { label: "Italien", value: "it" },
  { label: "Néerlandais", value: "nl" },
  { label: "Norvégien", value: "nb" },
  { label: "Polonais", value: "pl" },
  { label: "Portugais", value: "pt" },
  { label: "Roumain", value: "ro" },
  { label: "Russe", value: "ru" },
  { label: "Slovaque", value: "sk" },
  { label: "Suédois", value: "sv" },
  { label: "Tchèque", value: "cs" },
  { label: "Coréen", value: "ko" },
  { label: "Hindi", value: "hi" },
  { label: "Japonais", value: "ja" },
  { label: "Swahili", value: "sw" },
  { label: "Turc", value: "tr" },
]

export default function AITranslator() {
  const [open, setOpen] = useState(false)
  const [sourceLanguage, setSourceLanguage] = useState("fr-FR")
  const [targetLanguage, setTargetLanguage] = useState("en")

  useEffect(() => {
    const savedSource = localStorage.getItem("talkglobal_source_language")
    const savedTarget = localStorage.getItem("talkglobal_target_language")

    if (savedSource) setSourceLanguage(savedSource)
    if (savedTarget) setTargetLanguage(savedTarget)
  }, [])

  const sourceLabel = useMemo(
    () => LANGUAGES.find((l) => l.value === sourceLanguage)?.label ?? "Français",
    [sourceLanguage]
  )

  const targetLabel = useMemo(
    () => LANGUAGES.find((l) => l.value === targetLanguage)?.label ?? "Anglais",
    [targetLanguage]
  )

  function notifyLanguageChanged() {
    window.dispatchEvent(new CustomEvent("talkglobal-language-changed"))
  }

  return (
    <div
      style={{
        position: "fixed",
        right: 18,
        bottom: 102,
        zIndex: 80,
        width: 290,
        maxWidth: "calc(100vw - 24px)",
      }}
    >
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: "100%",
          height: 46,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(20,24,31,0.96)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 14px",
          fontSize: 13,
          cursor: "pointer",
          boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
          backdropFilter: "blur(10px)",
        }}
      >
        <span style={{ fontWeight: 700 }}>Traduction</span>
        <span style={{ color: "#b6c0cf", fontSize: 12 }}>
          {sourceLabel} → {targetLabel}
        </span>
      </button>

      {open && (
        <div
          style={{
            marginTop: 8,
            background: "rgba(16,19,25,0.98)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 10,
            boxShadow: "0 16px 40px rgba(0,0,0,0.34)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            style={{
              color: "#8f9aac",
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 6px 10px",
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            Paramètres linguistiques
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#cfd7e3",
                  marginBottom: 6,
                  paddingLeft: 4,
                }}
              >
                Langue parlée
              </div>

              <select
                value={sourceLanguage}
                onChange={(e) => {
                  const value = e.target.value
                  setSourceLanguage(value)
                  localStorage.setItem("talkglobal_source_language", value)
                  notifyLanguageChanged()
                }}
                style={{
                  width: "100%",
                  height: 42,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "#242933",
                  color: "#fff",
                  padding: "0 12px",
                  fontSize: 13,
                  outline: "none",
                }}
              >
                {LANGUAGES.map((language) => (
                  <option key={`source-${language.value}`} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#cfd7e3",
                  marginBottom: 6,
                  paddingLeft: 4,
                }}
              >
                Traduire vers
              </div>

              <select
                value={targetLanguage}
                onChange={(e) => {
                  const value = e.target.value
                  setTargetLanguage(value)
                  localStorage.setItem("talkglobal_target_language", value)
                  notifyLanguageChanged()
                }}
                style={{
                  width: "100%",
                  height: 42,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "#242933",
                  color: "#fff",
                  padding: "0 12px",
                  fontSize: 13,
                  outline: "none",
                }}
              >
                {LANGUAGES.map((language) => (
                  <option key={`target-${language.value}`} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
