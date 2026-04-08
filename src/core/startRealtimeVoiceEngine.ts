import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk"

type VoiceCallbacks = {
  onSubtitle: (text: string) => void
  onTranslatedText: (text: string) => void
}

export async function startRealtimeVoiceEngine(
  language: string,
  callbacks: VoiceCallbacks
): Promise<SpeechSDK.TranslationRecognizer> {
  const res = await fetch("/api/azure-speech-token", { cache: "no-store" })
  const { token, region } = await res.json()

  const config = SpeechSDK.SpeechTranslationConfig.fromAuthorizationToken(token, region)
  config.speechRecognitionLanguage = "fr-FR"
  config.addTargetLanguage(language)

  config.setProperty(
    SpeechSDK.PropertyId.SpeechServiceResponse_PostProcessingOption,
    "TrueText"
  )
  config.setProperty(
    SpeechSDK.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs,
    "200"
  )
  config.setProperty(
    SpeechSDK.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
    "120"
  )

  const audio = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput()
  const recognizer = new SpeechSDK.TranslationRecognizer(config, audio)

  recognizer.recognizing = (_s, e) => {
    if (e.result.text) callbacks.onSubtitle(e.result.text)
  }

  recognizer.recognized = (_s, e) => {
    if (e.result.text) callbacks.onSubtitle(e.result.text)
    const translated = e.result.translations.get(language)
    if (translated) callbacks.onTranslatedText(translated)
  }

  recognizer.startContinuousRecognitionAsync()
  return recognizer
}
