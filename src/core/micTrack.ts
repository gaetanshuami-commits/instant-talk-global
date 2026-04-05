import AgoraRTC from "agora-rtc-sdk-ng"

export async function createMicTrack() {

  const track =
    await AgoraRTC.createMicrophoneAudioTrack()

  return track
}