import { NextRequest, NextResponse } from "next/server";
import {
  getLobbyParticipant,
  getLobbyState,
  requestLobbyJoin,
  setLobbyParticipantStatus,
} from "@/lib/lobby-store";

type Params = { params: Promise<{ roomId: string }> };

export async function GET(req: NextRequest, ctx: Params) {
  const { roomId } = await ctx.params;
  const participantId = req.nextUrl.searchParams.get("participantId") || "";

  const participants = getLobbyState(roomId);
  const self = participantId ? getLobbyParticipant(roomId, participantId) : null;

  return NextResponse.json({
    participants,
    pending: participants.filter((p) => p.status === "pending"),
    approved: participants.filter((p) => p.status === "approved"),
    denied: participants.filter((p) => p.status === "denied"),
    selfStatus: self?.status ?? null,
  });
}

export async function POST(req: NextRequest, ctx: Params) {
  const { roomId } = await ctx.params;
  const body = await req.json();

  const participantId = String(body.participantId || "").trim();
  const name = String(body.name || "Participant").trim();

  if (!participantId) {
    return NextResponse.json({ error: "missing_participant_id" }, { status: 400 });
  }

  const participant = requestLobbyJoin(roomId, participantId, name);

  return NextResponse.json({
    ok: true,
    participant,
  });
}

export async function PATCH(req: NextRequest, ctx: Params) {
  const { roomId } = await ctx.params;
  const body = await req.json();

  const participantId = String(body.participantId || "").trim();
  const action = String(body.action || "").trim();

  if (!participantId || !action) {
    return NextResponse.json({ error: "missing_payload" }, { status: 400 });
  }

  if (action !== "approve" && action !== "deny" && action !== "reset") {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  const status = action === "approve" ? "approved" : action === "deny" ? "denied" : "pending";
  const participant = setLobbyParticipantStatus(roomId, participantId, status);

  if (!participant) {
    return NextResponse.json({ error: "participant_not_found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    participant,
  });
}
