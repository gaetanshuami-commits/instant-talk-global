// voiceEngine.ts
// Full coverage: 23+ languages. Azure STT primary, Web Speech API fallback.
// TTS: remote-only (never local speakers), cancel-on-interrupt.

// ─── Recognition locales — keyed by UI language code ─────────────────────────

export const SOURCE_LOCALE: Record<string, string> = {
  fr: "fr-FR", en: "en-US", es: "es-ES", de: "de-DE", it: "it-IT",
  ru: "ru-RU", pl: "pl-PL", nl: "nl-NL", pt: "pt-BR", ar: "ar-SA",
  ja: "ja-JP", ko: "ko-KR", hi: "hi-IN", tr: "tr-TR", zh: "zh-CN",
  sw: "sw-KE", ro: "ro-RO", el: "el-GR", sv: "sv-SE", hu: "hu-HU",
  cs: "cs-CZ", th: "th-TH", vi: "vi-VN",
  bg: "bg-BG", da: "da-DK", fi: "fi-FI", sk: "sk-SK", no: "nb-NO",
}

// UI code → Azure Translation API target code
const AZURE_TARGET: Record<string, string> = {
  zh: "zh-Hans",
  no: "nb",
}
function toAzureTarget(lang: string): string {
  return AZURE_TARGET[lang] ?? lang
}

// ─── TTS voices — female ──────────────────────────────────────────────────────

export const TTS_VOICE_FEMALE: Record<string, string> = {
  fr: "fr-FR-DeniseNeural",    en: "en-US-AriaNeural",       es: "es-ES-ElviraNeural",
  de: "de-DE-KatjaNeural",     it: "it-IT-ElsaNeural",        ru: "ru-RU-SvetlanaNeural",
  pl: "pl-PL-ZofiaNeural",     nl: "nl-NL-ColetteNeural",     pt: "pt-BR-FranciscaNeural",
  ar: "ar-SA-ZariyahNeural",   ja: "ja-JP-NanamiNeural",      ko: "ko-KR-SunHiNeural",
  hi: "hi-IN-SwaraNeural",     tr: "tr-TR-EmelNeural",        zh: "zh-CN-XiaoxiaoNeural",
  sw: "sw-KE-ZuriNeural",      ro: "ro-RO-AlinaNeural",       el: "el-GR-AthinaNeural",
  sv: "sv-SE-SofieNeural",     hu: "hu-HU-NoemiNeural",       cs: "cs-CZ-VlastaNeural",
  th: "th-TH-PremwadeeNeural", vi: "vi-VN-HoaiMyNeural",
  bg: "bg-BG-KalinaNeural",    da: "da-DK-ChristelNeural",    fi: "fi-FI-SelmaNeural",
  sk: "sk-SK-ViktoriaNeural",  no: "nb-NO-PernilleNeural",    ln: "fr-FR-DeniseNeural",
}

// ─── TTS voices — male ────────────────────────────────────────────────────────

export const TTS_VOICE_MALE: Record<string, string> = {
  fr: "fr-FR-HenriNeural",     en: "en-US-GuyNeural",         es: "es-ES-AlvaroNeural",
  de: "de-DE-ConradNeural",    it: "it-IT-DiegoNeural",       ru: "ru-RU-DmitryNeural",
  pl: "pl-PL-MarekNeural",     nl: "nl-NL-MaartenNeural",     pt: "pt-BR-AntonioNeural",
  ar: "ar-SA-HamedNeural",     ja: "ja-JP-KeitaNeural",       ko: "ko-KR-InJoonNeural",
  hi: "hi-IN-MadhurNeural",    tr: "tr-TR-AhmetNeural",       zh: "zh-CN-YunxiNeural",
  sw: "sw-KE-RafikiNeural",    ro: "ro-RO-EmilNeural",        el: "el-GR-NestorasNeural",
  sv: "sv-SE-MattiasNeural",   hu: "hu-HU-TamasNeural",       cs: "cs-CZ-AntoninNeural",
  th: "th-TH-NiwatNeural",     vi: "vi-VN-NamMinhNeural",
  bg: "bg-BG-BorislavNeural",  da: "da-DK-JeppeNeural",       fi: "fi-FI-HarriNeural",
  sk: "sk-SK-LukasNeural",     no: "nb-NO-FinnNeural",        ln: "fr-FR-HenriNeural",
}

export const TTS_VOICE = TTS_VOICE_FEMALE

// ─── Types ────────────────────────────────────────────────────────────────────

export type SubtitleCallbacks = {
  onPartial: (lang: string, text: string) => void
  onFinal:   (lang: string, text: string) => void
  onError?:  (err: string) => void
}

export type VoiceGender = "female" | "male"

// ─── Web Audio — TTS output (Agora interpreter track only) ───────────────────
// Never connected to ctx.destination — local speakers never hear own translation.

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
let recognizer: any       = null   // Azure TranslationRecognizer
let azureToken            = ""
let azureRegion           = ""
let azureTokenExpiry      = 0      // epoch ms; refresh at 9 min (expiry = 10 min)
let _restartTimer: ReturnType<typeof setTimeout> | null = null  // auto-restart on transient error
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let activeSynth: any      = null
let activeSynthDone: (() => void) | null = null

// Cached Azure SpeechSynthesizer — reuse the WebSocket between consecutive TTS
// calls instead of creating a new connection each time (saves 200-500ms per call).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _azureSynth: any = null
let _azureSynthVoice = ""

// ─── Web Speech API fallback state ───────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _wsr: any = null               // SpeechRecognition instance (browser fallback)
let _wsrActive = false             // true while fallback is supposed to be running

// ─── TTS provider ─────────────────────────────────────────────────────────────

let _ttsProvider: "azure" | "elevenlabs" = "elevenlabs"
let _ttsGenderGlobal: VoiceGender = "female"

export function setTTSProvider(provider: "azure" | "elevenlabs"): void {
  _ttsProvider = provider
}
export function getTTSProvider(): "azure" | "elevenlabs" {
  return _ttsProvider
}

// ─── Cloned voice — set once after ElevenLabs instant cloning ────────────────
let _clonedVoiceId: string | null = null

export function setClonedVoiceId(id: string | null): void {
  _clonedVoiceId = id
}
export function getClonedVoiceId(): string | null {
  return _clonedVoiceId
}

// Languages NOT supported by eleven_flash_v2_5 → Azure TTS fallback
const ELEVENLABS_UNSUPPORTED = new Set(["sw", "ln", "th"])

// ─── ElevenLabs TTS ───────────────────────────────────────────────────────────

async function speakWithElevenLabs(text: string, lang: string): Promise<void> {
  try {
    const res = await fetch("/api/elevenlabs-tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Use cloned voice when available — falls back to gender default in the route
      body: JSON.stringify({ text, gender: _ttsGenderGlobal, voiceId: _clonedVoiceId ?? undefined }),
    })
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}`)
    const arrayBuffer = await res.arrayBuffer()
    if (arrayBuffer.byteLength > 0) void scheduleAudio(arrayBuffer)
  } catch {
    const voiceMap = _ttsGenderGlobal === "male" ? TTS_VOICE_MALE : TTS_VOICE_FEMALE
    await speakWithAzure(text, lang, voiceMap)
  }
}

// ─── Azure TTS ────────────────────────────────────────────────────────────────
// Reuses the SpeechSynthesizer WebSocket connection between calls to avoid the
// 200-500 ms handshake overhead on every utterance.  The synthesizer is only
// recreated when the voice changes or an error forces a reset.

async function speakWithAzure(
  text: string,
  lang: string,
  voiceMap: Record<string, string>
): Promise<void> {
  const sdk   = _sdk!
  const voice = voiceMap[lang] ?? "en-US-AriaNeural"

  // Reuse cached synthesizer if voice hasn't changed; otherwise recreate.
  if (!_azureSynth || _azureSynthVoice !== voice) {
    if (_azureSynth) { try { _azureSynth.close() } catch {} }
    const cfg = sdk.SpeechConfig.fromAuthorizationToken(azureToken, azureRegion)
    cfg.speechSynthesisVoiceName = voice
    _azureSynth = new sdk.SpeechSynthesizer(
      cfg,
      null as unknown as InstanceType<typeof sdk.AudioConfig>
    )
    _azureSynthVoice = voice
  }

  const synth = _azureSynth
  activeSynth = synth
  await new Promise<void>((resolve) => {
    activeSynthDone = resolve
    synth.speakTextAsync(
      text,
      async (result: { audioData?: ArrayBuffer }) => {
        if (activeSynth !== synth) { resolve(); return }
        activeSynth = null; activeSynthDone = null
        // Do NOT close the synthesizer — keep WebSocket alive for next call.
        if (result.audioData && result.audioData.byteLength > 0) void scheduleAudio(result.audioData)
        resolve()
      },
      (_err: unknown) => {
        // Error: reset the cached synth so the next call reconnects cleanly.
        if (activeSynth === synth) { activeSynth = null; activeSynthDone = null }
        try { synth.close() } catch {}
        if (_azureSynth === synth) { _azureSynth = null; _azureSynthVoice = "" }
        resolve()
      }
    )
  })
}

// ─── Token — auto-refresh before 10-min expiry ────────────────────────────────

async function ensureToken(): Promise<void> {
  if (azureToken && Date.now() < azureTokenExpiry) return
  const res  = await fetch("/api/azure-speech-token")
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  azureToken       = data.token
  azureRegion      = data.region
  azureTokenExpiry = Date.now() + 9 * 60 * 1000
}

// ─── Warmup ───────────────────────────────────────────────────────────────────

export async function warmupSDK(): Promise<void> {
  try {
    getTTSMediaStream()
    if (!_sdk) _sdk = await import("microsoft-cognitiveservices-speech-sdk")
    await ensureToken()
  } catch {
    // Non-fatal — retried in startTranslation if needed
  }
}

/** Pre-resume the AudioContext so the first TTS playback has no suspend delay. */
export async function warmAudioContext(): Promise<void> {
  try {
    if (!ttsCtx) getTTSMediaStream()
    if (ttsCtx && ttsCtx.state === "suspended") await ttsCtx.resume()
  } catch {
    // Non-fatal
  }
}

// ─── Web Speech API fallback ──────────────────────────────────────────────────
// Activated automatically when Azure STT returns "Quota exceeded".
// Uses the browser's native SpeechRecognition (Chrome/Edge only) for STT, then
// calls /api/translate for text translation. Lower accuracy than Azure but free.
//
// Partials: shown in source language (translation is async, can't keep up).
// Finals: translated via /api/translate → text subtitles + TTS voice.

async function startWebSpeechFallback(
  sourceLang: string,
  targets: string[],
  callbacks: SubtitleCallbacks,
  ttsLang: string | undefined,
  voiceGender: VoiceGender,
  getRemoteCount: (() => number) | undefined
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SR) {
    callbacks.onError?.("Azure STT quota exceeded. Browser STT (Chrome) not available either.")
    return
  }

  console.info("[VoiceEngine] Azure quota exceeded — using browser STT fallback (Chrome)")

  const voiceMap = voiceGender === "male" ? TTS_VOICE_MALE : TTS_VOICE_FEMALE
  _wsrActive = true

  function createWSR() {
    const wsr = new SR()
    wsr.lang       = SOURCE_LOCALE[sourceLang] ?? "fr-FR"
    wsr.continuous = true
    wsr.interimResults = true
    wsr.maxAlternatives = 1
    _wsr = wsr

    // Track the highest final-result index we've already processed to avoid
    // re-emitting the same translation when the Web Speech API fires onresult
    // with accumulated results (the API never removes finalized entries).
    let lastProcessedFinalIdx = -1

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wsr.onresult = async (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result    = event.results[i]
        const transcript: string = result[0].transcript.trim()
        if (!transcript) continue

        if (result.isFinal) {
          // Skip results we've already translated to prevent duplicate subtitles
          if (i <= lastProcessedFinalIdx) continue
          lastProcessedFinalIdx = i

          // Translate each target language via REST (Azure Translator / DeepL)
          for (const lang of targets) {
            try {
              const res  = await fetch("/api/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: transcript, targetLang: toAzureTarget(lang) }),
              })
              const data = await res.json()
              const translated = (typeof data.translatedText === "string" ? data.translatedText : transcript)
              callbacks.onFinal(lang, translated)
              if (ttsLang && lang === ttsLang) {
                const rc = getRemoteCount ? getRemoteCount() : 1
                if (rc > 0) void speakTranslated(translated, lang, voiceMap)
              }
            } catch {
              // Translation API failed — show original transcript at least
              callbacks.onFinal(lang, transcript)
            }
          }
        } else {
          // Partial: show source transcript while translation is pending
          for (const lang of targets) callbacks.onPartial(lang, transcript)
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wsr.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        callbacks.onError?.("Microphone permission denied.")
      }
      // "no-speech" is non-fatal — recognition auto-restarts via onend
    }

    wsr.onend = () => {
      // Auto-restart to keep recognition continuous (Web Speech API stops on silence)
      if (_wsrActive && _wsr === wsr) {
        try { wsr.start() } catch {}
      }
    }

    wsr.start()
  }

  createWSR()
}

function stopWebSpeechFallback(): void {
  _wsrActive = false
  if (_wsr) {
    const w = _wsr
    _wsr = null
    try { w.stop() } catch {}
  }
}

// ─── Start translation ────────────────────────────────────────────────────────

export async function startTranslation(
  sourceLang: string,
  targetLangs: string[],
  callbacks: SubtitleCallbacks,
  ttsLang?: string,
  voiceGender: VoiceGender = "female",
  getRemoteCount?: () => number,
  allowedLangs?: string[] | null
): Promise<void> {
  await stopTranslation()

  // ── Plan language enforcement ──────────────────────────────────────────────
  const filteredTargets = allowedLangs
    ? targetLangs.filter((lang) => {
        if (allowedLangs.includes(lang)) return true
        callbacks.onError?.(
          `Language "${lang}" is not included in your current plan.`
        )
        return false
      })
    : targetLangs

  // eslint-disable-next-line no-param-reassign
  targetLangs = filteredTargets

  if (!_sdk) _sdk = await import("microsoft-cognitiveservices-speech-sdk")
  const sdk = _sdk

  // Refresh token if expired (handles long sessions > 10 min)
  await ensureToken()

  const speechConfig = sdk.SpeechTranslationConfig.fromAuthorizationToken(
    azureToken, azureRegion
  )
  speechConfig.speechRecognitionLanguage = SOURCE_LOCALE[sourceLang] ?? "fr-FR"

  // ── Latency ────────────────────────────────────────────────────────────────
  // 150 ms end-silence: fires ~50 ms earlier than the previous 200 ms value
  // while still being long enough to avoid premature sentence cuts in natural speech.
  speechConfig.setProperty(
    sdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "150"
  )
  speechConfig.setProperty(
    sdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "30000"
  )
  // TrueText removed: adds 300ms+ latency on finals, no benefit for live translation

  const targets = targetLangs
    .filter((t) => t !== sourceLang)
    .filter((t) => t !== "ln")
  if (targets.length === 0) targets.push(sourceLang === "en" ? "fr" : "en")
  for (const lang of targets) speechConfig.addTargetLanguage(toAzureTarget(lang))

  const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput()
  recognizer = new sdk.TranslationRecognizer(speechConfig, audioConfig)
  const r = recognizer

  _ttsGenderGlobal = voiceGender
  const voiceMap = voiceGender === "male" ? TTS_VOICE_MALE : TTS_VOICE_FEMALE

  // ── recognizing: immediate partial subtitle ─────────────────────────────────
  r.recognizing = (
    _s: unknown,
    e: { result: { translations: { get: (l: string) => string } } }
  ) => {
    if (!e.result.translations) return
    for (const lang of targets) {
      const text = e.result.translations.get(toAzureTarget(lang))
      if (text) callbacks.onPartial(lang, text)
    }
  }

  // ── recognized: final subtitle + TTS ───────────────────────────────────────
  r.recognized = (
    _s: unknown,
    e: { result: { reason: number; translations: { get: (l: string) => string } } }
  ) => {
    if (e.result.reason !== sdk.ResultReason.TranslatedSpeech) return
    if (!e.result.translations) return
    for (const lang of targets) {
      const text = e.result.translations.get(toAzureTarget(lang))
      if (!text) continue
      callbacks.onFinal(lang, text)
      if (ttsLang && lang === ttsLang) {
        const rc = getRemoteCount ? getRemoteCount() : 1
        if (rc > 0) void speakTranslated(text, lang, voiceMap)
      }
    }
  }

  // ── canceled: handle fatal errors + automatic fallback ────────────────────
  r.canceled = (
    _s: unknown,
    e: { reason: number; errorDetails: string }
  ) => {
    if (e.reason !== sdk.CancellationReason.Error) return
    const detail = e.errorDetails ?? ""

    // Azure actual error messages use "quota exceeded", "429", "Too Many Requests"
    const isQuota = /quota exceeded|too many requests|429/i.test(detail)
    // Azure auth errors: "Authentication error", "401", "403", "Unauthorized"
    const isAuth  = /authentication error|authentication failed|401|403|unauthorized/i.test(detail)

    if (isQuota) {
      // Azure quota exhausted → transparent fallback to browser Web Speech API.
      if (recognizer === r) recognizer = null
      try { r.close() } catch {}

      startWebSpeechFallback(
        sourceLang, targets, callbacks, ttsLang, voiceGender, getRemoteCount
      ).catch(() => {
        callbacks.onError?.(`Azure STT: quota exceeded. Vérifiez votre abonnement Azure.`)
      })

    } else if (isAuth) {
      // Bad token / wrong region — fatal, must refresh credentials
      callbacks.onError?.(`Azure STT auth: ${detail}`)
      if (recognizer === r) recognizer = null
      try { r.close() } catch {}

    } else {
      // Transient error (network glitch, WebSocket drop, server overload).
      // The Azure SDK does NOT auto-reconnect after canceled — we do it manually.
      callbacks.onError?.(`Azure STT (transient): ${detail}`)
      if (recognizer === r) recognizer = null
      try { r.close() } catch {}

      // Auto-restart after 1 second — transparent to the user
      if (_restartTimer) clearTimeout(_restartTimer)
      _restartTimer = setTimeout(() => {
        _restartTimer = null
        // Only restart if we're still "supposed to be translating" (no explicit stop)
        if (recognizer !== null) return  // a new recognizer already started
        startTranslation(
          sourceLang, targetLangs, callbacks, ttsLang, voiceGender, getRemoteCount, allowedLangs
        ).catch(() => {
          // If restart also fails, surface the original error
          callbacks.onError?.(`Azure STT: ${detail}`)
        })
      }, 1000)
    }
  }

  await new Promise<void>((resolve, reject) => {
    r.startContinuousRecognitionAsync(resolve, reject)
  })
}

// ─── Stop translation ─────────────────────────────────────────────────────────

export async function stopTranslation(): Promise<void> {
  cancelActiveSynth()

  // Release cached Azure TTS synthesizer to free the WebSocket connection.
  if (_azureSynth) {
    try { _azureSynth.close() } catch {}
    _azureSynth = null
    _azureSynthVoice = ""
  }

  // Cancel any pending auto-restart
  if (_restartTimer) { clearTimeout(_restartTimer); _restartTimer = null }

  // Stop Web Speech API fallback if active
  stopWebSpeechFallback()

  // Stop Azure recognizer if active
  if (!recognizer) return
  const r = recognizer
  recognizer = null
  await new Promise<void>((resolve) => {
    r.stopContinuousRecognitionAsync(resolve, () => resolve())
  })
  try { r.close() } catch {}
}

// ─── TTS dispatch ─────────────────────────────────────────────────────────────

async function speakTranslated(
  text: string,
  lang: string,
  voiceMap: Record<string, string>
): Promise<void> {
  cancelActiveSynth()  // interrupt previous utterance if still running
  if (_ttsProvider === "elevenlabs" && !ELEVENLABS_UNSUPPORTED.has(lang)) {
    await speakWithElevenLabs(text, lang)
  } else {
    await speakWithAzure(text, lang, voiceMap)
  }
}

function cancelActiveSynth(): void {
  const done  = activeSynthDone
  const synth = activeSynth
  activeSynth     = null
  activeSynthDone = null
  if (synth) {
    try { synth.close() } catch {}
    // Clear the cache — the synthesizer is now closed; next call will reconnect.
    if (_azureSynth === synth) { _azureSynth = null; _azureSynthVoice = "" }
  }
  done?.()
}

// ─── Web Audio: sequential TTS playback into Agora interpreter track ──────────

async function scheduleAudio(audioData: ArrayBuffer): Promise<void> {
  if (!ttsCtx) getTTSMediaStream()
  const ctx  = ttsCtx!
  const dest = ttsDestNode!
  if (ctx.state === "suspended") await ctx.resume()

  let decoded: AudioBuffer
  try { decoded = await ctx.decodeAudioData(audioData.slice(0)) } catch { return }

  const source = ctx.createBufferSource()
  source.buffer = decoded
  source.connect(dest)   // → Agora only. Never local speakers.

  const now     = ctx.currentTime
  const startAt = Math.max(now + 0.005, playbackEndTime)
  source.start(startAt)
  playbackEndTime = startAt + decoded.duration
}
