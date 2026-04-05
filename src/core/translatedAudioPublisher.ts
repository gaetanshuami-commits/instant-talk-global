import AgoraRTC from "agora-rtc-sdk-ng"

let audioContext: AudioContext | null = null
let destinationNode: MediaStreamAudioDestinationNode | null = null
let outputGainNode: GainNode | null = null
let translatedCustomTrack: any = null

async function ensureAudioGraph() {
  if (!audioContext) {
    audioContext = new AudioContext()
  }

  if (audioContext.state === "suspended") {
    await audioContext.resume()
  }

  if (!destinationNode) {
    destinationNode = audioContext.createMediaStreamDestination()
  }

  if (!outputGainNode) {
    outputGainNode = audioContext.createGain()
    outputGainNode.gain.value = 1
    outputGainNode.connect(audioContext.destination)
    outputGainNode.connect(destinationNode)
  }

  return {
    audioContext,
    destinationNode,
    outputGainNode,
  }
}

export async function ensureTranslatedAudioPublished(client: any) {
  const graph = await ensureAudioGraph()

  if (translatedCustomTrack) {
    return translatedCustomTrack
  }

  const mediaStreamTrack = graph.destinationNode.stream.getAudioTracks()[0]

  if (!mediaStreamTrack) {
    throw new Error("Impossible de créer la piste audio traduite")
  }

  translatedCustomTrack = AgoraRTC.createCustomAudioTrack({
    mediaStreamTrack,
  })

  await client.publish([translatedCustomTrack])

  return translatedCustomTrack
}

export async function playTranslatedAudioBuffer(audioBuffer: ArrayBuffer) {
  const graph = await ensureAudioGraph()

  const decodedBuffer = await graph.audioContext.decodeAudioData(
    audioBuffer.slice(0)
  )

  const source = graph.audioContext.createBufferSource()
  source.buffer = decodedBuffer
  source.connect(graph.outputGainNode)
  source.start(0)
}
