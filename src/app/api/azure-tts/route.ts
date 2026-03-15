import { NextRequest, NextResponse } from "next/server";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { text, voiceName } = await req.json();

    if (!text || !voiceName) {
      return NextResponse.json({ error: "Texte ou voix manquante" }, { status: 400 });
    }

    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_SPEECH_REGION;

    if (!speechKey || !speechRegion) {
      return NextResponse.json({ error: "Configuration Azure manquante" }, { status: 500 });
    }

    const speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
    speechConfig.speechSynthesisVoiceName = voiceName;
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Raw48Khz16BitMonoPcm;

    const stream = new ReadableStream({
      start(controller) {
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null as any);

        synthesizer.synthesizing = (s, e) => {
          const buffer = e.result.audioData;
          if (buffer && buffer.byteLength > 0) {
            controller.enqueue(new Uint8Array(buffer));
          }
        };

        synthesizer.speakTextAsync(
          text,
          (result) => {
            controller.close();
            synthesizer.close();
          },
          (error) => {
            console.error("Erreur Azure TTS:", error);
            controller.error(error);
            synthesizer.close();
          }
        );
      }
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Erreur API Azure TTS:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
