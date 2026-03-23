export type RoomTranscriptMessage = {
  type: "room-transcript";
  participantId: string;
  text: string;
  sourceLang: string;
  at: number;
};

export function encodeRoomTranscriptMessage(
  message: RoomTranscriptMessage
): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(message));
}

export function decodeRoomTranscriptMessage(
  payload: Uint8Array
): RoomTranscriptMessage | null {
  try {
    const parsed = JSON.parse(new TextDecoder().decode(payload));

    if (
      parsed?.type !== "room-transcript" ||
      typeof parsed?.participantId !== "string" ||
      typeof parsed?.text !== "string" ||
      typeof parsed?.sourceLang !== "string"
    ) {
      return null;
    }

    return {
      type: "room-transcript",
      participantId: parsed.participantId,
      text: parsed.text,
      sourceLang: parsed.sourceLang,
      at: typeof parsed?.at === "number" ? parsed.at : Date.now()
    };
  } catch {
    return null;
  }
}
