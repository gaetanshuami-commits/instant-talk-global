"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, Mic, Speaker, CheckCircle, XCircle, AlertTriangle, ArrowRight, RefreshCw, Globe, Volume2 } from "lucide-react";

type CheckStatus = "idle" | "checking" | "ok" | "error" | "warning";

type DeviceInfo = { label: string; deviceId: string };

export default function DeviceCheckPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);

  const [camStatus, setCamStatus]     = useState<CheckStatus>("idle");
  const [micStatus, setMicStatus]     = useState<CheckStatus>("idle");
  const [speakerStatus, setSpeakerStatus] = useState<CheckStatus>("idle");
  const [netStatus, setNetStatus]     = useState<CheckStatus>("idle");
  const [volume, setVolume]           = useState(0);

  const [cameras, setCameras]         = useState<DeviceInfo[]>([]);
  const [mics, setMics]               = useState<DeviceInfo[]>([]);
  const [selectedCam, setSelectedCam] = useState("");
  const [selectedMic, setSelectedMic] = useState("");
  const [step, setStep]               = useState<"camera" | "mic" | "speaker" | "network" | "done">("camera");

  /* ── enumerate devices ── */
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      setCameras(devices.filter((d) => d.kind === "videoinput").map((d) => ({ label: d.label || "Caméra", deviceId: d.deviceId })));
      setMics(devices.filter((d) => d.kind === "audioinput").map((d) => ({ label: d.label || "Microphone", deviceId: d.deviceId })));
    }).catch(() => {});
    return () => cleanup();
  }, []);

  function cleanup() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    cancelAnimationFrame(animFrameRef.current);
  }

  /* ── camera test ── */
  async function testCamera() {
    setCamStatus("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: selectedCam ? { deviceId: { exact: selectedCam } } : true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      if (!cameras.length) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setCameras(devices.filter((d) => d.kind === "videoinput").map((d) => ({ label: d.label || "Caméra", deviceId: d.deviceId })));
        setMics(devices.filter((d) => d.kind === "audioinput").map((d) => ({ label: d.label || "Micro", deviceId: d.deviceId })));
      }
      setCamStatus("ok");
    } catch {
      setCamStatus("error");
    }
  }

  /* ── mic test ── */
  async function testMic() {
    setMicStatus("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedMic ? { deviceId: { exact: selectedMic } } : true,
        video: false,
      });
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      source.connect(analyser);
      setMicStatus("ok");

      const data = new Uint8Array(analyser.frequencyBinCount);
      function tick() {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setVolume(Math.min(100, avg * 2.5));
        animFrameRef.current = requestAnimationFrame(tick);
      }
      tick();
    } catch {
      setMicStatus("error");
    }
  }

  /* ── speaker test ── */
  async function testSpeaker() {
    setSpeakerStatus("checking");
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
      await new Promise((r) => setTimeout(r, 600));
      setSpeakerStatus("ok");
    } catch {
      setSpeakerStatus("error");
    }
  }

  /* ── network test ── */
  async function testNetwork() {
    setNetStatus("checking");
    try {
      const t0 = Date.now();
      await fetch("/api/meetings", { signal: AbortSignal.timeout(4000) });
      const latency = Date.now() - t0;
      setNetStatus(latency < 300 ? "ok" : latency < 800 ? "warning" : "error");
    } catch {
      setNetStatus("error");
    }
  }

  const allOk = camStatus === "ok" && micStatus === "ok" && speakerStatus === "ok" && netStatus === "ok";

  const steps = [
    {
      id: "camera",
      label: "Caméra",
      icon: Camera,
      status: camStatus,
      action: () => { testCamera(); setStep("camera"); },
      desc: "Nous vérifions que votre caméra fonctionne correctement.",
    },
    {
      id: "mic",
      label: "Microphone",
      icon: Mic,
      status: micStatus,
      action: () => { testMic(); setStep("mic"); },
      desc: "Parlez dans le micro pour vérifier le niveau audio.",
    },
    {
      id: "speaker",
      label: "Haut-parleurs",
      icon: Volume2,
      status: speakerStatus,
      action: () => { testSpeaker(); setStep("speaker"); },
      desc: "Un son de test va être émis — confirmez que vous l'entendez.",
    },
    {
      id: "network",
      label: "Réseau",
      icon: Globe,
      status: netStatus,
      action: () => { testNetwork(); setStep("network"); },
      desc: "Vérification de la connectivité avec les serveurs Instant Talk.",
    },
  ];

  function statusIcon(s: CheckStatus) {
    if (s === "ok")       return <CheckCircle size={18} color="#22c55e" />;
    if (s === "error")    return <XCircle size={18} color="#ef4444" />;
    if (s === "warning")  return <AlertTriangle size={18} color="#f59e0b" />;
    if (s === "checking") return <RefreshCw size={18} color="#6366f1" style={{ animation: "spin 1s linear infinite" }} />;
    return <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)" }} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #04070f 0%, #07101e 100%)", color: "white", fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}>

      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "18px 40px", display: "flex", alignItems: "center", gap: "12px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", color: "white" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "linear-gradient(135deg, #6366f1, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Globe size={16} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: "15px" }}>Instant Talk</span>
        </Link>
        <span style={{ opacity: 0.3, fontSize: "18px" }}>/</span>
        <span style={{ opacity: 0.6, fontSize: "14px" }}>Test d'appareil</span>
      </header>

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "60px 24px 80px" }}>

        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", height: "28px", padding: "0 14px", borderRadius: "999px", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#a5b4fc", fontSize: "12px", fontWeight: 700, marginBottom: "20px" }}>
            <Camera size={12} /> Pré-test de réunion
          </div>
          <h1 style={{ fontSize: "42px", fontWeight: 900, letterSpacing: "-0.04em", margin: "0 0 16px" }}>
            Testez votre appareil
          </h1>
          <p style={{ opacity: 0.6, fontSize: "17px", maxWidth: "480px", margin: "0 auto" }}>
            Vérifiez caméra, micro et réseau avant de rejoindre une réunion pour une expérience parfaite.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

          {/* Left — video preview + steps */}
          <div>
            {/* Video */}
            <div style={{ borderRadius: "20px", overflow: "hidden", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", aspectRatio: "16/9", marginBottom: "20px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {camStatus === "ok"
                ? <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ textAlign: "center", opacity: 0.4 }}>
                    <Camera size={36} style={{ marginBottom: "8px" }} />
                    <div style={{ fontSize: "13px" }}>Aperçu caméra</div>
                  </div>
              }
              {camStatus === "ok" && (
                <div style={{ position: "absolute", bottom: "12px", left: "12px", height: "22px", padding: "0 10px", borderRadius: "999px", background: "rgba(34,197,94,0.2)", border: "1px solid rgba(34,197,94,0.35)", color: "#4ade80", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
                  LIVE
                </div>
              )}
            </div>

            {/* Mic level */}
            {micStatus === "ok" && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "12px", opacity: 0.5, marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
                  <span>Niveau micro</span>
                  <span>{Math.round(volume)}%</span>
                </div>
                <div style={{ height: "8px", borderRadius: "999px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${volume}%`, borderRadius: "999px", background: volume > 70 ? "#f59e0b" : "#22c55e", transition: "width 0.08s ease" }} />
                </div>
              </div>
            )}

            {/* Device selectors */}
            {cameras.length > 1 && (
              <select value={selectedCam} onChange={(e) => setSelectedCam(e.target.value)} style={{ width: "100%", height: "40px", borderRadius: "10px", padding: "0 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "13px", marginBottom: "8px" }}>
                {cameras.map((c) => <option key={c.deviceId} value={c.deviceId} style={{ background: "#07101e" }}>{c.label}</option>)}
              </select>
            )}
            {mics.length > 1 && (
              <select value={selectedMic} onChange={(e) => setSelectedMic(e.target.value)} style={{ width: "100%", height: "40px", borderRadius: "10px", padding: "0 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", fontSize: "13px" }}>
                {mics.map((m) => <option key={m.deviceId} value={m.deviceId} style={{ background: "#07101e" }}>{m.label}</option>)}
              </select>
            )}
          </div>

          {/* Right — checklist */}
          <div>
            <div style={{ borderRadius: "20px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", marginBottom: "20px" }}>
              {steps.map((s, i) => {
                const Icon = s.icon;
                const isCurrent = step === s.id;
                return (
                  <div key={s.id} style={{ padding: "18px 20px", background: isCurrent ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.02)", borderBottom: i < steps.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none", display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "rgba(255,255,255,0.5)" }}>
                      <Icon size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "14px" }}>{s.label}</div>
                      <div style={{ fontSize: "12px", opacity: 0.45, marginTop: "2px" }}>{s.desc}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {statusIcon(s.status)}
                      <button
                        onClick={s.action}
                        style={{ height: "28px", padding: "0 12px", borderRadius: "7px", border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.12)", color: "#a5b4fc", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                      >
                        {s.status === "idle" ? "Tester" : "Re-tester"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            {allOk ? (
              <div style={{ borderRadius: "20px", padding: "24px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <CheckCircle size={20} color="#22c55e" />
                  <div style={{ fontWeight: 800, fontSize: "16px", color: "#4ade80" }}>Tout est prêt !</div>
                </div>
                <p style={{ fontSize: "13px", opacity: 0.7, marginBottom: "16px" }}>Caméra, micro, haut-parleurs et réseau — tout est opérationnel. Vous pouvez rejoindre votre réunion.</p>
                <Link href="/dashboard/meetings" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "44px", borderRadius: "999px", background: "linear-gradient(135deg, #22c55e, #16a34a)", color: "white", fontWeight: 800, textDecoration: "none", fontSize: "14px" }}>
                  Rejoindre une réunion <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div style={{ borderRadius: "20px", padding: "24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p style={{ fontSize: "13px", opacity: 0.6, marginBottom: "16px" }}>Lancez chaque test dans l'ordre pour vérifier votre configuration.</p>
                <button
                  onClick={() => { testCamera(); testMic(); testSpeaker(); testNetwork(); }}
                  style={{ width: "100%", height: "44px", borderRadius: "999px", border: 0, background: "linear-gradient(135deg, #6366f1, #7c3aed)", color: "white", fontWeight: 800, cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  <RefreshCw size={15} /> Tout tester automatiquement
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
