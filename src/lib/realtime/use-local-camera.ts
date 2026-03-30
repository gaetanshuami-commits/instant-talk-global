'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import { LocalParticipant } from 'livekit-client';

export function useLocalCamera() {
  const { localParticipant } = useLocalParticipant();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!localParticipant || !videoRef.current) return;

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 },
            facingMode: 'user',
          },
          audio: false,
        });

        const videoTrack = stream.getVideoTracks()[0];
        if (!videoTrack) {
          throw new Error('No video track');
        }

        const settings = videoTrack.getSettings();
        console.log('[Camera]', {
          width: settings.width,
          height: settings.height,
          frameRate: settings.frameRate,
        });

        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Camera error');
        console.error('[Camera] Error:', err);
      }
    };

    initCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [localParticipant]);

  return { videoRef, cameraReady, error };
}
