'use client';

import { useEffect, useRef } from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import { createLocalVideoTrack, Track } from 'livekit-client';

export default function LocalCamera() {
  const { localParticipant } = useLocalParticipant();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!localParticipant) return;

    let isMounted = true;
    let localTrack: any = null;

    const startProCamera = async () => {
      try {
        // 1. Nettoyage absolu pour éviter les conflits de flux
        const existingTracks = Array.from(localParticipant.videoTrackPublications.values());
        for (const pub of existingTracks) {
          if (pub.source === Track.Source.Camera && pub.track) {
            pub.track.stop();
            await localParticipant.unpublishTrack(pub.track);
          }
        }

        // 2. Standards exacts Zoom / Google Meet (16:9, 1080p idéal, fallback 720p propre)
        localTrack = await createLocalVideoTrack({
          resolution: { 
            width: { ideal: 1920, min: 1280 }, 
            height: { ideal: 1080, min: 720 }, 
            frameRate: { ideal: 30, max: 30 },
            aspectRatio: 1.777777778
          },
          facingMode: 'user',
        });

        if (!isMounted) {
          localTrack.stop();
          return;
        }

        // 3. Publication optimisée
        await localParticipant.publishTrack(localTrack, {
          simulcast: true, // Requis pour une qualité stable multiclients (comme Zoom)
          source: Track.Source.Camera,
          videoCodec: 'vp8',
        });

        // 4. Attachement direct pour bypasser le CSS restrictif de LiveKit
        if (videoRef.current) {
          videoRef.current.srcObject = localTrack.mediaStream;
        }
      } catch (error) {
        console.error('Erreur Caméra Pro (Type Zoom/Meet):', error);
      }
    };

    startProCamera();

    return () => {
      isMounted = false;
      if (localTrack) {
        localTrack.stop();
        if (localParticipant) {
          localParticipant.unpublishTrack(localTrack).catch(() => {});
        }
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
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block',
        // Le standard visuel Zoom/Meet : ta main gauche physique est à GAUCHE de ton moniteur
        transform: 'scaleX(-1)',
        WebkitTransform: 'scaleX(-1)'
      }}
    />
  );
}
