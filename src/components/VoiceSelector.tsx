"use client"

import type { VoiceGender } from "@/core/voiceEngine"

export default function VoiceSelector({
  value,
  onChange,
}: {
  value: VoiceGender
  onChange: (v: VoiceGender) => void
}) {
  return (
    <div className="flex items-center rounded-xl bg-zinc-800 p-1 gap-1">
      <button
        type="button"
        onClick={() => onChange("female")}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
          value === "female"
            ? "bg-white text-black shadow"
            : "text-white/55 hover:text-white/90"
        }`}
      >
        Femme
      </button>
      <button
        type="button"
        onClick={() => onChange("male")}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
          value === "male"
            ? "bg-white text-black shadow"
            : "text-white/55 hover:text-white/90"
        }`}
      >
        Homme
      </button>
    </div>
  )
}
