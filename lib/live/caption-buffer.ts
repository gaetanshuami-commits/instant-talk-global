export type CaptionUpdate =
  | {
      type: "interim";
      text: string;
      interimText: string;
      finalText: string;
    }
  | {
      type: "final";
      text: string;
      interimText: string;
      finalText: string;
      newFinalSegment: string;
    };

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export class CaptionBuffer {
  private interimText = "";
  private finalSegments: string[] = [];

  reset() {
    this.interimText = "";
    this.finalSegments = [];
  }

  getSnapshot() {
    const finalText = normalizeText(this.finalSegments.join(" "));
    const interimText = normalizeText(this.interimText);
    const text = normalizeText([finalText, interimText].filter(Boolean).join(" "));

    return {
      text,
      interimText,
      finalText,
    };
  }

  pushInterim(text: string): CaptionUpdate | null {
    const cleaned = normalizeText(text);
    if (!cleaned) return null;

    this.interimText = cleaned;
    const snapshot = this.getSnapshot();

    return {
      type: "interim",
      ...snapshot,
    };
  }

  pushFinal(text: string): CaptionUpdate | null {
    const cleaned = normalizeText(text);
    if (!cleaned) return null;

    const lastFinal = this.finalSegments[this.finalSegments.length - 1];
    if (lastFinal !== cleaned) {
      this.finalSegments.push(cleaned);
    }

    this.interimText = "";
    const snapshot = this.getSnapshot();

    return {
      type: "final",
      ...snapshot,
      newFinalSegment: cleaned,
    };
  }
}
