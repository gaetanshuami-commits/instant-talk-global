"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

const NODE_COUNT = 90
const MAX_DIST = 160
const SPEED = 0.0003

export default function ThreeBackground() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = mountRef.current
    if (!el) return

    // ── Renderer ────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(el.clientWidth, el.clientHeight)
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)

    // ── Scene / Camera ───────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 1000)
    camera.position.z = 350

    // ── Nodes ────────────────────────────────────────────────────────────────
    const nodeGeo = new THREE.SphereGeometry(2, 8, 8)
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x6366f1, transparent: true, opacity: 0.7 })

    type NodeMesh = THREE.Mesh & { velocity: THREE.Vector3 }
    const nodes: NodeMesh[] = []

    const spread = 280
    for (let i = 0; i < NODE_COUNT; i++) {
      const mesh = new THREE.Mesh(nodeGeo, nodeMat.clone()) as unknown as NodeMesh
      mesh.position.set(
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread * 0.4,
      )
      // Random drift velocity
      mesh.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.25,
        (Math.random() - 0.5) * 0.25,
        (Math.random() - 0.5) * 0.08,
      )
      // Vary size slightly
      const s = 0.4 + Math.random() * 0.8
      mesh.scale.setScalar(s)
      // Vary color: indigo / violet / cyan accent
      const palette = [0x6366f1, 0x7c3aed, 0xa855f7, 0x06b6d4, 0x4f46e5]
      ;(mesh.material as THREE.MeshBasicMaterial).color.setHex(
        palette[Math.floor(Math.random() * palette.length)]
      )
      ;(mesh.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.random() * 0.45
      scene.add(mesh)
      nodes.push(mesh)
    }

    // ── Edges (line segments reused) ─────────────────────────────────────────
    const maxEdges = 300
    const positions = new Float32Array(maxEdges * 6) // 2 vertices × 3 coords
    const colors    = new Float32Array(maxEdges * 6)
    const edgeGeo   = new THREE.BufferGeometry()
    edgeGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage))
    edgeGeo.setAttribute("color",    new THREE.BufferAttribute(colors,    3).setUsage(THREE.DynamicDrawUsage))
    const edgeMat = new THREE.LineSegments(
      edgeGeo,
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.25 })
    )
    scene.add(edgeMat)

    // ── Resize ───────────────────────────────────────────────────────────────
    let rafId: number
    const onResize = () => {
      const w = el.clientWidth, h = el.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener("resize", onResize)

    // ── Pause when tab hidden ─────────────────────────────────────────────────
    let paused = false
    const onVis = () => { paused = document.hidden }
    document.addEventListener("visibilitychange", onVis)

    // ── Animate ───────────────────────────────────────────────────────────────
    let lastTime = 0
    const halfSpread = spread / 2
    // Reuse a single Vector3 across frames — avoids GC allocation every 40 ms
    const tmp = new THREE.Vector3()

    const animate = (time: number) => {
      rafId = requestAnimationFrame(animate)
      if (paused) return

      // ~25 fps cap to stay light
      if (time - lastTime < 40) return
      lastTime = time

      // Move nodes + bounce off bounding box
      for (const n of nodes) {
        n.position.addScaledVector(n.velocity, 1)
        if (Math.abs(n.position.x) > halfSpread) n.velocity.x *= -1
        if (Math.abs(n.position.y) > halfSpread) n.velocity.y *= -1
        if (Math.abs(n.position.z) > halfSpread * 0.4) n.velocity.z *= -1
      }

      // Slow global rotation
      scene.rotation.y += SPEED
      scene.rotation.x += SPEED * 0.3

      // Rebuild edges
      let edgeIdx = 0
      const pos = edgeGeo.attributes.position as THREE.BufferAttribute
      const col = edgeGeo.attributes.color   as THREE.BufferAttribute

      for (let i = 0; i < nodes.length && edgeIdx < maxEdges; i++) {
        for (let j = i + 1; j < nodes.length && edgeIdx < maxEdges; j++) {
          const dist = nodes[i].position.distanceTo(nodes[j].position)
          if (dist > MAX_DIST) continue
          const alpha = 1 - dist / MAX_DIST // 1 = close, 0 = far
          const base = edgeIdx * 6
          tmp.copy(nodes[i].position)
          pos.array[base]     = tmp.x; pos.array[base + 1] = tmp.y; pos.array[base + 2] = tmp.z
          tmp.copy(nodes[j].position)
          pos.array[base + 3] = tmp.x; pos.array[base + 4] = tmp.y; pos.array[base + 5] = tmp.z
          // Indigo-ish edge color
          col.array[base]     = 0.39 * alpha; col.array[base + 1] = 0.40 * alpha; col.array[base + 2] = 0.95 * alpha
          col.array[base + 3] = 0.39 * alpha; col.array[base + 4] = 0.40 * alpha; col.array[base + 5] = 0.95 * alpha
          edgeIdx++
        }
      }

      pos.needsUpdate = true
      col.needsUpdate = true
      edgeGeo.setDrawRange(0, edgeIdx * 2)

      renderer.render(scene, camera)
    }

    rafId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener("resize", onResize)
      document.removeEventListener("visibilitychange", onVis)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.55,
      }}
    />
  )
}
