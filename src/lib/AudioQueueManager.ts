export class AudioQueueManager {
  private queue: string[] = [];
  private isPlaying: boolean = false;
  private audioContext: AudioContext | null = null;

  async addAudio(base64Audio: string) {
    this.queue.push(base64Audio);
    if (!this.isPlaying) {
      this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }
    this.isPlaying = true;
    const base64 = this.queue.shift();
    if (!base64) return;
    try {
      const audioData = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const buffer = await this.audioContext.decodeAudioData(audioData.buffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.onended = () => this.playNext();
      source.start();
    } catch (e) {
      console.error("Erreur lecture audio:", e);
      this.playNext();
    }
  }
}
