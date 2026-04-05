import AgoraRTC from "agora-rtc-sdk-ng"

let translatedTrack = null

export async function injectTranslatedTrack(
  client,
  audioBuffer
) {
  const blob = new Blob([audioBuffer], {
    type: "audio/wav"
  })

  const url =
    URL.createObjectURL(blob)

  const audio =
    new Audio(url)

  if (translatedTrack) {
    try {
      await client.unpublish([
        translatedTrack
      ])
    } catch {}

    translatedTrack.close()
    translatedTrack = null
  }

  translatedTrack =
    await AgoraRTC.createBufferSourceAudioTrack({
      source: audio
    })

  await client.publish([
    translatedTrack
  ])

  await translatedTrack.start()
}
