"use client"

export default function LiveSubtitles({
  text,
}: {
  text: string
}) {
  if (!text || !text.trim()) return null

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
      <div className="max-w-[78%] rounded-2xl border border-white/10 bg-black/46 px-5 py-3 text-center text-sm font-medium text-white shadow-[0_12px_30px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        {text}
      </div>
    </div>
  )
}
