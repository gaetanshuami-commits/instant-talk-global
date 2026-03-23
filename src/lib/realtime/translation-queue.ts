export class TranslationQueue {
  private queue: string[] = [];
  private running = false;

  constructor(
    private translateSegment: (text: string) => Promise<string>,
    private onTranslated: (translatedSegment: string) => void
  ) {}

  enqueue(text: string) {
    const cleaned = text.trim();
    if (!cleaned) return;
    this.queue.push(cleaned);
    void this.run();
  }

  clear() {
    this.queue = [];
    this.running = false;
  }

  private async run() {
    if (this.running) return;
    this.running = true;

    try {
      while (this.queue.length > 0) {
        const segment = this.queue.shift();
        if (!segment) continue;

        const translated = await this.translateSegment(segment);
        this.onTranslated(translated);
      }
    } finally {
      this.running = false;
    }
  }
}
