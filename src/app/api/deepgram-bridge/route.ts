import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const wantsWebSocket = req.headers.get("upgrade") === "websocket";

  return NextResponse.json(
    {
      error: "deepgram_bridge_not_supported_in_next_app_router",
      websocketRequested: wantsWebSocket,
      message:
        "Cette route WebSocket n'est pas supportée dans cette implémentation App Router. Utiliser la pipeline LiveKit + Deepgram déjà intégrée côté client.",
    },
    { status: 501 }
  );
}