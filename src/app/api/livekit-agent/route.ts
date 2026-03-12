import { 
  VoicePipelineAgent, 
  tts, 
  stt, 
  llm 
} from '@livekit/agents';
import { DeepgramSTT } from '@livekit/agents-plugin-deepgram';
import { GoogleLLM } from '@livekit/agents-plugin-google';
import { ElevenLabsTTS } from '@livekit/agents-plugin-elevenlabs';

// On définit l'agent qui va vivre dans la salle
export const agent = new VoicePipelineAgent({
  stt: new DeepgramSTT(),
  llm: new GoogleLLM({ model: 'gemini-1.5-flash' }),
  tts: new ElevenLabsTTS({ 
    voiceId: 'QaWvcRVDzoGrTmTauQpi',
    modelId: 'eleven_multilingual_v2' 
  }),
});

// Cette route est nécessaire pour que LiveKit puisse appeler l'agent
export async function POST(req: Request) {
  return new Response("Agent LiveKit Actif", { status: 200 });
}
