import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk"

export async function speakTranslatedText(text,language){

const res=await fetch("/api/azure-speech-token")
const {token,region}=await res.json()

const config=
SpeechSDK.SpeechConfig.fromAuthorizationToken(token,region)

config.speechSynthesisLanguage=language

const player=new SpeechSDK.SpeakerAudioDestination()

const audioConfig=
SpeechSDK.AudioConfig.fromSpeakerOutput(player)

const synth=
new SpeechSDK.SpeechSynthesizer(config,audioConfig)

synth.speakTextAsync(text)

}
