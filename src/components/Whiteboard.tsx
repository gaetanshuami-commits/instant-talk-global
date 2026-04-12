"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { X, Pen, Eraser, StickyNote, Trash2, Minus, Plus, Undo2 } from "lucide-react"

type Tool = "pen" | "eraser" | "sticky"

type DrawPath = {
  points: { x: number; y: number }[]
  color: string
  size: number
}

type Sticky = {
  id: string
  x: number; y: number
  text: string
  color: string
}

type Event =
  | { type: "draw";   data: DrawPath }
  | { type: "sticky"; data: Sticky }
  | { type: "clear";  data: null }
  | { type: "erase";  data: { x: number; y: number; r: number } }

type Props = { roomId: string; onClose: () => void }

const COLORS = ["#ffffff","#6366f1","#22c55e","#f59e0b","#ef4444","#06b6d4","#a855f7","#ec4899"]
const STICKY_COLORS = ["#fef08a","#bbf7d0","#bfdbfe","#fecaca","#e9d5ff"]

let _seq = 0

export default function Whiteboard({ roomId, onClose }: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const [tool, setTool]     = useState<Tool>("pen")
  const [color, setColor]   = useState("#ffffff")
  const [size, setSize]     = useState(3)
  const [stickies, setStickies] = useState<Sticky[]>([])
  const [paths, setPaths]   = useState<DrawPath[]>([])
  const drawing      = useRef(false)
  const currentPath  = useRef<DrawPath | null>(null)
  const seqRef       = useRef(0)
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const [newSticky, setNewSticky] = useState<{ x: number; y: number } | null>(null)
  const [stickyText, setStickyText] = useState("")
  const [stickyColor, setStickyColor] = useState(STICKY_COLORS[0])

  // ── Render all paths onto canvas ──────────────────────────────────────────
  const redraw = useCallback((allPaths: DrawPath[], canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const path of allPaths) {
      if (path.points.length < 2) continue
      ctx.beginPath()
      ctx.moveTo(path.points[0].x, path.points[0].y)
      for (let i = 1; i < path.points.length; i++) ctx.lineTo(path.points[i].x, path.points[i].y)
      ctx.strokeStyle = path.color
      ctx.lineWidth   = path.size
      ctx.lineCap     = "round"
      ctx.lineJoin    = "round"
      ctx.stroke()
    }
  }, [])

  // ── Broadcast event to server ─────────────────────────────────────────────
  const broadcast = useCallback(async (evt: Event) => {
    await fetch(`/api/whiteboard/${encodeURIComponent(roomId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(evt),
    }).catch(() => {})
  }, [roomId])

  // ── Apply incoming events ─────────────────────────────────────────────────
  const applyEvent = useCallback((evt: { type: string; data: unknown }, allPaths: DrawPath[], allStickies: Sticky[]): { paths: DrawPath[]; stickies: Sticky[] } => {
    if (evt.type === "clear") return { paths: [], stickies: [] }
    if (evt.type === "draw")  return { paths: [...allPaths, evt.data as DrawPath], stickies: allStickies }
    if (evt.type === "sticky") return { paths: allPaths, stickies: [...allStickies, evt.data as Sticky] }
    return { paths: allPaths, stickies: allStickies }
  }, [])

  // ── Poll server for new events ────────────────────────────────────────────
  useEffect(() => {
    const poll = async () => {
      try {
        const r = await fetch(`/api/whiteboard/${encodeURIComponent(roomId)}?since=${seqRef.current}`)
        if (!r.ok) return
        const d = await r.json() as { events: ({ type: string; data: unknown; seq: number })[]; seq: number }
        if (d.events.length === 0) return
        let p = paths
        let s = stickies
        for (const evt of d.events) {
          const res = applyEvent(evt, p, s)
          p = res.paths
          s = res.stickies
          seqRef.current = evt.seq
        }
        setPaths(p)
        setStickies(s)
        if (canvasRef.current) redraw(p, canvasRef.current)
      } catch {}
    }
    pollRef.current = setInterval(poll, 400)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, applyEvent, redraw])

  // ── Mouse events ──────────────────────────────────────────────────────────
  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === "sticky") {
      setNewSticky(getPos(e))
      return
    }
    drawing.current = true
    const pos = getPos(e)
    currentPath.current = {
      points: [pos],
      color: tool === "eraser" ? "#111827" : color,
      size: tool === "eraser" ? size * 5 : size,
    }
  }

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !currentPath.current || !canvasRef.current) return
    const pos = getPos(e)
    currentPath.current.points.push(pos)
    const ctx = canvasRef.current.getContext("2d")!
    const pts = currentPath.current.points
    if (pts.length < 2) return
    ctx.beginPath()
    ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y)
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y)
    ctx.strokeStyle = currentPath.current.color
    ctx.lineWidth   = currentPath.current.size
    ctx.lineCap = "round"; ctx.lineJoin = "round"
    ctx.stroke()
  }

  const onMouseUp = async () => {
    if (!drawing.current || !currentPath.current) return
    drawing.current = false
    const path = currentPath.current
    currentPath.current = null
    if (path.points.length < 2) return
    const newPaths = [...paths, path]
    setPaths(newPaths)
    await broadcast({ type: "draw", data: path })
    _seq++
  }

  const clearBoard = async () => {
    setPaths([])
    setStickies([])
    if (canvasRef.current) canvasRef.current.getContext("2d")!.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    await broadcast({ type: "clear", data: null })
  }

  const undoLast = () => {
    if (paths.length === 0) return
    const next = paths.slice(0, -1)
    setPaths(next)
    if (canvasRef.current) redraw(next, canvasRef.current)
  }

  const addSticky = async () => {
    if (!newSticky || !stickyText.trim()) { setNewSticky(null); return }
    const sticky: Sticky = { id: `s-${Date.now()}`, x: newSticky.x, y: newSticky.y, text: stickyText, color: stickyColor }
    setStickies(prev => [...prev, sticky])
    setNewSticky(null)
    setStickyText("")
    await broadcast({ type: "sticky", data: sticky })
  }

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "min(95vw, 1100px)", height: "min(90vh, 700px)", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.1)", background: "#0d0d14", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.8)" }}>

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexWrap: "wrap" }}>
          {/* Tool buttons */}
          {([["pen","Stylo",Pen],["eraser","Gomme",Eraser],["sticky","Post-it",StickyNote]] as const).map(([t, lbl, Icon]) => (
            <button key={t} onClick={() => setTool(t)} title={lbl} style={{ height: 34, padding: "0 12px", borderRadius: "9px", border: "1px solid", borderColor: tool === t ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.1)", background: tool === t ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)", color: tool === t ? "#a5b4fc" : "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", fontWeight: 600 }}>
              <Icon size={13} /> {lbl}
            </button>
          ))}

          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)" }} />

          {/* Colors */}
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: color === c ? "2px solid white" : "2px solid transparent", cursor: "pointer", boxShadow: color === c ? `0 0 8px ${c}` : "none" }} />
          ))}

          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)" }} />

          {/* Stroke size */}
          <button onClick={() => setSize(s => Math.max(1, s - 1))} style={{ width: 28, height: 28, borderRadius: "7px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={12} /></button>
          <span style={{ fontSize: "12px", opacity: 0.6, minWidth: "20px", textAlign: "center" }}>{size}</span>
          <button onClick={() => setSize(s => Math.min(20, s + 1))} style={{ width: 28, height: 28, borderRadius: "7px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={12} /></button>

          <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
            <button onClick={undoLast} title="Annuler" style={{ height: 32, padding: "0 12px", borderRadius: "9px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "12.5px" }}>
              <Undo2 size={13} /> Annuler
            </button>
            <button onClick={clearBoard} title="Effacer tout" style={{ height: 32, padding: "0 12px", borderRadius: "9px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.1)", color: "#fca5a5", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "12.5px" }}>
              <Trash2 size={13} /> Effacer
            </button>
            <button onClick={onClose} style={{ height: 32, width: 32, borderRadius: "9px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={15} /></button>
          </div>
        </div>

        {/* Canvas area */}
        <div style={{ flex: 1, position: "relative", background: "#111218", overflow: "hidden" }}>
          {/* Grid background */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />

          <canvas
            ref={canvasRef}
            width={1080}
            height={640}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: tool === "eraser" ? "cell" : tool === "sticky" ? "crosshair" : "crosshair" }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          />

          {/* Sticky notes overlay */}
          {stickies.map(s => (
            <div
              key={s.id}
              style={{
                position: "absolute",
                left: `${(s.x / 1080) * 100}%`,
                top: `${(s.y / 640) * 100}%`,
                transform: "translate(-50%, -50%)",
                minWidth: "120px", maxWidth: "200px",
                padding: "10px 12px",
                borderRadius: "4px",
                background: s.color,
                color: "#1a1a1a",
                fontSize: "13px",
                fontWeight: 600,
                lineHeight: 1.5,
                boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                pointerEvents: "none",
                fontFamily: "'Comic Sans MS', cursive",
              }}
            >
              {s.text}
              {/* Fold corner */}
              <div style={{ position: "absolute", bottom: 0, right: 0, width: 0, height: 0, borderStyle: "solid", borderWidth: "0 0 14px 14px", borderColor: `transparent transparent rgba(0,0,0,0.15) transparent` }} />
            </div>
          ))}

          {/* New sticky input */}
          {newSticky && (
            <div style={{ position: "absolute", left: `${(newSticky.x / 1080) * 100}%`, top: `${(newSticky.y / 640) * 100}%`, transform: "translate(-50%,-100%)", zIndex: 10, display: "flex", flexDirection: "column", gap: "6px", background: "#1e1e2e", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "12px", padding: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.6)", minWidth: "220px" }}>
              <div style={{ display: "flex", gap: "5px" }}>
                {STICKY_COLORS.map(c => <button key={c} onClick={() => setStickyColor(c)} style={{ width: 18, height: 18, borderRadius: "4px", background: c, border: stickyColor === c ? "2px solid white" : "1px solid transparent", cursor: "pointer" }} />)}
              </div>
              <textarea
                autoFocus
                value={stickyText}
                onChange={e => setStickyText(e.target.value)}
                placeholder="Texte du post-it..."
                rows={3}
                style={{ width: "100%", background: stickyColor, color: "#1a1a1a", border: "none", borderRadius: "6px", padding: "8px", fontSize: "13px", outline: "none", resize: "none", fontFamily: "'Comic Sans MS', cursive", boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={addSticky} style={{ flex: 1, height: 30, borderRadius: "8px", border: 0, background: "linear-gradient(135deg, #6366f1, #7c3aed)", color: "white", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}>Ajouter</button>
                <button onClick={() => setNewSticky(null)} style={{ width: 30, height: 30, borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={12} /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
