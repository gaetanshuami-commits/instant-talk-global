// voiceEngine.ts
// Full coverage: 26 languages. SDK cached. TTS: remote-only, cancel-on-interrupt.

// ─── Recognition locales (all 26 LanguageSelector languages) ─────────────────

export const SOURCE_LOCALE: Record<string, string> = {
  fr: "fr-FR", en: "en-US", es: "es-ES", de: "de-DE", it: "it-IT",
  ru: "ru-RU", pl: "pl-PL", nl: "nl-NL", pt: "pt-BR", ar: "ar-SA",
  ja: "ja-JP", ko: "ko-KR", hi: "hi-IN", tr: "tr-TR", "zh-Hans": "zh-CN",
  sw: "sw-KE", ro: "ro-RO", el: "el-GR", sv: "sv-SE", hu: "hu-HU",
  cs: "cs-CZ", bg: "bg-BG", da: "da-DK", fi: "fi-FI", sk: "sk-SK",
  no: "nb-NO",
}

// UI code → Azure Translation API code (where they differ)
const AZURE_TARGET: Record<string, string> = {
  no: "nb",
}
function toAzureTarget(lang: string): string {
  return AZURE_TARGET[lang] ?? lang
}

// ─── TTS voices — female ──────────────────────────────────────────────────────

export const TTS_VOICE_FEMALE: Record<string, string> = {
  fr: "fr-FR-DeniseNeural",   en: "en-US-AriaNeural",      es: "es-ES-ElviraNeural",
  de: "de-DE-KatjaNeural",    it: "it-IT-ElsaNeural",       ru: "ru-RU-SvetlanaNeural",
  pl: "pl-PL-ZofiaNeural",    nl: "nl-NL-ColetteNeural",    pt: "pt-BR-FranciscaNeural",
  ar: "ar-SA-ZariyahNeural",  ja: "ja-JP-NanamiNeural",     ko: "ko-KR-SunHiNeural",
  hi: "hi-IN-SwaraNeural",    tr: "tr-TR-EmelNeural",       "zh-Hans": "zh-CN-XiaoxiaoNeural",
  sw: "sw-KE-ZuriNeural",     ro: "ro-RO-AlinaNeural",      el: "el-GR-AthinaNeural",
  sv: "sv-SE-SofieNeural",    hu: "hu-HU-NoemiNeural",      cs: "cs-CZ-VlastaNeural",
  bg: "bg-BG-KalinaNeural",   da: "da-DK-ChristelNeural",   fi: "fi-FI-SelmaNeural",
  sk: "sk-SK-ViktoriaNeural", no: "nb-NO-PernilleNeural",   ln: "fr-FR-DeniseNeural",
}

// ─── TTS voices — male ────────────────────────────────────────────────────────

export const TTS_VOICE_MALE: Record<string, string> = {
  fr: "fr-FR-HenriNeural",    en: "en-US-GuyNeural",        es: "es-ES-AlvaroNeural",
  de: "de-DE-ConradNeural",   it: "it-IT-DiegoNeural",      ru: "ru-RU-DmitryNeural",
  pl: "pl-PL-MarekNeural",    nl: "nl-NL-MaartenNeural",    pt: "pt-BR-AntonioNeural",
  ar: "ar-SA-HamedNeural",    ja: "ja-JP-KeitaNeural",      ko: "ko-KR-InJoonNeural",
  hi: "hi-IN-MadhurNeural",   tr: "tr-TR-AhmetNeural",      "zh-Hans": "zh-CN-YunxiNeural",
  sw: "sw-KE-RafikiNeural",   ro: "ro-RO-EmilNeural",       el: "el-GR-NestorasNeural",
  sv: "sv-SE-MattiasNeural",  hu: "hu-HU-TamasNeural",      cs: "cs-CZ-AntoninNeural",
  bg: "bg-BG-BorislavNeural", da: "da-DK-JeppeNeural",      fi: "fi-FI-HarriNeural",
  sk: "sk-SK-LukasNeural",    no: "nb-NO-FinnNeural",       ln: "fr-FR-HenriNeural",
}

export const TTS_VOICE = TTS_VOICE_FEMALE

// ─── Types ────────────────────────────────────────────────────────────────────

export type SubtitleCallbacks = {
  onPartial: (lang: string, text: string) => void
  onFinal:   (lang: string, text: string) => void
  onError?:  (err: string) => void
}

export type VoiceGender = "female" | "male"

// ─── Web Audio — Agora interpreter track (remote participants only) ────────────
// TTS audio is NEVER connected to ctx.destination (local speakers).
// It only goes to ttsDestNode → Agora interpreter track → remote peers.
// The local speaker therefore never hears their own translation.

let ttsCtx: AudioContext | null = null
let ttsDestNode: MediaStreamAudioDestinationNode | null = null
let playbackEndTime = 0

export function getTTSMediaStream(): MediaStream {
  if (!ttsCtx) {
    ttsCtx = new AudioContext({ sampleRate: 48000 })
    ttsDestNode = ttsCtx.createMediaStreamDestination()
  }
  return ttsDestNode!.stream
}

// ─── SDK module state ─────────────────────────────────────────────────────────

type SDK = typeof import("microsoft-cognitiveservices-speech-sdk")
let _sdk: SDK | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let recognizer: any       = null
let azureToken            = ""
let azureRegion           = ""
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let activeSynth: any      = null
let activeSynthDone: (() => void) | null = null

// ─── Warmup — call at room join, before user clicks "Translate" ───────────────
// Pre-loads the Azure Speech SDK (~8 MB) and fetches the auth token so that
// when the user starts speaking the recognizer starts in < 100 ms.

export async function warmupSDK(): Promise<void> {
  try {
    // Pre-create the AudioContext and MediaStreamDestination now, inside the
    // user-gesture window (room join click). Avoids the suspended-state delay
    // on the very first TTS call which otherwise costs ~50 ms.
    getTTSMediaStream()

    if (!_sdk) _sdk = await import("microsoft-cognitiveservices-speech-sdk")

    // Fetch auth token once; reused on every startTranslation until expiry.
    if (!azureToken) {
      const res  = await fetch("/api/azure-speech-token")
      const data = await res.json()
      if (!data.error) {
        azureToken  = data.token
        azureRegion = data.region
      }
    }
  } catch {
    // Non-fatal — will be retried at startTranslation if needed
  }
}

// ─── Start translation ────────────────────────────────────────────────────────

export async function startTranslation(
  sourceLang: string,
  targetLangs: string[],
  callbacks: SubtitleCallbacks,
  ttsLang?: string,
  voiceGender: VoiceGender = "female",
  getRemoteCount?: () => number
): Promise<void> {
  await stopTranslation()

  if (!_sdk) _sdk = await import("microsoft-cognitiveservices-speech-sdk")
  const sdk = _sdk

  // Use pre-warmed token if available, else fetch
  if (!azureToken) {
    const res  = await fetch("/api/azure-speech-token")
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    azureToken  = data.token
    azureRegion = data.region
  }

  const speechConfig = sdk.SpeechTranslationConfig.fromAuthorizationToken(
    azureToken, azureRegion
  )

  speechConfig.speechRecognitionLanguage = SOURCE_LOCALE[sourceLang] ?? "fr-FR"

  // ── Latency settings ────────────────────────────────────────────────────
  // 150 ms end-silence: recognizer fires as soon as the speaker pauses briefly.
  // This is the single biggest lever for near-zero perceived latency.
  speechConfig.setProperty(
    sdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "250"
  )
  // Allow up to 10 s before first word — don't time out a slow start
  speechConfig.setProperty(
    sdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "10000"
  )
  // TrueText: better punctuation + casing without extra round-trip
  speechConfig.setProperty(
    sdk.PropertyId.SpeechServiceResponse_PostProcessingOption, "TrueText"
  )

  const targets = targetLangs
    .filter((t) => t !== sourceLang)
    .filter((t) => t !== "ln")   // Lingala: no Azure Translation support yet
  if (targets.length === 0) targets.push(sourceLang === "en" ? "fr" : "en")
  for (const lang of targets) speechConfig.addTargetLanguage(toAzureTarget(lang))

  const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput()
  recognizer = new sdk.TranslationRecognizer(speechConfig, audioConfig)

  const voiceMap = voiceGender === "male" ? TTS_VOICE_MALE : TTS_VOICE_FEMALE

  // ── recognizing: immediate partial subtitle ──────────────────────────────
  // Fires continuously while the user speaks — shows live text with no wait.
  recognizer.recognizing = (
    _s: unknown,
    e: { result: { translations: { get: (l: string) => string } } }
  ) => {
    if (!e.result.translations) return
    for (const lang of targets) {
      const text = e.result.translations.get(toAzureTarget(lang))
      if (text) callbacks.onPartial(lang, text)
    }
  }

  // ── recognized: final subtitle + TTS ────────────────────────────────────
  // Fires when the 150 ms end-silence elapses — triggers TTS immediately.
  recognizer.recognized = (
    _s: unknown,
    e: { result: { reason: number; translations: { get: (l: string) => string } } }
  ) => {
    if (e.result.reason !== sdk.ResultReason.TranslatedSpeech) return
    if (!e.result.translations) return
    for (const lang of targets) {
      const text = e.result.translations.get(toAzureTarget(lang))
      if (!text) continue
      callbacks.onFinal(lang, text)
      // TTS fires only when at least one remote peer is present.
      // getRemoteCount() === 0 means the speaker is alone → no playback.
      // TTS audio goes to the Agora channel only (not local speakers),
      // so the speaker never hears their own translation regardless.
      if (ttsLang && lang === ttsLang) {
        const remoteCount = getRemoteCount ? getRemoteCount() : 1
        if (remoteCount > 0) void speakTranslated(text, lang, voiceMap)
      }
    }
  }

  recognizer.canceled = (
    _s: unknown,
    e: { reason: number; errorDetails: string }
  ) => {
    if (e.reason === sdk.CancellationReason.Error) {
      callbacks.onError?.(`Azure STT: ${e.errorDetails}`)
    }
  }

  await new Promise<void>((resolve, reject) => {
    recognizer.startContinuousRecognitionAsync(resolve, reject)
  })
}

// ─── Stop translation ─────────────────────────────────────────────────────────

export async function stopTranslation(): Promise<void> {
  cancelActiveSynth()
  if (!recognizer) return
  const r = recognizer
  recognizer = null
  await new Promise<void>((resolve) => {
    r.stopContinuousRecognitionAsync(resolve, () => resolve())
  })
  try { r.close() } catch {}
  // Token NOT reset: Azure tokens last ~10 minutes.
  // Reusing the cached token removes a network round-trip on every language
  // change (stopTranslation + startTranslation), saving ~200 ms of latency.
}

// ─── TTS: Agora channel only, never local speakers ───────────────────────────

async function speakTranslated(
  text: string,
  lang: string,
  voiceMap: Record<string, string>
): Promise<void> {
  cancelActiveSynth()   // interrupt previous if still running

  const sdk   = _sdk!
  const voice = voiceMap[lang] ?? "en-US-AriaNeural"

  const cfg = sdk.SpeechConfig.fromAuthorizationToken(azureToken, azureRegion)
  cfg.speechSynthesisVoiceName = voice

  const synth = new sdk.SpeechSynthesizer(
    cfg,
    null as unknown as InstanceType<typeof sdk.AudioConfig>
  )
  activeSynth = synth

  await new Promise<void>((resolve) => {
    activeSynthDone = resolve

    synth.speakTextAsync(
      text,
      async (result: { audioData?: ArrayBuffer }) => {
        if (activeSynth !== synth) { resolve(); return }
        activeSynth     = null
        activeSynthDone = null
        synth.close()
        if (result.audioData && result.audioData.byteLength > 0) {
          void scheduleAudio(result.audioData)
        }
        resolve()
      },
      (_err: unknown) => {
        if (activeSynth === synth) { activeSynth = null; activeSynthDone = null }
        synth.close()
        resolve()
      }
    )
  })
}

function cancelActiveSynth(): void {
  const done  = activeSynthDone
  const synth = activeSynth
  activeSynth     = null
  activeSynthDone = null
  if (synth) try { synth.close() } catch {}
  done?.()
}

// ─── Web Audio: sequential playback into Agora track ─────────────────────────

async function scheduleAudio(audioData: ArrayBuffer): Promise<void> {
  if (!ttsCtx) getTTSMediaStream()
  const ctx  = ttsCtx!
  const dest = ttsDestNode!
  if (ctx.state === "suspended") await ctx.resume()

  let decoded: AudioBuffer
  try { decoded = await ctx.decodeAudioData(audioData.slice(0)) } catch { return }

  const source = ctx.createBufferSource()
  source.buffer = decoded
  source.connect(dest)   // → Agora only. Local speakers excluded.

  const now     = ctx.currentTime
  const startAt = Math.max(now + 0.02, playbackEndTime)
  source.start(startAt)
  playbackEndTime = startAt + decoded.duration
}
