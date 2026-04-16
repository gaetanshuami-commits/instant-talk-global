"use client"

import { useEffect, useRef, useState } from "react"

type LanguageOption = {
  label: string
  value: string
}

const LANGUAGES: LanguageOption[] = [
  { label: "Anglais",     value: "en" },
  { label: "Allemand",    value: "de" },
  { label: "Français",    value: "fr" },
  { label: "Italien",     value: "it" },
  { label: "Espagnol",    value: "es" },
  { label: "Russe",       value: "ru" },
  { label: "Polonais",    value: "pl" },
  { label: "Néerlandais", value: "nl" },
  { label: "Roumain",     value: "ro" },
  { label: "Portugais",   value: "pt" },
  { label: "Grec",        value: "el" },
  { label: "Suédois",     value: "sv" },
  { label: "Hongrois",    value: "hu" },
  { label: "Tchèque",     value: "cs" },
  { label: "Bulgare",     value: "bg" },
  { label: "Danois",      value: "da" },
  { label: "Finnois",     value: "fi" },
  { label: "Slovaque",    value: "sk" },
  { label: "Norvégien",   value: "no" },
  { label: "Turc",        value: "tr" },
  { label: "Coréen",      value: "ko" },
  { label: "Japonais",    value: "ja" },
  { label: "Arabe",       value: "ar" },
  { label: "Mandarin",    value: "zh" },
  { label: "Hindi",       value: "hi" },
  { label: "Swahili",     value: "sw" },
  { label: "Thaï",        value: "th" },
  { label: "Vietnamien",  value: "vi" },
]

type Props = {
  value: string
  onChange: (value: string) => void
  title?: string
  compact?: boolean
}

export default function LanguageSelector({
  value,
  onChange,
  title = "Langue",
  compact = false,
}: Props) {
  const [open, setOpen]       = useState(false)
  const [fixedPos, setFixedPos] = useState<{ bottom: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const dropRef = useRef<HTMLDivElement | null>(null)

  // Fermer au clic en dehors
  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent | TouchEvent) {
      const target = "touches" in e ? e.touches[0]?.target : (e.target as Node)
      if (
        target &&
        !btnRef.current?.contains(target as Node) &&
        !dropRef.current?.contains(target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutside)
    document.addEventListener("touchstart", handleOutside, { passive: true })
    return () => {
      document.removeEventListener("mousedown", handleOutside)
      document.removeEventListener("touchstart", handleOutside)
    }
  }, [open])

  // Ajustement horizontal pour rester dans le viewport
  useEffect(() => {
    if (!open || !dropRef.current || !fixedPos) return
    const drop = dropRef.current
    requestAnimationFrame(() => {
      if (!drop) return
      const rect = drop.getBoundingClientRect()
      const vpW  = window.innerWidth
      if (rect.right > vpW - 8) {
        drop.style.left = `${Math.max(8, fixedPos.left - (rect.right - (vpW - 8)))}px`
      }
    })
  }, [open, fixedPos])

  function handleToggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      // Positionne le dropdown au-dessus du bouton en coordonnées viewport
      setFixedPos({
        bottom: window.innerHeight - r.top + 8,
        left:   r.left,
      })
    }
    setOpen(prev => !prev)
  }

  const current = LANGUAGES.find(l => l.value === value) ?? LANGUAGES[0]

  return (
    <div style={{ position: "relative" }}>
      {/* Bouton déclencheur */}
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        aria-label={title}
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          gap: compact ? "4px" : "6px",
          height: compact ? "30px" : "40px",
          padding: compact ? "0 8px" : "0 12px",
          borderRadius: "10px",
          border: "1px solid rgba(255,255,255,0.12)",
          background: open ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.08)",
          color: "white",
          fontSize: compact ? "11px" : "13px",
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
          transition: "background 0.15s",
          maxWidth: compact ? "90px" : "130px",
          touchAction: "manipulation",
        }}
      >
        {!compact && (
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"
            style={{ width: 14, height: 14, flexShrink: 0, opacity: 0.6 }}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0 0c-1.933 0-3.5-3.582-3.5-8S8.067 2 10 2m0 16c1.933 0 3.5-3.582 3.5-8S11.933 2 10 2M2 10h16" />
          </svg>
        )}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {compact ? current.label.split(" ")[0] : current.label}
        </span>
        <svg viewBox="0 0 12 12" fill="currentColor"
          style={{ width: 10, height: 10, flexShrink: 0, opacity: 0.4,
            transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
          <path d="M6 8L1 3h10L6 8z"/>
        </svg>
      </button>

      {/* Dropdown — position: fixed pour ne jamais perturber les vidéos */}
      {open && fixedPos && (
        <div
          ref={dropRef}
          style={{
            position: "fixed",
            bottom:   fixedPos.bottom,
            left:     fixedPos.left,
            zIndex:   99999,
            width:    "200px",
            borderRadius: "16px",
            border:   "1px solid rgba(255,255,255,0.1)",
            background:   "rgba(10,12,26,0.98)",
            boxShadow:    "0 -8px 32px rgba(0,0,0,0.7)",
            backdropFilter: "blur(20px)",
            overflow: "hidden",
            willChange: "transform",
          }}
        >
          {/* En-tête */}
          <div style={{
            padding: "10px 14px 8px",
            fontSize: "10px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.45)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}>
            {title}
          </div>

          {/* Liste scrollable */}
          <div style={{
            maxHeight: "min(260px, 50vh)",
            overflowY: "auto",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
            padding: "6px",
          }}>
            {LANGUAGES.map(lang => {
              const active = lang.value === value
              return (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => { onChange(lang.value); setOpen(false) }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "8px 10px",
                    marginBottom: "2px",
                    borderRadius: "10px",
                    border: "none",
                    background: active ? "#2563eb" : "transparent",
                    color: active ? "white" : "rgba(255,255,255,0.85)",
                    fontSize: "13px",
                    fontWeight: active ? 600 : 400,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.1s",
                    minHeight: "40px",
                    touchAction: "manipulation",
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)" }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
                >
                  <span>{lang.label}</span>
                  {active && (
                    <svg viewBox="0 0 16 16" fill="currentColor" style={{ width: 14, height: 14, flexShrink: 0 }}>
                      <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
