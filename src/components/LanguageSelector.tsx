"use client"

import { useEffect, useRef, useState } from "react"

type LanguageOption = {
  label: string
  value: string
}

const LANGUAGES: LanguageOption[] = [
  { label: "Anglais", value: "en" },
  { label: "Allemand", value: "de" },
  { label: "Français", value: "fr" },
  { label: "Italien", value: "it" },
  { label: "Espagnol", value: "es" },
  { label: "Russe", value: "ru" },
  { label: "Polonais", value: "pl" },
  { label: "Néerlandais", value: "nl" },
  { label: "Roumain", value: "ro" },
  { label: "Portugais", value: "pt" },
  { label: "Grec", value: "el" },
  { label: "Suédois", value: "sv" },
  { label: "Hongrois", value: "hu" },
  { label: "Tchèque", value: "cs" },
  { label: "Bulgare", value: "bg" },
  { label: "Danois", value: "da" },
  { label: "Finnois", value: "fi" },
  { label: "Slovaque", value: "sk" },
  { label: "Norvégien", value: "no" },
  { label: "Turc", value: "tr" },
  { label: "Coréen", value: "ko" },
  { label: "Japonais", value: "ja" },
  { label: "Arabe", value: "ar" },
  { label: "Mandarin (Chinois)", value: "zh-Hans" },
  { label: "Hindi", value: "hi" },
  { label: "Swahili", value: "sw" }
]

type Props = {
  value: string
  onChange: (value: string) => void
  title?: string
}

export default function LanguageSelector({
  value,
  onChange,
  title = "Langue"
}: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current) return
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const current =
    LANGUAGES.find((lang) => lang.value === value) ?? LANGUAGES[0]

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-12 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 text-sm font-medium text-white shadow-lg backdrop-blur-md transition hover:bg-white/15"
        aria-label={title}
      >
        <span className="text-base">🌐</span>
        <span className="max-w-[110px] truncate">{current.label}</span>
      </button>

      {open ? (
        <div className="absolute bottom-16 right-0 z-50 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a]/95 shadow-2xl backdrop-blur-xl">
          <div className="border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white/70">
            {title}
          </div>

          <div className="max-h-72 overflow-y-auto p-2">
            {LANGUAGES.map((lang) => {
              const active = lang.value === value

              return (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => {
                    onChange(lang.value)
                    setOpen(false)
                  }}
                  className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-white/90 hover:bg-white/10"
                  }`}
                >
                  <span className="truncate">{lang.label}</span>
                  {active ? <span className="ml-3 text-xs">✓</span> : null}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
