import * as sdk from "microsoft-cognitiveservices-speech-sdk"

async function getAzureSpeechToken() {
  const response = await fetch("/api/azure-speech-token")

  if (!response.ok) {
    throw new Error("Unable to get Azure speech token")
  }

  return response.json()
}

export type RealtimeTextCallbacks = {
  onRecognized: (text: string) => void
  onTranslated: (text: string) => void
}

function getAzureVoice(targetLang: string) {
  switch (targetLang) {
    case "fr":
      return "fr-FR-DeniseNeural"
    case "es":
      return "es-ES-ElviraNeural"
    case "ar":
      return "ar-SA-ZariyahNeural"
    case "de":
      return "de-DE-KatjaNeural"
    case "it":
      return "it-IT-ElsaNeural"
    case "pt":
      return "pt-PT-RaquelNeural"
    case "ru":
      return "ru-RU-SvetlanaNeural"
    case "ja":
      return "ja-JP-NanamiNeural"
    case "ko":
      return "ko-KR-SunHiNeural"
    case "zh":
    case "zh-Hans":
      return "zh-CN-XiaoxiaoNeural"
    case "tr":
      return "tr-TR-EmelNeural"
    case "pl":
      return "pl-PL-ZofiaNeural"
    case "nl":
      return "nl-NL-ColetteNeural"
    case "ro":
      return "ro-RO-AlinaNeural"
    case "sv":
      return "sv-SE-SofieNeural"
    case "cs":
      return "cs-CZ-VlastaNeural"
    case "bg":
      return "bg-BG-KalinaNeural"
    case "da":
      return "da-DK-ChristelNeural"
    case "fi":
      return "fi-FI-SelmaNeural"
    case "el":
      return "el-GR-AthinaNeural"
    case "hu":
      return "hu-HU-NoemiNeural"
    case "no":
      return "nb-NO-PernilleNeural"
    case "sk":
      return "sk-SK-ViktoriaNeural"
    case "hi":
      return "hi-IN-SwaraNeural"
    case "sw":
      return "sw-KE-ZuriNeural"
    default:
      return "en-US-JennyNeural"
  }
}

export async function startVoiceTranslation(
  sourceLang: string,
  targetLang: string,
  subtitleCallback: (text: string) => void,
  audioCallback: (audio: ArrayBuffer) => void,
  callbacks?: Partial<RealtimeTextCallbacks>
) {
  const { token, region } = await getAzureSpeechToken()

  const config = sdk.SpeechTranslationConfig.fromAuthorizationToken(
    token,
    region
  )

  config.speechRecognitionLanguage = sourceLang
  config.addTargetLanguage(targetLang)

  config.setProperty(
    sdk.PropertyId.SpeechServiceConnection_TranslationVoice,
    getAzureVoice(targetLang)
  )

  config.setProperty(
    sdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs,
    "700"
  )

  config.setProperty(
    sdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
    "400"
  )

  config.setProperty(
    sdk.PropertyId.SpeechServiceResponse_StablePartialResultThreshold,
    "3"
  )

  config.setProperty(
    sdk.PropertyId.SpeechServiceResponse_PostProcessingOption,
    "TrueText"
  )

  const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput()
  const recognizer = new sdk.TranslationRecognizer(config, audioConfig)

  recognizer.recognizing = (_, event) => {
    const partialText = event.result?.text?.trim()
    if (!partialText) return
    callbacks?.onRecognized?.(partialText)
  }

  recognizer.recognized = (_, event) => {
    const originalText = event.result?.text?.trim()
    const translated = event.result?.translations?.get(targetLang)?.trim()

    console.log("Azure recognized:", originalText)
    console.log("Azure translated:", translated)

    if (originalText) {
      callbacks?.onRecognized?.(originalText)
    }

    if (translated) {
      subtitleCallback(translated)
      callbacks?.onTranslated?.(translated)
    }
  }

  recognizer.synthesizing = (_, event) => {
    if (event.result?.audio) {
      console.log("Azure synthesized audio received")
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

  recognizer.startContinuousRecognitionAsync()

  return recognizer
}
