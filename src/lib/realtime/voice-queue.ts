import type { Room } from "livekit-client";
import { publishTranslatedAudioTrack } from "@/lib/realtime/publish-translated-track";

export type VoiceQueueItem = {
  text: string;
  lang?: string;
  voice?: string;
};

export type VoiceQueueOptions = {
  room: Room;
  endpoint?: string;
  defaultLang?: string;
  defaultVoice?: string;
  onStart?: (item: VoiceQueueItem) => void;
  onEnd?: (item: VoiceQueueItem) => void;
  onError?: (error: unknown, item: VoiceQueueItem) => void;
};

export class VoiceQueue {
  private queue: VoiceQueueItem[] = [];
  private processing = false;
  private destroyed = false;
  private room: Room;
  private endpoint: string;
  private defaultLang: string;
  private defaultVoice?: string;
  private onStart?: (item: VoiceQueueItem) => void;
  private onEnd?: (item: VoiceQueueItem) => void;
  private onError?: (error: unknown, item: VoiceQueueItem) => void;

  constructor(options: VoiceQueueOptions) {
    this.room = options.room;
    this.endpoint = options.endpoint ?? "/api/azure-tts";
    this.defaultLang = options.defaultLang ?? "en";
    this.defaultVoice = options.defaultVoice;
    this.onStart = options.onStart;
    this.onEnd = options.onEnd;
    this.onError = options.onError;
  }

  enqueue(item: VoiceQueueItem) {
    if (this.destroyed) return;

    const cleanText = item.text?.trim();
    if (!cleanText) return;

    this.queue.push({
      text: cleanText,
      lang: item.lang ?? this.defaultLang,
      voice: item.voice ?? this.defaultVoice,
    });

    void this.process();
  }

  clear() {
    this.queue = [];
  }

  destroy() {
    this.destroyed = true;
    this.processing = false;
    this.queue = [];
  }

  isProcessing() {
    return this.processing;
  }

  size() {
    return this.queue.length;
  }

  private async process() {
    if (this.processing || this.destroyed) return;
    this.processing = true;

    try {
      while (this.queue.length > 0 && !this.destroyed) {
        const item = this.queue.shift();
        if (!item) continue;

        try {
          this.onStart?.(item);

          const audioBuffer = await this.fetchTtsAudio(item);

          if (!audioBuffer || audioBuffer.byteLength === 0) {
            throw new Error("Azure TTS returned empty audio buffer.");
          }

          await publishTranslatedAudioTrack(this.room, audioBuffer);

          this.onEnd?.(item);
        } catch (error) {
          console.error("[voice-queue] item failed:", error);
          this.onError?.(error, item);
        }
      }
    } finally {
      this.processing = false;
    }
  }

  private async fetchTtsAudio(item: VoiceQueueItem): Promise<ArrayBuffer> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: item.text,
        lang: item.lang ?? this.defaultLang,
        voice: item.voice ?? this.defaultVoice,
      }),
    });

    if (!response.ok) {
      const errorText = await safeReadText(response);
      throw new Error(
        `[voice-queue] TTS request failed: ${response.status} ${response.statusText} ${errorText}`
      );
    }

    return await response.arrayBuffer();
  }
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}