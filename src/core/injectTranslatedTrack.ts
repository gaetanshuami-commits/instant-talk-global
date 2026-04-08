import AgoraRTC, { ILocalAudioTrack, IAgoraRTCClient, IBufferSourceAudioTrack } from "agora-rtc-sdk-ng"

let translatedTrack: IBufferSourceAudioTrack | null = null

export async function injectTranslatedTrack(
  client: IAgoraRTCClient,
  audioBuffer: AudioBuffer
): Promise<void> {
  if (translatedTrack) {
    try { await client.unpublish([translatedTrack as unknown as ILocalAudioTrack]) } catch {}
    translatedTrack.close()
    translatedTrack = null
  }

  translatedTrack = await AgoraRTC.createBufferSourceAudioTrack({ source: audioBuffer })
  await client.publish([translatedTrack as unknown as ILocalAudioTrack])
  translatedTrack.startProcessAudioBuffer()
}
