import { 
  VoicePipelineAgent, 
  tts, 
  stt, 
  llm 
} from '@livekit/agents';
// Configuration de l'agent avec tes clés
// On utilise ton Voice ID ElevenLabs pour le clonage parfait
const agent = new VoicePipelineAgent({
  stt: new stt.Deepgram(),
  llm: new llm.Google({ model: 'gemini-1.5-flash' }),
  tts: new tts.ElevenLabs({ 
    voiceId: 'QaWvcRVDzoGrTmTauQpi',
    modelId: 'eleven_multilingual_v2' 
  }),
});

// L'agent attend qu'une personne parle pour traduire
agent.on('user_speech_committed', (msg) => {
  console.log('Traduction en cours pour:', msg.text);
});
