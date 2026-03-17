import {
    Room,
    RoomEvent,
    AudioStream,
    AudioSource,
    LocalAudioTrack,
    AudioFrame,
    Track
} from '@livekit/rtc-node';
import { AccessToken } from 'livekit-server-sdk';
import { DeepgramClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { GoogleGenAI } from '@google/genai';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// --- 1. CONFIGURATION ET CORRECTION DE L'URL ---
let LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL;

// FIX CRITIQUE: Le SDK Node (Rust) exige le protocole WebSocket natif (ws/wss)
if (LIVEKIT_URL && LIVEKIT_URL.startsWith('https://')) {
    LIVEKIT_URL = LIVEKIT_URL.replace('https://', 'wss://');
} else if (LIVEKIT_URL && LIVEKIT_URL.startsWith('http://')) {
    LIVEKIT_URL = LIVEKIT_URL.replace('http://', 'ws://');
}

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || "francecentral";

if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !DEEPGRAM_API_KEY || !GEMINI_API_KEY || !AZURE_SPEECH_KEY) {
    console.error("❌ ERREUR: Variables d'environnement manquantes.");
    process.exit(1);
}

const deepgram = new DeepgramClient(DEEPGRAM_API_KEY);
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// --- 2. TOKEN BOT ---
async function generateBotToken(roomName: string): Promise<string> {
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
        identity: 'TranslatorBot_' + Math.floor(Math.random() * 10000),
        name: 'Translator Bot',
    });
    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
    return await at.toJwt();
}

// --- 3. CŒUR DE L'AGENT ---
async function runAgent(roomName: string) {
    const room = new Room();
    const token = await generateBotToken(roomName);

    const source = new AudioSource(48000, 1);
    const outputTrack = LocalAudioTrack.createAudioTrack('translation-audio', source);

    room.on(RoomEvent.Connected, async () => {
        console.log('✅ [LiveKit] Connected to room');
        await room.localParticipant.publishTrack(outputTrack);
    });

    room.on(RoomEvent.TrackSubscribed, async (track, publication, participant) => {
        if (track.kind !== Track.Kind.Audio || participant.identity.startsWith('TranslatorBot')) return;
        
        const rtcAudioStream = new AudioStream(track);
        let keepAliveInterval: NodeJS.Timeout;

        try {
            const connection = await deepgram.listen.v1.connect({
                model: 'nova-2',
                language: 'fr',
                smart_format: true,
                encoding: 'linear16',
                sample_rate: 48000,
                channels: 1,
                interim_results: false
            });

            console.log('🟢 [Deepgram] STT pipeline ready');
            
            keepAliveInterval = setInterval(() => {
                if (connection.getReadyState() === 1) connection.keepAlive();
            }, 3000);

            rtcAudioStream.on('data', (frame: AudioFrame) => {
                if (connection.getReadyState() === 1) {
                    const buffer = new Uint8Array(frame.data.buffer, frame.data.byteOffset, frame.data.byteLength);
                    connection.send(buffer);
                }
            });

            connection.on(LiveTranscriptionEvents.Transcript, async (data) => {
                const transcript = data.channel?.alternatives?.[0]?.transcript?.trim();
                if (data.is_final && transcript) {
                    console.log(`🗣️ [User] "${transcript}"`);
                    await processTranslationPipeline(transcript, source);
                }
            });

            connection.on(LiveTranscriptionEvents.Error, (err) => console.error('❌ [Deepgram] Error:', err));
            connection.on(LiveTranscriptionEvents.Close, () => clearInterval(keepAliveInterval));

        } catch (err) {
            console.error('❌ [Deepgram] Connection error:', err);
        }
    });

    try {
        console.log(`[Agent] Tentative de connexion à l'URL : ${LIVEKIT_URL}`);
        await room.connect(LIVEKIT_URL, token);
    } catch (e) {
        console.error("❌ [LiveKit] Connection failed:", e);
        process.exit(1);
    }
}

// --- 4. PIPELINE IA ---
async function processTranslationPipeline(text: string, livekitAudioSource: AudioSource) {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: text,
            config: {
                systemInstruction: "Tu es un traducteur simultané. Traduis le texte fourni en anglais de manière naturelle et fluide. Ne renvoie STRICTEMENT QUE la traduction."
            }
        });
        
        const translatedText = response.text?.trim();
        if (!translatedText) return;
        console.log(`🤖 [Gemini] "${translatedText}"`);

        const speechConfig = sdk.SpeechConfig.fromSubscription(AZURE_SPEECH_KEY!, AZURE_SPEECH_REGION);
        speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Raw48Khz16BitMonoPcm;
        speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural";

        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null as any); 

        synthesizer.speakTextAsync(
            translatedText,
            (speechResult) => {
                if (speechResult.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                    streamToLiveKit(speechResult.audioData, livekitAudioSource);
                }
                synthesizer.close();
            },
            (error) => {
                console.error("❌ [Azure] TTS Error:", error);
                synthesizer.close();
            }
        );
    } catch (err) {
        console.error("❌ [Pipeline] Error:", err);
    }
}

// --- 5. STREAMING AUDIO ---
function streamToLiveKit(audioData: ArrayBuffer, source: AudioSource) {
    const buffer = new Uint8Array(audioData);
    const sampleRate = 48000;
    const channels = 1;
    const bytesPerFrame = (sampleRate / 100) * channels * 2; 

    let offset = 0;
    const interval = setInterval(async () => {
        if (offset >= buffer.length) {
            clearInterval(interval);
            return;
        }
        const end = Math.min(offset + bytesPerFrame, buffer.length);
        const chunk = buffer.slice(offset, end);
        
        if (chunk.length === bytesPerFrame) {
            const frame = new AudioFrame(chunk, sampleRate, channels, sampleRate / 100);
            await source.captureFrame(frame);
        }
        offset += bytesPerFrame;
    }, 10);
}

// --- 6. DEMARRAGE ---
const TARGET_ROOM = process.argv[2];
if (!TARGET_ROOM) {
    console.error("❌ Usage: npx tsx src/agent/bot.ts <room-name>");
    process.exit(1);
}

console.log('[Agent] Starting translation agent');
runAgent(TARGET_ROOM).catch(err => {
    console.error("❌ Fatal Agent Error:", err);
    process.exit(1);
});

// Garder le process en vie
setInterval(() => {}, 10000);