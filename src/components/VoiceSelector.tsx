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
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "3px",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "12px",
      padding: "3px",
    }}>
      {/* Female */}
      <button
        type="button"
        onClick={() => onChange("female")}
        title="Voix féminine"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          height: "28px",
          padding: "0 10px",
          borderRadius: "9px",
          border: "none",
          background: value === "female"
            ? "linear-gradient(135deg, #ec4899, #db2777)"
            : "transparent",
          color: value === "female" ? "white" : "rgba(255,255,255,0.5)",
          fontWeight: 700,
          fontSize: "12px",
          cursor: "pointer",
          transition: "all 0.15s",
          whiteSpace: "nowrap",
          boxShadow: value === "female" ? "0 3px 10px rgba(236,72,153,0.4)" : "none",
        }}
      >
        {/* Female icon */}
        <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 13, height: 13 }}>
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
        </svg>
        Femme
      </button>

      {/* Male */}
      <button
        type="button"
        onClick={() => onChange("male")}
        title="Voix masculine"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          height: "28px",
          padding: "0 10px",
          borderRadius: "9px",
          border: "none",
          background: value === "male"
            ? "linear-gradient(135deg, #3b82f6, #1d4ed8)"
            : "transparent",
          color: value === "male" ? "white" : "rgba(255,255,255,0.5)",
          fontWeight: 700,
          fontSize: "12px",
          cursor: "pointer",
          transition: "all 0.15s",
          whiteSpace: "nowrap",
          boxShadow: value === "male" ? "0 3px 10px rgba(59,130,246,0.4)" : "none",
        }}
      >
        {/* Male icon */}
        <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 13, height: 13 }}>
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
        </svg>
        Homme
      </button>
    </div>
  )
}
