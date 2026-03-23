import "dotenv/config";

import { AccessToken } from "livekit-server-sdk";
import { DeepgramClient } from "@deepgram/sdk";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

type BotConfig = {
  roomName: string;
  participantName?: string;
  identity?: string;
  deepgramModel?: string;
  language?: string;
};

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY!;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET!;
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL!;
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY!;
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY!;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION!;

function ensureEnv(name: string, value?: string) {
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
}

ensureEnv("LIVEKIT_API_KEY", LIVEKIT_API_KEY);
ensureEnv("LIVEKIT_API_SECRET", LIVEKIT_API_SECRET);
ensureEnv("NEXT_PUBLIC_LIVEKIT_URL", LIVEKIT_URL);
ensureEnv("DEEPGRAM_API_KEY", DEEPGRAM_API_KEY);
ensureEnv("AZURE_SPEECH_KEY", AZURE_SPEECH_KEY);
ensureEnv("AZURE_SPEECH_REGION", AZURE_SPEECH_REGION);

function log(...args: unknown[]) {
  console.log("[agent-bot]", ...args);
}

function warn(...args: unknown[]) {
  console.warn("[agent-bot]", ...args);
}

function errorLog(...args: unknown[]) {
  console.error("[agent-bot]", ...args);
}

export async function createBotToken({
  roomName,
  participantName = "InstantTalk Bot",
  identity = "instanttalk-bot",
}: BotConfig): Promise<string> {
  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity,
    name: participantName,
    metadata: JSON.stringify({
      role: "bot",
      system: "instant-talk-global",
      roomName,
    }),
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return await token.toJwt();
}

class CaptionBuffer {
  private interimText = "";
  private finalSegments: string[] = [];

  updateInterim(text: string) {
    this.interimText = text.trim();
  }

  commitFinal(text: string) {
    const clean = text.trim();
    if (!clean) return;
    this.finalSegments.push(clean);
    this.interimText = "";
  }

  getDisplayText() {
    const finalText = this.finalSegments.join(" ").trim();
    if (finalText && this.interimText) {
      return `${finalText} ${this.interimText}`.trim();
    }
    return (finalText || this.interimText).trim();
  }

  flushFinalTranscript() {
    const text = this.finalSegments.join(" ").trim();
    this.finalSegments = [];
    this.interimText = "";
    return text;
  }
}

export class InstantTalkBot {
  private readonly captionBuffer = new CaptionBuffer();
  private readonly deepgram: any;

  private deepgramConnection: any = null;
  private azurePushStream: sdk.PushAudioInputStream | null = null;
  private azureRecognizer: sdk.SpeechRecognizer | null = null;
  private azureSynthesizer: sdk.SpeechSynthesizer | null = null;

  constructor(private readonly config: BotConfig) {
    this.deepgram = new DeepgramClient({
      apiKey: DEEPGRAM_API_KEY,
    } as any);
  }

  async start() {
    log("starting bot for room:", this.config.roomName);
    await this.initAzureRecognizer();
    await this.initDeepgram();
  }

  async stop() {
    log("stopping bot");

    try {
      this.deepgramConnection?.finish?.();
    } catch (e) {
      warn("deepgram finish failed", e);
    }

    try {
      this.azureRecognizer?.stopContinuousRecognitionAsync(
        () => log("azure recognizer stopped"),
        (e) => errorLog("azure recognizer stop error", e)
      );
    } catch (e) {
      warn("azure stop failed", e);
    }

    try {
      this.azureSynthesizer?.close();
    } catch (e) {
      warn("azure synthesizer close failed", e);
    }

    try {
      this.azureRecognizer?.close();
    } catch (e) {
      warn("azure recognizer close failed", e);
    }

    this.deepgramConnection = null;
    this.azurePushStream = null;
    this.azureRecognizer = null;
    this.azureSynthesizer = null;
  }

  private async initDeepgram() {
    log("initializing deepgram");

    const listenApi =
      this.deepgram?.listen?.live ??
      this.deepgram?.transcription?.live;

    if (!listenApi) {
      warn("deepgram live api not available on installed sdk; bot will run without live deepgram streaming");
      return;
    }

    const connection = listenApi.call(this.deepgram.listen ?? this.deepgram.transcription, {
      model: this.config.deepgramModel || "nova-2",
      language: this.config.language || "multi",
      interim_results: true,
      smart_format: true,
      punctuate: true,
      endpointing: 300,
    });

    connection.on?.("open", () => {
      log("deepgram connection open");
    });

    connection.on?.("error", (e: unknown) => {
      errorLog("deepgram error", e);
    });

    connection.on?.("close", () => {
      warn("deepgram connection closed");
    });

    connection.on?.("transcriptReceived", (payload: any) => {
      this.handleDeepgramPayload(payload);
    });

    connection.on?.("message", (payload: any) => {
      this.handleDeepgramPayload(payload);
    });

    this.deepgramConnection = connection;
  }

  private handleDeepgramPayload(payload: any) {
    try {
      const data =
        typeof payload === "string"
          ? JSON.parse(payload)
          : payload;

      const transcript =
        data?.channel?.alternatives?.[0]?.transcript?.trim?.() || "";

      if (!transcript) return;

      const isFinal = !!data?.is_final;
      const speechFinal = !!data?.speech_final;

      if (isFinal) {
        this.captionBuffer.commitFinal(transcript);
      } else {
        this.captionBuffer.updateInterim(transcript);
      }

      const display = this.captionBuffer.getDisplayText();

      log("caption update", {
        transcript,
        display,
        isFinal,
        speechFinal,
      });

      if (speechFinal) {
        const finalText = this.captionBuffer.flushFinalTranscript() || transcript;
        void this.handleFinalUtterance(finalText);
      }
    } catch (e) {
      errorLog("deepgram payload parse failed", e);
    }
  }

  private async handleFinalUtterance(text: string) {
    log("final utterance:", text);

    const translatedText = await this.translateText(text);
    log("translated utterance:", translatedText);

    await this.speakTranslatedText(translatedText);
  }

  private async translateText(text: string): Promise<string> {
    return text;
  }

  private async initAzureRecognizer() {
    log("initializing azure speech");

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      AZURE_SPEECH_KEY,
      AZURE_SPEECH_REGION
    );

    speechConfig.speechRecognitionLanguage = "fr-FR";
    speechConfig.speechSynthesisVoiceName = "en-US-AvaMultilingualNeural";

    this.azurePushStream = sdk.AudioInputStream.createPushStream();
    const audioConfig = sdk.AudioConfig.fromStreamInput(this.azurePushStream);

    this.azureRecognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    this.azureSynthesizer = new sdk.SpeechSynthesizer(speechConfig);

    this.azureRecognizer.recognizing = (_sender, event) => {
      const text = event.result?.text?.trim();
      if (!text) return;
      log("azure recognizing:", text);
    };

    this.azureRecognizer.recognized = (_sender, event) => {
      const text = event.result?.text?.trim();
      if (!text) return;
      log("azure recognized:", text);
    };

    this.azureRecognizer.canceled = (_sender, event) => {
      warn("azure canceled:", event.errorDetails || event.reason);
    };

    this.azureRecognizer.sessionStarted = () => {
      log("azure session started");
    };

    this.azureRecognizer.sessionStopped = () => {
      log("azure session stopped");
    };

    await new Promise<void>((resolve, reject) => {
      this.azureRecognizer!.startContinuousRecognitionAsync(
        () => resolve(),
        (e) => reject(e)
      );
    });
  }

  async ingestPcm16Mono(buffer: Buffer) {
    if (!buffer || buffer.length === 0) return;

    try {
      const slice = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      ) as ArrayBuffer;

      this.azurePushStream?.write(slice);
    } catch (e) {
      errorLog("azure push stream write failed", e);
    }

    try {
      this.deepgramConnection?.send?.(buffer);
    } catch (e) {
      errorLog("deepgram send failed", e);
    }
  }

  private async speakTranslatedText(text: string) {
    if (!this.azureSynthesizer || !text.trim()) return;

    const result = await new Promise<sdk.SpeechSynthesisResult>((resolve, reject) => {
      this.azureSynthesizer!.speakTextAsync(
        text,
        (res) => resolve(res),
        (e) => reject(e)
      );
    });

    if (result.reason !== sdk.ResultReason.SynthesizingAudioCompleted) {
      warn("azure synthesis not completed:", result.reason);
      return;
    }

    const audioData = result.audioData;
    if (!audioData || audioData.byteLength === 0) {
      warn("azure returned empty audio");
      return;
    }

    log("azure synthesized audio bytes:", audioData.byteLength);
  }
}

async function main() {
  const roomName = process.argv[2] || "test-room";

  const bot = new InstantTalkBot({
    roomName,
    participantName: "InstantTalk Bot",
    identity: "instanttalk-bot",
    deepgramModel: "nova-2",
    language: "multi",
  });

  await bot.start();
  log("bot ready for room:", roomName);

  process.on("SIGINT", async () => {
    await bot.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await bot.stop();
    process.exit(0);
  });
}

if (require.main === module) {
  void main();
}
