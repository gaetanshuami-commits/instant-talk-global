"use client";

import { useEffect, useRef, useState } from "react";

type CameraDebug = {
  deviceLabel: string;
  deviceId: string;
  width: number | string;
  height: number | string;
  frameRate: number | string;
  aspectRatio: number | string;
  facingMode: string;
  resizeMode: string;
  transformInline: string;
  transformComputed: string;
  objectFitInline: string;
  objectFitComputed: string;
  readyState: number;
};

export default function CameraDebugPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState("");
  const [debug, setDebug] = useState<CameraDebug | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function run() {
      try {
        const devicesBefore = await navigator.mediaDevices.enumerateDevices();

        const preferredCamera =
          devicesBefore.find(
            (d) =>
              d.kind === "videoinput" &&
              /front|facetime|integrated|webcam|camera/i.test(d.label)
          ) ||
          devicesBefore.find((d) => d.kind === "videoinput");

        const videoConstraints: MediaTrackConstraints = preferredCamera?.deviceId
          ? {
              deviceId: { exact: preferredCamera.deviceId },
              width: { ideal: 1920, max: 1920 },
              height: { ideal: 1080, max: 1080 },
              frameRate: { ideal: 30, max: 30 },
              aspectRatio: 16 / 9,
              facingMode: "user",
            }
          : {
              width: { ideal: 1920, max: 1920 },
              height: { ideal: 1080, max: 1080 },
              frameRate: { ideal: 30, max: 30 },
              aspectRatio: 16 / 9,
              facingMode: "user",
            };

        const constraints: MediaStreamConstraints = {
          audio: false,
          video: videoConstraints,
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);

        const videoTrack = stream.getVideoTracks()[0];
        if (!videoTrack) throw new Error("Aucune piste vidéo trouvée");

        try {
          await videoTrack.applyConstraints({
            width: { ideal: 1920, max: 1920 },
            height: { ideal: 1080, max: 1080 },
            frameRate: { ideal: 30, max: 30 },
            aspectRatio: 16 / 9,
            facingMode: "user",
          });
        } catch {}

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.autoplay = true;
          videoRef.current.playsInline = true;
          videoRef.current.style.transform = "none";
          videoRef.current.style.webkitTransform = "none";
          videoRef.current.style.objectFit = "cover";
          videoRef.current.style.setProperty("transform", "none", "important");
          videoRef.current.style.setProperty("-webkit-transform", "none", "important");
          videoRef.current.style.setProperty("object-fit", "cover", "important");
          await videoRef.current.play().catch(() => {});
        }

        const settings = videoTrack.getSettings();
        const computed = videoRef.current ? window.getComputedStyle(videoRef.current) : null;

        const result: CameraDebug = {
          deviceLabel: preferredCamera?.label || "inconnu",
          deviceId: settings.deviceId || preferredCamera?.deviceId || "inconnu",
          width: settings.width || 0,
          height: settings.height || 0,
          frameRate: settings.frameRate || 0,
          aspectRatio: settings.aspectRatio || 0,
          facingMode: String(settings.facingMode || ""),
          resizeMode: "",
          transformInline: videoRef.current?.style.transform || "",
          transformComputed: computed?.transform || "",
          objectFitInline: videoRef.current?.style.objectFit || "",
          objectFitComputed: computed?.objectFit || "",
          readyState: videoRef.current?.readyState || 0,
        };

        console.log("CAMERA_ROOT_CAUSE_DEBUG", result);
        setDebug(result);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Erreur caméra inconnue";
        console.error("CAMERA_ROOT_CAUSE_ERROR", e);
        setError(message);
      }
    }

    run();

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "white",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "16px" }}>
        Diagnostic caméra racine
      </h1>

      {error ? (
        <div
          style={{
            background: "#7f1d1d",
            border: "1px solid rgba(239,68,68,0.35)",
            padding: "14px",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      ) : null}

      <div
        style={{
          width: "100%",
          maxWidth: "960px",
          aspectRatio: "16 / 9",
          overflow: "hidden",
          borderRadius: "20px",
          background: "#111827",
          border: "1px solid rgba(255,255,255,0.08)",
          marginBottom: "20px",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            objectFit: "cover",
            transform: "none",
            WebkitTransform: "none",
          }}
        />
      </div>

      <pre
        style={{
          background: "#111827",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "16px",
          padding: "16px",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          lineHeight: 1.5,
        }}
      >
        {JSON.stringify(debug, null, 2)}
      </pre>
    </div>
  );
}