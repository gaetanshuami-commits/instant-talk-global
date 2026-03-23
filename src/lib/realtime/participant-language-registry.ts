export type ParticipantLanguageMap = Record<string, string>;

export type ParticipantLanguageMessage = {
  type: "participant-language";
  participantId: string;
  targetLang: string;
  at: number;
};

export function encodeParticipantLanguageMessage(
  message: ParticipantLanguageMessage
): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(message));
}

export function decodeParticipantLanguageMessage(
  payload: Uint8Array
): ParticipantLanguageMessage | null {
  try {
    const parsed = JSON.parse(new TextDecoder().decode(payload));

    if (
      parsed?.type !== "participant-language" ||
      typeof parsed?.participantId !== "string" ||
      typeof parsed?.targetLang !== "string"
    ) {
      return null;
    }

    return {
      type: "participant-language",
      participantId: parsed.participantId,
      targetLang: parsed.targetLang,
      at: typeof parsed?.at === "number" ? parsed.at : Date.now()
    };
  } catch {
    return null;
  }
}

export function upsertParticipantLanguage(
  current: ParticipantLanguageMap,
  participantId: string,
  targetLang: string
): ParticipantLanguageMap {
  return {
    ...current,
    [participantId]: targetLang
  };
}

export function removeParticipantLanguage(
  current: ParticipantLanguageMap,
  participantId: string
): ParticipantLanguageMap {
  const next = { ...current };
  delete next[participantId];
  return next;
}
