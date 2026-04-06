import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk"

export type RealtimeTextCallbacks = {
  onRecognized?: (text: string) => void
  onTranslated?: (text: string) => void
}

export type VoiceTranslationRecognizer =
  SpeechSDK.TranslationRecognizer | null

async function getAzureSpeechToken() {
  const response = await fetch("/api/azure-speech-token", {
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Azure token error (${response.status})`)
  }

  const data = await response.json()

  if (!data?.token || !data?.region) {
    throw new Error("Azure token payload invalid")
  }

  return data as { token: string; region: string }
}

function normalizeSourceLang(lang: string) {
  const map: Record<string, string> = {
    fr: "fr-FR",
    en: "en-US",
    es: "es-ES",
    ar: "ar-SA",
    de: "de-DE",
    bg: "bg-BG",
    da: "da-DK",
    fi: "fi-FI",
    el: "el-GR",
    hu: "hu-HU",
    it: "it-IT",
    nl: "nl-NL",
    no: "nb-NO",
    pl: "pl-PL",
    pt: "pt-PT",
    ro: "ro-RO",
    ru: "ru-RU",
    sk: "sk-SK",
    sv: "sv-SE",
    cs: "cs-CZ",
    ko: "ko-KR",
    hi: "hi-IN",
    ja: "ja-JP",
    sw: "sw-KE",
    tr: "tr-TR",
    zh: "zh-CN",
    "zh-Hans": "zh-CN",
  }

  return map[lang] ?? ""
}

function normalizeTargetLang(lang: string) {
  const map: Record<string, string> = {
    fr: "fr",
    en: "en",
    es: "es",
    ar: "ar",
    de: "de",
    bg: "bg",
    da: "da",
    fi: "fi",
    el: "el",
    hu: "hu",
    it: "it",
    nl: "nl",
    no: "nb",
    pl: "pl",
    pt: "pt",
    ro: "ro",
    ru: "ru",
    sk: "sk",
    sv: "sv",
    cs: "cs",
    ko: "ko",
    hi: "hi",
    ja: "ja",
    sw: "sw",
    tr: "tr",
    zh: "zh-Hans",
    "zh-Hans": "zh-Hans",
  }

  return map[lang] ?? ""
}

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").replace(/\s([?.!,])/g, "$1").trim()
}

export async function stopVoiceTranslation(
  recognizer: VoiceTranslationRecognizer
) {
  if (!recognizer) return

  await new Promise<void>((resolve) => {
    try {
      recognizer.stopContinuousRecognitionAsync(
        () => {
          try {
            recognizer.close()
          } catch {}
          resolve()
        },
        () => {
          try {
            recognizer.close()
          } catch {}
          resolve()
        }
      )
    } catch {
      try {
        recognizer.close()
      } catch {}
      resolve()
    }
  })
}

export async function startVoiceTranslation(
  sourceLang: string,
  targetLang: string,
  subtitleCallback: (text: string) => void,
  audioCallback: (audio: ArrayBuffer) => void,
  callbacks?: RealtimeTextCallbacks
) {
  const normalizedSource = normalizeSourceLang(sourceLang)
  const normalizedTarget = normalizeTargetLang(targetLang)

  if (!normalizedSource) {
    throw new Error(`Unsupported source language: ${sourceLang}`)
  }

  if (!normalizedTarget) {
    throw new Error(`Unsupported target language: ${targetLang}`)
  }

  const { token, region } = await getAzureSpeechToken()

  const config =
    SpeechSDK.SpeechTranslationConfig.fromAuthorizationToken(token, region)

  config.speechRecognitionLanguage = normalizedSource
  config.addTargetLanguage(normalizedTarget)

  config.setProperty(
    SpeechSDK.PropertyId.SpeechServiceResponse_PostProcessingOption,
    "TrueText"
  )
  config.setProperty(
    SpeechSDK.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs,
    "700"
  )
  config.setProperty(
    SpeechSDK.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
    "400"
  )
  config.setProperty(
    SpeechSDK.PropertyId.SpeechServiceResponse_StablePartialResultThreshold,
    "3"
  )

  const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput()
  const recognizer = new SpeechSDK.TranslationRecognizer(config, audioConfig)

  recognizer.recognizing = (_, event) => {
    const partial = event.result?.text?.trim()
    if (!partial) return
    callbacks?.onRecognized?.(cleanText(partial))
  }

  recognizer.recognized = (_, event) => {
    const original = event.result?.text?.trim()
    const translated = event.result?.translations?.get(normalizedTarget)?.trim()

    if (original) {
      callbacks?.onRecognized?.(cleanText(original))
    }

    if (translated) {
      const cleanTranslated = cleanText(translated)
      subtitleCallback(cleanTranslated)
      callbacks?.onTranslated?.(cleanTranslated)
    }
  }

  recognizer.synthesizing = (_, event) => {
    if (event.result?.audio) {
      audioCallback(event.result.audio)
    }
  }

  recognizer.canceled = (_, event) => {
    console.error("Azure canceled:", event)
  }

  recognizer.sessionStarted = () => {
    console.log("Azure session started")
  }

  recognizer.sessionStopped = () => {
    console.log("Azure session stopped")
  }

  await new Promise<void>((resolve, reject) => {
    recognizer.startContinuousRecognitionAsync(
      () => resolve(),
      (err) => reject(err)
    )
  })

  return recognizer
}
