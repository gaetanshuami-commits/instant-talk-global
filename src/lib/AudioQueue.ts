export class AudioQueue {
  public context: AudioContext;
  public destination: MediaStreamAudioDestinationNode;
  private nextStartTime: number;
  private activeSources: AudioBufferSourceNode[];

  constructor() {
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 48000 });
    this.destination = this.context.createMediaStreamDestination();
    this.nextStartTime = 0;
    this.activeSources = [];
  }

  public addPCM16(pcmData: ArrayBuffer) {
    const int16 = new Int16Array(pcmData);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }

    const buffer = this.context.createBuffer(1, float32.length, this.context.sampleRate);
    buffer.getChannelData(0).set(float32);

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.destination);

    const currentTime = this.context.currentTime;
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime;
    }

    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
    this.activeSources.push(source);

    source.onended = () => {
      this.activeSources = this.activeSources.filter((s) => s !== source);
    };
  }

  public flush() {
    this.activeSources.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {}
    });
    this.activeSources = [];
    this.nextStartTime = this.context.currentTime;
  }
}
