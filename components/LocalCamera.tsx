"use client";

import { useEffect, useRef } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import { createLocalVideoTrack, Track } from "livekit-client";

export default function LocalCamera() {
  const { localParticipant } = useLocalParticipant();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!localParticipant) return;

    let isMounted = true;
    let localTrack: any = null;

    const startProCamera = async () => {
      try {
        const existingTracks = Array.from(localParticipant.videoTrackPublications.values());
        for (const pub of existingTracks) {
          if (pub.source === Track.Source.Camera && pub.track) {
            pub.track.stop();
            await localParticipant.unpublishTrack(pub.track);
          }
        }

        localTrack = await createLocalVideoTrack({
          resolution: {
            width: 1920,
            height: 1080,
            frameRate: 30,
            aspectRatio: 16 / 9,
          },
          facingMode: "user",
        });

        if (!isMounted) {
          localTrack.stop();
          return;
        }

        await localParticipant.publishTrack(localTrack, {
          simulcast: true,
          source: Track.Source.Camera,
          videoCodec: "vp8",
        });

        if (videoRef.current) {
          videoRef.current.srcObject = localTrack.mediaStream;
        }
      } catch (error) {
        console.error("Erreur Caméra Pro (Type Zoom/Meet):", error);
      }
    };

    startProCamera();

    return () => {
      isMounted = false;
      if (localTrack) {
        localTrack.stop();
        localParticipant.unpublishTrack(localTrack).catch(() => {});
      }
    };
  }, [localParticipant]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        transform: "scaleX(-1)",
        WebkitTransform: "scaleX(-1)",
      }}
    />
  );
}