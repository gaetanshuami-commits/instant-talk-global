import { RoomOptions, VideoPresets } from 'livekit-client';

export const premiumRoomOptions: RoomOptions = {
  adaptiveStream: true,
  dynacast: true,
  videoCaptureDefaults: {
    resolution: VideoPresets.h1080.resolution,
  },
  publishDefaults: {
    videoEncoding: { maxBitrate: 3000000, maxFramerate: 30 },
  },
};

