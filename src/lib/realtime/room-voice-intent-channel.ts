export type RoomVoiceIntentMessage = {
  type: "room-voice-intent";
  participantId: string;
  text: string;
  targetLang: string;
  voiceName: string;
  at: number;
};

export function encodeRoomVoiceIntentMessage(
  message: RoomVoiceIntentMessage
): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(message));
}

export function decodeRoomVoiceIntentMessage(
  payload: Uint8Array
): RoomVoiceIntentMessage | null {
  try {
    const parsed = JSON.parse(new TextDecoder().decode(payload));

    if (
      parsed?.type !== "room-voice-intent" ||
      typeof parsed?.participantId !== "string" ||
      typeof parsed?.text !== "string" ||
      typeof parsed?.targetLang !== "string" ||
      typeof parsed?.voiceName !== "string"
    ) {
      return null;
    }

    return {
      type: "room-voice-intent",
      participantId: parsed.participantId,
      text: parsed.text,
      targetLang: parsed.targetLang,
      voiceName: parsed.voiceName,
      at: typeof parsed?.at === "number" ? parsed.at : Date.now()
    };
  } catch {
    return null;
  }
}
