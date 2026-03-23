import { LocalAudioTrack, Room } from "livekit-client";

export async function publishTranslatedAudioTrack(
  room: Room,
  audioBuffer: ArrayBuffer
) {
  const AudioContextClass =
    window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error("AudioContext is not supported in this browser.");
  }

  const audioContext = new AudioContextClass();

  const decodedAudio = await audioContext.decodeAudioData(audioBuffer.slice(0));

  const source = audioContext.createBufferSource();
  source.buffer = decodedAudio;

  const destination = audioContext.createMediaStreamDestination();
  source.connect(destination);

  const mediaTrack = destination.stream.getAudioTracks()[0];
  if (!mediaTrack) {
    throw new Error("No audio track available from MediaStreamDestination.");
  }

  const localTrack = new LocalAudioTrack(mediaTrack);

  await room.localParticipant.publishTrack(localTrack, {
    name: `translated-audio-${Date.now()}`,
  });

  source.start(0);

  source.onended = async () => {
    try {
      await room.localParticipant.unpublishTrack(localTrack);
    } catch (error) {
      console.error("[publish-translated-track] unpublish failed:", error);
    }

    try {
      localTrack.stop();
    } catch (error) {
      console.error("[publish-translated-track] stop failed:", error);
    }

    try {
      mediaTrack.stop();
    } catch (error) {
      console.error("[publish-translated-track] mediaTrack stop failed:", error);
    }

    try {
      await audioContext.close();
    } catch (error) {
      console.error("[publish-translated-track] audioContext close failed:", error);
    }
  };

  return localTrack;
}