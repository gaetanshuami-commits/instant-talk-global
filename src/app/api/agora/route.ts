import { NextRequest, NextResponse } from "next/server";
import { RtcTokenBuilder, RtcRole } from "agora-token";

export async function POST(req: NextRequest) {
  try {
    const { channelName, uid } = await req.json();
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return NextResponse.json({ error: "Clés Agora manquantes" }, { status: 500 });
    }

    // Le compilateur exige 7 arguments : appId, cert, channel, uid, role, tokenExpire, privilegeExpire
    const expireTime = 3600;
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      expireTime,
      expireTime
    );

    return NextResponse.json({ token, uid });
  } catch (error) {
    return NextResponse.json({ error: "Erreur Serveur" }, { status: 500 });
  }
}
