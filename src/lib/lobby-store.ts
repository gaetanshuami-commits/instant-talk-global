type LobbyStatus = "pending" | "approved" | "denied";

export type LobbyParticipant = {
  id: string;
  name: string;
  status: LobbyStatus;
  joinedAt: number;
};

type LobbyRoom = {
  roomId: string;
  participants: Map<string, LobbyParticipant>;
};

type LobbyStore = Map<string, LobbyRoom>;

declare global {
  var __instantTalkLobbyStore: LobbyStore | undefined;
}

function getStore(): LobbyStore {
  if (!globalThis.__instantTalkLobbyStore) {
    globalThis.__instantTalkLobbyStore = new Map();
  }
  return globalThis.__instantTalkLobbyStore;
}

function getOrCreateRoom(roomId: string): LobbyRoom {
  const store = getStore();
  const existing = store.get(roomId);
  if (existing) return existing;

  const room: LobbyRoom = {
    roomId,
    participants: new Map(),
  };

  store.set(roomId, room);
  return room;
}

export function requestLobbyJoin(roomId: string, participantId: string, name: string) {
  const room = getOrCreateRoom(roomId);
  const existing = room.participants.get(participantId);

  if (existing) {
    return existing;
  }

  const participant: LobbyParticipant = {
    id: participantId,
    name: name || "Participant",
    status: "pending",
    joinedAt: Date.now(),
  };

  room.participants.set(participantId, participant);
  return participant;
}

export function getLobbyState(roomId: string) {
  const room = getOrCreateRoom(roomId);
  return Array.from(room.participants.values()).sort((a, b) => a.joinedAt - b.joinedAt);
}

export function setLobbyParticipantStatus(
  roomId: string,
  participantId: string,
  status: LobbyStatus
) {
  const room = getOrCreateRoom(roomId);
  const participant = room.participants.get(participantId);

  if (!participant) return null;

  const updated = { ...participant, status };
  room.participants.set(participantId, updated);
  return updated;
}

export function getLobbyParticipant(roomId: string, participantId: string) {
  const room = getOrCreateRoom(roomId);
  return room.participants.get(participantId) || null;
}

export function isLobbyParticipantApproved(roomId: string, participantId: string) {
  const participant = getLobbyParticipant(roomId, participantId);
  return participant?.status === "approved";
}
