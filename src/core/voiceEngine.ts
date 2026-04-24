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

// ─── Web Audio — TTS output + mic mix (Agora interpreter track) ──────────────
// ttsDestNode reçoit : 1) les chunks TTS  2) optionnellement le mic original
// → le track Agora custom publié depuis ce stream transporte les deux voix.

let ttsCtx: AudioContext | null = null
let ttsDestNode: MediaStreamAudioDestinationNode | null = null
let playbackEndTime = 0
let _micMixSource: MediaStreamAudioSourceNode | null = null
let _ttsStateChangeListener: (() => void) | null = null

export function getTTSMediaStream(): MediaStream {
  if (!ttsCtx || ttsCtx.state === "closed") {
    ttsCtx = new AudioContext({ sampleRate: 48000 })
    ttsDestNode = ttsCtx.createMediaStreamDestination()
    _ttsStateChangeListener = () => {
      if (ttsCtx?.state === "suspended") {
        ttsCtx.resume().catch(() => {})
      }
    }
    ttsCtx.addEventListener("statechange", _ttsStateChangeListener)
  }
  return ttsDestNode!.stream
}

/** Recreate the AudioContext if it has entered a terminal or suspended state.
 *  Called defensively before any PCM playback attempt. */
function ensureAudioContext(): void {
  if (!ttsCtx || ttsCtx.state === "closed") {
    ttsCtx = null
    ttsDestNode = null
    getTTSMediaStream()
  } else if (ttsCtx.state === "suspended") {
    ttsCtx.resume().catch(() => {})
  }
}

/** Injecte le micro dans le mixer TTS → remote entend voix originale + traduction. */
export function addMicToTTSMix(micTrack: MediaStreamTrack): void {
  ensureAudioContext()
  if (!ttsCtx || !ttsDestNode) return
  try {
    if (_micMixSource) { try { _micMixSource.disconnect() } catch {} }
    _micMixSource = ttsCtx.createMediaStreamSource(new MediaStream([micTrack]))
    _micMixSource.connect(ttsDestNode)
  } catch { /* non-fatal */ }
}

/** Retire le micro du mixer (appeler avant de recréer le track mic Agora). */
export function removeMicFromTTSMix(): void {
  if (_micMixSource) {
    try { _micMixSource.disconnect() } catch {}
    _micMixSource = null
  }
}

// ─── SDK module state ─────────────────────────────────────────────────────────

type SDK = typeof import("microsoft-cognitiveservices-speech-sdk")
let _sdk: SDK | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let recognizer: any       = null   // Azure TranslationRecognizer
let azureToken            = ""
let azureRegion           = ""
let azureTokenExpiry      = 0      // epoch ms; refresh at 9 min (expiry = 10 min)
let _restartTimer:   ReturnType<typeof setTimeout> | null = null  // auto-restart on transient error
let _restartAttempt = 0  // exponential backoff counter — reset on successful start
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

// Dedup: évite de jouer deux fois le même texte si isFinal se déclenche deux fois
// pour la même reconnaissance (edge case WSR). 300ms suffit — isFinal a déjà son
// propre dedup à 3s dans wsr.onresult. Le TTS spéculatif est désactivé.
let _ttsLastEnqueued   = ""
let _ttsLastEnqueuedAt = 0

// ─── Scheduled AudioBufferSources — stopped on interrupt ─────────────────────
// When a TTS sentence is interrupted mid-playback, chunks already scheduled via
// AudioBufferSource.start() keep playing unless explicitly stopped. This causes
// the "weird noise" glitch when a new sentence overrides the current one.
const _scheduledSources: AudioBufferSourceNode[] = []

function stopScheduledSources(): void {
  const now = ttsCtx?.currentTime ?? 0
  for (const src of _scheduledSources) {
    try { src.stop(now) } catch {}
  }
  _scheduledSources.length = 0
  playbackEndTime = 0
}

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
/** Mise à jour instantanée du genre TTS — sans redémarrer la reconnaissance vocale. */
export function setTTSGender(gender: VoiceGender): void {
  _ttsGenderGlobal = gender
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

// ─── PCM streaming — joue les chunks audio dès leur arrivée ─────────────────
// ElevenLabs pcm_16000 = PCM 16-bit little-endian mono 16 kHz, sans en-tête.
// Chaque chunk (~2-5 KB) représente ~80-200 ms d'audio jouable immédiatement.
// Réduit la latence TTS de ~300-500 ms (attente MP3 complet) à ~80-120 ms.

async function streamPCMAudio(
  stream: ReadableStream<Uint8Array>,
  sampleRate: number,
  signal: AbortSignal
): Promise<void> {
  ensureAudioContext()
  const ctx  = ttsCtx!
  const dest = ttsDestNode!
  console.log(`[TTS] streamPCMAudio ctx=${ctx.state}`)
  if (ctx.state === "suspended") {
    try { await ctx.resume() } catch {}
    console.log(`[TTS] ctx after resume: ${ctx.state}`)
  }

  const reader = stream.getReader()
  // 5 ms chunks — premier audio audible dès le premier mot traduit
  const MIN_BYTES = Math.floor(sampleRate * 0.005) * 2
  let pending = new Uint8Array(0)
  let _firstChunk = true

  function playChunk(data: Uint8Array): void {
    if (_firstChunk) { _firstChunk = false; console.log(`[TTS] first audio chunk ${data.length}B → Agora stream`) }
    if (signal.aborted) return
    const samples = Math.floor(data.length / 2)
    if (samples < 1) return
    const buf  = ctx.createBuffer(1, samples, sampleRate)
    const ch   = buf.getChannelData(0)
    const view = new DataView(data.buffer, data.byteOffset, samples * 2)
    for (let i = 0; i < samples; i++) ch[i] = view.getInt16(i * 2, true) / 32768
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(dest)   // → Agora interpreter track uniquement (remote entend, pas le speaker)
    const now     = ctx.currentTime
    const startAt = Math.max(now + 0.005, playbackEndTime)
    // Track so stopScheduledSources() can stop this chunk on interrupt
    _scheduledSources.push(src)
    src.onended = () => {
      const i = _scheduledSources.indexOf(src)
      if (i !== -1) _scheduledSources.splice(i, 1)
    }
    src.start(startAt)
    playbackEndTime = startAt + buf.duration
  }

  try {
    while (!signal.aborted) {
      let done = false
      let value: Uint8Array | undefined
      try {
        // reader.read() can throw "BodyStreamBuffer" when the stream is cancelled
        // externally (AbortController fired). Catch individually so the outer
        // finally still runs and the function exits cleanly.
        ;({ done, value } = await reader.read())
      } catch {
        break
      }
      if (done || signal.aborted) break
      if (value?.length) {
        const merged = new Uint8Array(pending.length + value.length)
        merged.set(pending)
        merged.set(value, pending.length)
        pending = merged
        while (pending.length >= MIN_BYTES) {
          playChunk(pending.slice(0, MIN_BYTES))
          pending = pending.slice(MIN_BYTES)
        }
      }
    }
    // Drain remaining bytes — only when we completed normally (not aborted)
    if (!signal.aborted && pending.length >= 2) {
      playChunk(pending.slice(0, pending.length & ~1))
    }
  } finally {
    // Always release the reader lock — prevents "BodyStreamBuffer already locked" on next call
    try { reader.cancel() } catch {}
  }
}

async function speakWithElevenLabs(text: string, lang: string): Promise<void> {
  console.log(`[TTS] speakWithElevenLabs → "${text.slice(0, 40)}" lang=${lang} ctx=${ttsCtx?.state ?? "null"}`)
  _elAbort?.abort()
  const ctrl = new AbortController()
  _elAbort = ctrl

  try {
    const res = await fetch("/api/elevenlabs-tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        lang,
        gender:  _ttsGenderGlobal,
        voiceId: _clonedVoiceId ?? undefined,
      }),
      signal: ctrl.signal,
    })
    console.log(`[TTS] EL response: ${res.status}`)
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}`)
    if (!res.body) throw new Error("No response stream")
    await streamPCMAudio(res.body, 16000, ctrl.signal)
    console.log("[TTS] PCM stream complete")
  } catch (err) {
    // DOMException on Chrome, plain Error on Firefox/Safari
    const isAbort = err instanceof Error && (
      err.name === "AbortError" ||
      /BodyStreamBuffer|aborted/i.test(err.message)
    )
    if (isAbort) return
    console.error("[TTS] ElevenLabs error:", err)
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
    // null AudioConfig : dans le SDK 1.49, le navigateur retourne l'audio
    // exclusivement via result.audioData — pas de lecture sur les haut-parleurs.
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
    const hint = res.status === 401 || /401|invalid subscription/i.test(data.details ?? "")
      ? "Service vocal: clé invalide ou région incorrecte"
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
    // Charge le SDK STT serveur uniquement sur les navigateurs sans Web Speech API
    // (iOS Safari). Chrome/Edge utilisent l'API native — pas de token requis.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasSR = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    if (!hasSR) {
      if (!_sdk) _sdk = await import("microsoft-cognitiveservices-speech-sdk")
      await ensureToken()
    }
  } catch {
    // Non-fatal — retried in startTranslation if needed
  }
}

/** Pre-resume the AudioContext so the first TTS playback has no suspend delay.
 *  Sur mobile (iOS/Android) appeler cette fonction dans le gestionnaire de clic
 *  avant tout await pour maintenir le contexte de geste utilisateur. */
export function unlockAudioContextSync(): void {
  try {
    if (!ttsCtx) getTTSMediaStream()
    // fire-and-forget : doit être appelé dans le call-stack synchrone du geste
    if (ttsCtx?.state === "suspended") void ttsCtx.resume()
  } catch { /* non-fatal */ }
}

export async function warmAudioContext(): Promise<void> {
  try {
    if (!ttsCtx) getTTSMediaStream()
    if (ttsCtx && ttsCtx.state === "suspended") await ttsCtx.resume()
  } catch { /* non-fatal */ }
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
  callbacks.onFallback?.()
  console.info(`[VoiceEngine] mode compatible activé — ${reason}`)
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

  // Timestamp du dernier résultat final — protection anti-replay sur 2s
  // sans bloquer les phrases identiques prononcées légitimement plus tard.
  let lastFinalText = ""
  let lastFinalAt   = 0

  function createWSR() {
    const wsr = new SR()
    wsr.lang            = SOURCE_LOCALE[sourceLang] ?? "fr-FR"
    wsr.continuous      = true   // pas de gap de session entre phrases
    wsr.interimResults  = true   // partials immédiatement visibles
    wsr.maxAlternatives = 3      // 3 alternatives → choisir le meilleur résultat
    _wsr = wsr

    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    let prefetchText   = ""
    let prefetchCache: Record<string, string> | null = null

    // ── Pré-chargement de traduction (sans TTS spéculatif) ───────────────────
    // Dès 80ms de pause dans la parole, la traduction est fetchée en avance et
    // mise en cache. Quand isFinal arrive, on utilise le cache (0ms lookup) →
    // ElevenLabs démarre immédiatement. TTS spéculatif désactivé car il causait
    // un cascade d'AbortError et bloquait le TTS final via le dedup.
    const prefetchTranslation = (text: string) => {
      if (text === prefetchText && prefetchCache) return
      prefetchText  = text
      prefetchCache = null
      void fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLangs: targets }),
      }).then(r => r.ok ? r.json() : null).then(data => {
        if (!data || prefetchText !== text) return
        prefetchCache = data.translations ?? {}
        // Translation is cached here; TTS fires only on isFinal (see wsr.onresult).
        // Starting ElevenLabs on every 80ms partial triggered an abort cascade:
        // each new partial aborted the previous fetch → BodyStreamBuffer flood, and
        // the dedup blocked the final TTS if the last speculative text matched the final.
      }).catch(() => {})
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wsr.onresult = async (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        // Choisir la meilleure alternative parmi les 3 (la plus longue = la plus complète)
        let transcript = result[0].transcript.trim()
        for (let a = 1; a < result.length; a++) {
          const alt = result[a]?.transcript?.trim() ?? ""
          if (alt.length > transcript.length) transcript = alt
        }
        if (!transcript) continue

        if (!result.isFinal) {
          const isRestartEcho = transcript === lastFinalText
            && (Date.now() - lastFinalAt) < 2000
          if (!isRestartEcho) {
            for (const lang of targets) callbacks.onPartial(lang, transcript)
          }
          // Debounce 80ms (réduit depuis 150ms) → pré-chargement + TTS spéculatif plus tôt
          if (debounceTimer) clearTimeout(debounceTimer)
          debounceTimer = setTimeout(() => {
            debounceTimer = null
            if (_wsrActive) prefetchTranslation(transcript)
          }, 80)
          continue
        }

        // ── isFinal ───────────────────────────────────────────────────────────
        if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null }

        const now = Date.now()
        if (transcript === lastFinalText && now - lastFinalAt < 3000) continue
        lastFinalText = transcript
        lastFinalAt   = now

        // Traduction : cache pré-chargé (0ms) ou fetch immédiat
        let batchTranslations: Record<string, string>
        if (prefetchCache && prefetchText === transcript) {
          batchTranslations = prefetchCache
          prefetchCache = null
        } else {
          try {
            const res = await fetch("/api/translate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: transcript, targetLangs: targets }),
            })
            const data = await res.json()
            batchTranslations = data.translations ?? {}
          } catch {
            for (const lang of targets) callbacks.onFinal(lang, transcript)
            continue
          }
        }

        for (const lang of targets) {
          const translated = batchTranslations[lang] ?? transcript
          callbacks.onFinal(lang, translated)
          if (ttsLang && lang === ttsLang) {
            const rc = getRemoteCount ? getRemoteCount() : 1
            console.log(`[TTS] isFinal → "${translated.slice(0, 40)}" | remoteCount=${rc}`)
            if (rc > 0) enqueueTTS(translated, lang, voiceMap)
            else console.warn("[TTS] SKIP — no remote participants tracked yet")
          }
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wsr.onerror = (event: any) => {
      console.warn("[WSR] error:", event.error)
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        callbacks.onError?.("Microphone permission denied.")
      }
      // no-speech, aborted, network → non-fatals, onend relance
    }

    wsr.onend = () => {
      if (!_wsrActive || _wsr !== wsr) return
      if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null }
      const tryStart = (attempt: number) => {
        try { wsr.start() } catch {
          if (attempt < 5) setTimeout(() => {
            if (_wsrActive && _wsr === wsr) tryStart(attempt + 1)
          }, 200 * attempt)
        }
      }
      tryStart(1)
    }

    // Micro Agora reste ouvert → pas besoin d'attendre la libération du hardware.
    // Démarrage immédiat de la reconnaissance vocale.
    setTimeout(() => {
      if (_wsrActive && _wsr === wsr) {
        try { wsr.start() } catch { /* onend gérera */ }
      }
    }, 50)
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

  // ── Compute targets — toutes les 26+ langues, y compris le Lingala ──────────
  const targets = targetLangs.filter((t) => t !== sourceLang)
  if (targets.length === 0) targets.push(sourceLang === "en" ? "fr" : "en")

  _ttsGenderGlobal = voiceGender
  const voiceMap = voiceGender === "male" ? TTS_VOICE_MALE : TTS_VOICE_FEMALE

  // ── Primaire : Web Speech API (Chrome, Edge, Android, Samsung Browser) ──────
  // Reconnaissance vocale native du navigateur — aucune clé API requise, premiers
  // résultats partiels en <50 ms. Traductions via /api/translate (DeepL + Gemini)
  // en batch parallèle : toutes les 26 langues en ~150–400 ms depuis la fin de parole.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SR = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  if (SR) {
    _fallbackMode = false
    await startWebSpeechFallback(sourceLang, targets, callbacks, ttsLang, voiceGender, getRemoteCount)
    return
  }

  // ── Secondaire : STT serveur (iOS Safari — Web Speech indisponible) ─────────
  let sdk: SDK
  try {
    if (!_sdk) _sdk = await import("microsoft-cognitiveservices-speech-sdk")
    sdk = _sdk
    await ensureToken()
    _fallbackMode = false
  } catch {
    callbacks.onError?.(
      "Reconnaissance vocale non disponible. Utilisez Chrome ou Edge pour la meilleure expérience."
    )
    return
  }

  const speechConfig = sdk.SpeechTranslationConfig.fromAuthorizationToken(
    azureToken, azureRegion
  )
  speechConfig.speechRecognitionLanguage = SOURCE_LOCALE[sourceLang] ?? "fr-FR"

  // ── Latency ────────────────────────────────────────────────────────────────
  // 300 ms end-silence: 150 ms was too aggressive — natural speech pauses (200-500 ms)
  // were causing premature phrase cuts and flooding the pipeline with no-speech events.
  speechConfig.setProperty(
    sdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "300"
  )
  speechConfig.setProperty(
    sdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "30000"
  )
  // TrueText removed: adds 300ms+ latency on finals, no benefit for live translation

  // Lingala non supporté par le STT serveur — traduit via notre API en complément
  const azureTargets = targets.filter((t) => t !== "ln")
  for (const lang of azureTargets) speechConfig.addTargetLanguage(toAzureTarget(lang))

  const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput()
  recognizer = new sdk.TranslationRecognizer(speechConfig, audioConfig)
  const r = recognizer

  // ── recognizing: sous-titre partiel immédiat ────────────────────────────────
  r.recognizing = (
    _s: unknown,
    e: { result: { translations: { get: (l: string) => string } } }
  ) => {
    if (!e.result.translations) return
    for (const lang of azureTargets) {
      const text = e.result.translations.get(toAzureTarget(lang))
      if (text) callbacks.onPartial(lang, text)
    }
  }

  // ── recognized: sous-titre final + TTS ────────────────────────────────────
  r.recognized = (
    _s: unknown,
    e: { result: { reason: number; text?: string; translations: { get: (l: string) => string } } }
  ) => {
    if (e.result.reason !== sdk.ResultReason.TranslatedSpeech) return
    if (!e.result.translations) return
    const recognizedText = e.result.text ?? ""
    console.log(`[Azure] recognized: "${recognizedText.slice(0, 60)}"`)


    // Traductions retournées par le service
    const missingLangs: string[] = []
    for (const lang of azureTargets) {
      const text = e.result.translations.get(toAzureTarget(lang))
      if (text) {
        callbacks.onFinal(lang, text)
        if (ttsLang && lang === ttsLang) {
          const rc = getRemoteCount ? getRemoteCount() : 1
          if (rc > 0) enqueueTTS(text, lang, voiceMap)
        }
      } else if (recognizedText) {
        missingLangs.push(lang)
      }
    }

    // Pour les langues non couvertes (Lingala + manquantes) — notre API de traduction
    const extraLangs = [...missingLangs, ...targets.filter((t) => t === "ln")]
    if (extraLangs.length > 0 && recognizedText) {
      void fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: recognizedText, targetLangs: extraLangs }),
      }).then((res) => res.json()).then((data) => {
        const batch: Record<string, string> = data.translations ?? {}
        for (const lang of extraLangs) {
          const translated = batch[lang] ?? recognizedText
          if (!translated) continue
          callbacks.onFinal(lang, translated)
          if (ttsLang && lang === ttsLang) {
            const rc = getRemoteCount ? getRemoteCount() : 1
            if (rc > 0) enqueueTTS(translated, lang, voiceMap)
          }
        }
      }).catch(() => {
        for (const lang of extraLangs) if (recognizedText) callbacks.onFinal(lang, recognizedText)
      })
    }
  }

  // ── canceled: erreurs fatales + fallback automatique ─────────────────────
  r.canceled = (
    _s: unknown,
    e: { reason: number; errorDetails: string }
  ) => {
    if (e.reason !== sdk.CancellationReason.Error) return
    const detail = e.errorDetails ?? ""

    const isQuota = /quota exceeded|too many requests|429/i.test(detail)
    const isAuth  = /authentication error|authentication failed|401|403|unauthorized/i.test(detail)

    if (recognizer === r) recognizer = null
    try { r.close() } catch {}

    if (isQuota || isAuth) {
      _restartAttempt = 0
      activateWebSpeechFallback(
        "Service STT indisponible",
        sourceLang, targets, callbacks, ttsLang, voiceGender, getRemoteCount
      ).catch(() => {
        callbacks.onError?.("Reconnaissance vocale indisponible. Utilisez Chrome ou Edge.")
      })
    } else {
      // Erreur transitoire — backoff exponentiel : 1s, 2s, 4s, 8s… max 30s
      _restartAttempt++
      const delay = Math.min(1000 * Math.pow(2, _restartAttempt - 1), 30_000)
      if (_restartTimer) clearTimeout(_restartTimer)
      _restartTimer = setTimeout(() => {
        _restartTimer = null
        if (recognizer !== null) return
        startTranslation(
          sourceLang, targetLangs, callbacks, ttsLang, voiceGender, getRemoteCount, allowedLangs
        ).catch(() => {
          callbacks.onError?.("Erreur de reconnaissance vocale. Réessayez.")
        })
      }, delay)
    }
  }

  await new Promise<void>((resolve, reject) => {
    r.startContinuousRecognitionAsync(resolve, reject)
  })
  _restartAttempt = 0  // successful start — reset backoff
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
  removeMicFromTTSMix()
  stopScheduledSources()
  if (ttsCtx) {
    if (_ttsStateChangeListener) {
      ttsCtx.removeEventListener("statechange", _ttsStateChangeListener)
      _ttsStateChangeListener = null
    }
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
  _ttsLastEnqueued   = ""  // reset dedup
  _ttsLastEnqueuedAt = 0

  // Stop any audio already scheduled — clean silence immediately on stop
  stopScheduledSources()

  cancelActiveSynth()  // also aborts any in-flight EL request

  // Release cached Azure TTS synthesizer to free the WebSocket connection.
  if (_azureSynth) {
    try { _azureSynth.close() } catch {}
    _azureSynth = null
    _azureSynthVoice = ""
  }

  // Cancel any pending auto-restart
  if (_restartTimer) { clearTimeout(_restartTimer); _restartTimer = null }
  _restartAttempt = 0

  // Stop Web Speech API fallback if active
  stopWebSpeechFallback()

  // Stop Azure recognizer if active
  if (!recognizer) return
  const r = recognizer
  recognizer = null
  // Null callbacks before stopping — prevents buffered events from firing into stale closures
  r.recognizing = null
  r.recognized  = null
  r.canceled    = null
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
  // Dedup court (300ms) : évite que isFinal se déclenche deux fois pour la même
  // reconnaissance (edge case WSR). Suffisant car isFinal a son propre dedup à 3s.
  const now = Date.now()
  if (text === _ttsLastEnqueued && (now - _ttsLastEnqueuedAt) < 300) return
  _ttsLastEnqueued   = text
  _ttsLastEnqueuedAt = now
  // Drop stale queued items — only keep the job that was just added.
  _ttsQueue.length = 0
  _ttsQueue.push({ text, lang, voiceMap })
  if (_ttsRunning) {
    // Interrupt ongoing playback: abort the in-flight EL fetch + stop already-scheduled
    // AudioBufferSources. Without stopScheduledSources() the old chunks keep playing
    // in parallel with the new sentence → noise/double audio.
    _elAbort?.abort()
    _elAbort = null
    stopScheduledSources()
  } else {
    void drainTTSQueue().catch(() => {})
  }
}

async function drainTTSQueue(): Promise<void> {
  if (_ttsRunning) return  // already running — the existing loop will pick up queue items
  _ttsRunning = true
  try {
    while (_ttsQueue.length > 0) {
      const job = _ttsQueue.shift()!
      cancelActiveSynth()
      await speakWithElevenLabs(job.text, job.lang)
    }
  } finally {
    _ttsRunning = false
  }
}

function cancelActiveSynth(): void {
  const done  = activeSynthDone
  const synth = activeSynth
  activeSynth     = null
  activeSynthDone = null
  if (synth) {
    try { synth.close() } catch {}
    if (_azureSynth === synth) { _azureSynth = null; _azureSynthVoice = "" }
  }
  done?.()
  _elAbort?.abort()
  _elAbort = null
  // Stop any audio already scheduled — prevents zombie chunks playing after cancel
  stopScheduledSources()
}

// ─── Web Audio: sequential TTS playback into Agora interpreter track ──────────

async function scheduleAudio(audioData: ArrayBuffer): Promise<void> {
  ensureAudioContext()
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
  _scheduledSources.push(source)
  source.onended = () => {
    const i = _scheduledSources.indexOf(source)
    if (i !== -1) _scheduledSources.splice(i, 1)
  }
  source.start(startAt)
  playbackEndTime = startAt + decoded.duration
}
