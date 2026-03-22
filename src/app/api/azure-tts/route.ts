import { NextRequest, NextResponse } from "next/server";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body?.text;
    const voiceName = body?.voiceName;

    if (!text || !voiceName) {
      return NextResponse.json(
        { error: "Missing text or voiceName" },
        { status: 400 }
      );
    }

    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_SPEECH_REGION;

    if (!speechKey || !speechRegion) {
      return NextResponse.json(
        { error: "Missing Azure Speech configuration" },
        { status: 500 }
      );
    }

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      speechKey,
      speechRegion
    );

    speechConfig.speechSynthesisVoiceName = voiceName;
    speechConfig.speechSynthesisOutputFormat =
      sdk.SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm;

    const audioData = await new Promise<ArrayBuffer>((resolve, reject) => {
      const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

      synthesizer.speakTextAsync(
        text,
        (result) => {
          synthesizer.close();

          if (
            result.reason !== sdk.ResultReason.SynthesizingAudioCompleted ||
            !result.audioData
          ) {
            reject(new Error("Azure speech synthesis failed"));
            return;
          }

          resolve(result.audioData);
        },
        (error) => {
          synthesizer.close();
          reject(error);
        }
      );
    });

    return new NextResponse(Buffer.from(audioData), {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
        "Content-Length": String(audioData.byteLength)
      }
    });
  } catch (error) {
    console.error("AZURE_TTS_ROUTE_ERROR", error);

    return NextResponse.json(
      {
        error: "Internal Azure TTS error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
