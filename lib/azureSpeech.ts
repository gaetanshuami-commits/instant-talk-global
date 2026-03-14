import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { AudioQueue } from "./AudioQueue";

export function speakAzureStream(text: string, voiceName: string, queue: AudioQueue) {
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY!,
    "francecentral"
  );
  
  speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Raw48Khz16BitMonoPcm;
  speechConfig.speechSynthesisVoiceName = voiceName;

  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

  synthesizer.synthesizing = (s, e) => {
    if (e.result.audioData && e.result.audioData.byteLength > 0) {
      queue.addChunk(e.result.audioData);
    }
  };

  synthesizer.speakTextAsync(
    text,
    (result) => synthesizer.close(),
    (err) => {
      console.error("Azure TTS Error:", err);
      synthesizer.close();
    }
  );
}
