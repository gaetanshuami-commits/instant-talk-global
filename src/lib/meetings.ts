import crypto from "node:crypto";

export function createMeetingRoomId() {
  return `meet-${crypto.randomUUID().slice(0, 8)}-${crypto.randomUUID().slice(0, 4)}`;
}

export function createInviteToken() {
  return crypto.randomBytes(24).toString("hex");
}

export function buildMeetingLink(origin: string, roomId: string, inviteToken: string) {
  return `${origin}/room/${roomId}?invite=${inviteToken}`;
}

export function meetingStatusFromDates(startsAt: Date, endsAt: Date) {
  const now = Date.now();

  if (now < startsAt.getTime()) return "SCHEDULED";
  if (now >= startsAt.getTime() && now <= endsAt.getTime()) return "LIVE";
  return "ENDED";
}
