'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseDeepgramBridgeOptions {
  targetLanguage: string;
  onTranscript: (text: string) => void;
  onTranslation: (text: string, language: string) => void;
  onError: (error: string) => void;
}

export function useDeepgramBridge({
  targetLanguage,
  onTranscript,
  onTranslation,
  onError,
}: UseDeepgramBridgeOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [bridgeConnected, setBridgeConnected] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // SE CONNECTER DIRECTEMENT AU BRIDGE SUR LE PORT 8787
  useEffect(() => {
    const connectBridge = () => {
      try {
        console.log('[PTT] Connecting to bridge ws://localhost:8787');
        const ws = new WebSocket('ws://localhost:8787');

        ws.onopen = () => {
          console.log('[PTT] Bridge connected');
          setBridgeConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[PTT] Message:', data.type);

            if (data.type === 'transcript' && data.text) {
              onTranscript(data.text);
            } else if (data.type === 'translation' && data.text) {
              onTranslation(data.text, data.language || targetLanguage);
            } else if (data.type === 'error') {
              onError(data.message);
            }
          } catch (error) {
            console.error('[PTT] Parse error:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('[PTT] WS error:', error);
          setBridgeConnected(false);
        };

        ws.onclose = () => {
          console.log('[PTT] Bridge disconnected');
          setBridgeConnected(false);
          setTimeout(connectBridge, 2000);
        };

        socketRef.current = ws;
      } catch (error) {
        console.error('[PTT] Connection error:', error);
        setTimeout(connectBridge, 2000);
      }
    };

    connectBridge();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [targetLanguage, onTranscript, onTranslation, onError]);

  const startRecording = useCallback(async () => {
    if (!bridgeConnected) {
      onError('Bridge not connected');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;

      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        const audioData = event.inputBuffer.getChannelData(0);
        const pcm = convertFloat32ToPCM16(audioData);

        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(
            JSON.stringify({
              type: 'audio',
              audio: Array.from(pcm),
              targetLanguage,
            })
          );
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsRecording(true);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Recording failed');
    }
  }, [bridgeConnected, targetLanguage, onError]);

  const stopRecording = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'stop' }));
    }

    setIsRecording(false);
  }, []);

  return {
    isRecording,
    bridgeConnected,
    startRecording,
    stopRecording,
  };
}

function convertFloat32ToPCM16(float32Array: Float32Array): Int16Array {
  const pcm = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return pcm;
}
