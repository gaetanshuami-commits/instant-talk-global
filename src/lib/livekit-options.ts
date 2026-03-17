import { RoomOptions, VideoPresets } from 'livekit-client';

export const premiumRoomOptions: RoomOptions = {
  adaptiveStream: true,
  dynacast: true,
  videoCaptureDefaults: {
    resolution: VideoPresets.h1080.resolution,
  },
  publishDefaults: {
    videoEncoding: VideoPresets.h1080,
    videoSimulcast: true,
  },
};