import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk"

export async function startRealtimeVoiceEngine(language, callbacks){

const res=await fetch("/api/azure-speech-token",{cache:"no-store"})
const {token,region}=await res.json()

const config=
SpeechSDK.SpeechTranslationConfig.fromAuthorizationToken(
token,
region
)

config.speechRecognitionLanguage="fr-FR"

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

const audio=
SpeechSDK.AudioConfig.fromDefaultMicrophoneInput()

const recognizer=
new SpeechSDK.TranslationRecognizer(config,audio)

recognizer.recognizing=(_,e)=>{

if(e.result.text){

callbacks.onSubtitle(e.result.text)

}

}

recognizer.recognized=(_,e)=>{

const text=e.result.text

if(text){

callbacks.onSubtitle(text)

}

const translated=
e.result.translations.get(language)

if(translated){

callbacks.onTranslatedText(translated)

}

}

recognizer.startContinuousRecognitionAsync()

return recognizer

}
