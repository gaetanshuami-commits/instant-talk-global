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
  onPartial:   (lang: string, text: string) => void
  onFinal:     (lang: string, text: string) => void
  onError?:    (err: string) => void
  /** Called when the pipeline switches to Web Speech API fallback mode */
  onFallback?: () => void
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

// ─── TTS sequential queue ─────────────────────────────────────────────────────
// Ensures sentences play in transcript order even when concurrent ElevenLabs
// fetches return out of order (network jitter between API responses).
type TTSJob = { text: string; lang: string; voiceMap: Record<string, string> }
const _ttsQueue: TTSJob[] = []
let   _ttsRunning = false

// AbortController for the in-flight ElevenLabs fetch — cancelled when a new
// sentence starts or stopTranslation() is called.
let _elAbort: AbortController | null = null

// ─── Web Speech API fallback state ───────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _wsr: any = null               // SpeechRecognition instance (browser fallback)
let _wsrActive = false             // true while fallback is supposed to be running
let _fallbackMode = false          // true when Web Speech pipeline is active

/** Returns true when the Web Speech API fallback is the active STT pipeline. */
export function isFallbackMode(): boolean { return _fallbackMode }

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
  // Abort any previous in-flight EL request (new sentence interrupts the old one)
  _elAbort?.abort()
  const ctrl = new AbortController()
  _elAbort = ctrl

  try {
    const res = await fetch("/api/elevenlabs-tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Pass lang so the route can supply language_code to ElevenLabs for
      // better accuracy (avoids auto-detection overhead).
      body: JSON.stringify({
        text,
        lang,
        gender:  _ttsGenderGlobal,
        voiceId: _clonedVoiceId ?? undefined,
      }),
      signal: ctrl.signal,
    })
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}`)
    const arrayBuffer = await res.arrayBuffer()
    // Only schedule if this request was not aborted while waiting for the response
    if (!ctrl.signal.aborted && arrayBuffer.byteLength > 0) void scheduleAudio(arrayBuffer)
  } catch (err) {
    // AbortError = intentionally cancelled — not an error
    if (err instanceof DOMException && err.name === "AbortError") return
    // Fallback to Azure TTS — only if SDK is loaded (avoids null crash on race)
    if (_sdk) {
      const voiceMap = _ttsGenderGlobal === "male" ? TTS_VOICE_MALE : TTS_VOICE_FEMALE
      await speakWithAzure(text, lang, voiceMap)
    }
  } finally {
    if (_elAbort === ctrl) _elAbort = null
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
  if (!_sdk) return  // SDK not yet loaded — skip rather than crash on null assertion
  const sdk   = _sdk
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
  if (data.error) {
    // Surface HTTP status when available — helps distinguish 401 (bad key) from 500 (server bug)
    const hint = res.status === 401 || /401|invalid subscription/i.test(data.details ?? "")
      ? "Azure Speech Token: clé invalide ou region incorrecte"
      : data.error
    throw new Error(hint)
  }
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
// Primary pipeline when Azure Speech is unavailable (bad key, quota, network).
// Uses the browser's native SpeechRecognition (Chrome/Edge/Android) for STT,
// then calls /api/translate (DeepL → Gemini) for translation.
//
// Partials: shown in source language while translation is fetching (~300-800ms).
// Finals:   translated via /api/translate → text subtitles + ElevenLabs TTS.
//
// NOT available on iOS Safari (no SpeechRecognition support).

// Internal helper — common entry point for all fallback activations.
// Handles browser support detection, sets _fallbackMode, notifies the UI.
async function activateWebSpeechFallback(
  reason: string,
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
    // iOS Safari / Firefox without speech flag — no fallback possible
    callbacks.onError?.(
      `${reason}. Traduction non disponible : ce navigateur ne supporte pas l'API Web Speech (utilisez Chrome ou Edge).`
    )
    return
  }

  _fallbackMode = true
  callbacks.onFallback?.()   // notify UI to show the fallback indicator
  console.info(`[VoiceEngine] ${reason} — activating Web Speech API fallback`)
  await startWebSpeechFallback(sourceLang, targets, callbacks, ttsLang, voiceGender, getRemoteCount)
}

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
  if (!SR) return  // already checked by activateWebSpeechFallback

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
                if (rc > 0) enqueueTTS(translated, lang, voiceMap)
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

  // ── Compute targets early — needed by both Azure and Web Speech paths ──────
  const targets = targetLangs
    .filter((t) => t !== sourceLang)
    .filter((t) => t !== "ln")
  if (targets.length === 0) targets.push(sourceLang === "en" ? "fr" : "en")

  _ttsGenderGlobal = voiceGender
  const voiceMap = voiceGender === "male" ? TTS_VOICE_MALE : TTS_VOICE_FEMALE

  // ── Try Azure Speech ───────────────────────────────────────────────────────
  // If Azure is unavailable (bad key, quota, network), automatically switch to
  // the Web Speech API fallback instead of throwing an error that breaks the call.
  let sdk: SDK
  try {
    if (!_sdk) _sdk = await import("microsoft-cognitiveservices-speech-sdk")
    sdk = _sdk
    await ensureToken()         // throws if key invalid or network error
    _fallbackMode = false       // Azure is reachable — clear any previous fallback state
  } catch (azureErr) {
    const reason = azureErr instanceof Error ? azureErr.message : "Azure Speech indisponible"
    await activateWebSpeechFallback(
      reason, sourceLang, targets, callbacks, ttsLang, voiceGender, getRemoteCount
    )
    return  // Web Speech fallback is now running; Azure setup below is skipped
  }

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

  for (const lang of targets) speechConfig.addTargetLanguage(toAzureTarget(lang))

  const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput()
  recognizer = new sdk.TranslationRecognizer(speechConfig, audioConfig)
  const r = recognizer

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
        // enqueueTTS guarantees in-order playback even when concurrent API responses
        // arrive out of order — fixes the "wrong sentence plays first" race condition.
        if (rc > 0) enqueueTTS(text, lang, voiceMap)
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

      activateWebSpeechFallback(
        "Quota Azure STT dépassé",
        sourceLang, targets, callbacks, ttsLang, voiceGender, getRemoteCount
      ).catch(() => {
        callbacks.onError?.(`Azure STT: quota dépassé et Web Speech indisponible.`)
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

// ─── Close AudioContext (call on room unmount) ────────────────────────────────
// Browsers have a limit on concurrent AudioContexts (~6 on Chrome/Safari).
// Not closing it when the user leaves the room causes a "zombie" context that
// counts against that limit on the next room join.

export function closeAudioContext(): void {
  _ttsQueue.length = 0
  _ttsRunning = false
  playbackEndTime = 0
  _elAbort?.abort()
  _elAbort = null
  if (ttsCtx) {
    try { ttsCtx.close() } catch {}
    ttsCtx       = null
    ttsDestNode  = null
  }
}

// ─── Stop translation ─────────────────────────────────────────────────────────

export async function stopTranslation(): Promise<void> {
  _fallbackMode = false        // reset fallback mode on every stop

  // Clear the TTS queue so no stale sentences play after stop
  _ttsQueue.length = 0
  _ttsRunning = false

  // Reset audio timeline — prevents a long scheduling backlog if sentences
  // accumulated while the user was speaking quickly.
  playbackEndTime = 0

  cancelActiveSynth()  // also aborts any in-flight EL request

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

// ─── TTS dispatch — sequential queue ─────────────────────────────────────────
// Sentences are enqueued and played strictly in-order.
// Calling enqueueTTS() drops any currently-queued future sentences so the latest
// sentence plays as soon as the current one finishes.  This prevents sentences
// from building up when the speaker talks faster than ElevenLabs can generate.

function enqueueTTS(text: string, lang: string, voiceMap: Record<string, string>): void {
  // Drop stale queued items — only keep the job that was just added.
  // This ensures the most recent sentence is always next, never buried under backlog.
  _ttsQueue.length = 0
  _ttsQueue.push({ text, lang, voiceMap })
  if (!_ttsRunning) void drainTTSQueue()
}

async function drainTTSQueue(): Promise<void> {
  _ttsRunning = true
  while (_ttsQueue.length > 0) {
    const job = _ttsQueue.shift()!
    cancelActiveSynth()  // interrupt previous Azure utterance if still running
    if (_ttsProvider === "elevenlabs" && !ELEVENLABS_UNSUPPORTED.has(job.lang)) {
      await speakWithElevenLabs(job.text, job.lang)
    } else {
      await speakWithAzure(job.text, job.lang, job.voiceMap)
    }
  }
  _ttsRunning = false
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
  // Also abort any in-flight ElevenLabs request
  _elAbort?.abort()
  _elAbort = null
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
