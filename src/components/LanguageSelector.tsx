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
  /** Compact mode: smaller button for mobile control bar */
  compact?: boolean
}

export default function LanguageSelector({
  value,
  onChange,
  title = "Langue",
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const dropRef = useRef<HTMLDivElement | null>(null)

  // Close on interaction outside — handles both mouse and touch
  useEffect(() => {
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (!rootRef.current) return
      const target = "touches" in e ? e.touches[0]?.target : e.target
      if (target && !rootRef.current.contains(target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutside)
    document.addEventListener("touchstart", handleOutside, { passive: true })
    return () => {
      document.removeEventListener("mousedown", handleOutside)
      document.removeEventListener("touchstart", handleOutside)
    }
  }, [])

  // Adjust dropdown horizontal position so it never overflows the viewport
  useEffect(() => {
    if (!open || !dropRef.current) return
    const drop = dropRef.current
    // Reset to default (align right edge to trigger right edge)
    drop.style.left  = ""
    drop.style.right = "0"
    // Measure after paint so getBoundingClientRect is accurate
    requestAnimationFrame(() => {
      if (!drop) return
      const rect = drop.getBoundingClientRect()
      const vpW  = window.innerWidth
      if (rect.left < 8) {
        drop.style.right = ""
        drop.style.left  = "0"
      } else if (rect.right > vpW - 8) {
        drop.style.right = `${rect.right - (vpW - 8)}px`
        drop.style.left  = ""
      }
    })
  }, [open])

  const current = LANGUAGES.find(l => l.value === value) ?? LANGUAGES[0]

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-label={title}
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
          // Eliminates 300 ms tap delay on mobile without disabling pinch-zoom
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

      {/* Dropdown */}
      {open && (
        <div
          ref={dropRef}
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            right: 0,
            zIndex: 9999,
            width: "200px",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(10,12,26,0.97)",
            boxShadow: "0 -8px 32px rgba(0,0,0,0.6)",
            backdropFilter: "blur(20px)",
            overflow: "hidden",
            // Promote to own compositing layer — smoother rendering on mobile GPU
            willChange: "transform",
          }}
        >
          {/* Header */}
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

          {/* Scrollable list — mobile-optimised */}
          <div style={{
            // Adapts to viewport so dropdown never exits the screen on short phones
            maxHeight: "min(240px, 45vh)",
            overflowY: "auto",
            // Prevents scroll from propagating to the page behind the footer
            overscrollBehavior: "contain",
            // Smooth momentum scroll on iOS Safari
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
                    // 44px touch target meets WCAG 2.5.5 — prevents mis-taps on mobile
                    minHeight: "44px",
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
