import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk"

export function normalizeLang(lang: string) {
  const map: Record<string, string> = {
    fr: "fr-FR", en: "en-US", es: "es-ES", de: "de-DE", it: "it-IT",
    ru: "ru-RU", pl: "pl-PL", nl: "nl-NL", pt: "pt-PT", ar: "ar-SA",
    ja: "ja-JP", ko: "ko-KR", hi: "hi-IN", tr: "tr-TR", zh: "zh-CN",
    sw: "sw-KE", sv: "sv-SE", el: "el-GR", hu: "hu-HU", cs: "cs-CZ",
    bg: "bg-BG", da: "da-DK", fi: "fi-FI", sk: "sk-SK", no: "nb-NO"
  }
  return map[lang] || lang
}

async function getToken() {
  const r = await fetch("/api/azure-speech-token")
  return r.json()
}

export async function startVoiceTranslation(sourceLang, targetLang, callback) {
  const source = normalizeLang(sourceLang)
  const target = normalizeLang(targetLang)
  const { token, region } = await getToken()
  const config = SpeechSDK.SpeechTranslationConfig.fromAuthorizationToken(token, region)
  config.speechRecognitionLanguage = source
  config.addTargetLanguage(target)

  const mic = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput()
  const recognizer = new SpeechSDK.TranslationRecognizer(config, mic)

  recognizer.recognized = (s, e) => {
    const translated = e.result.translations.get(target)
    if (translated) callback(e.result.text, translated)
  }

  recognizer.startContinuousRecognitionAsync()
  return recognizer
}

export function stopVoiceTranslation(recognizer: any) {
  if (recognizer && !recognizer.isDisposed) {
    try { recognizer.stopContinuousRecognitionAsync(() => recognizer.close()) } catch (e) {}
  }
}