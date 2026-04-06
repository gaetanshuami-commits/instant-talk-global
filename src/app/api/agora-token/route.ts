import { NextRequest, NextResponse } from "next/server"
import { RtcRole, RtcTokenBuilder } from "agora-access-token"

export async function GET(req: NextRequest) {
  const channel = req.nextUrl.searchParams.get("channel")

  if (!channel) {
    return NextResponse.json({ error: "Missing channel parameter" }, { status: 400 })
  }

  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID
  const appCertificate = process.env.AGORA_APP_CERTIFICATE

  if (!appId || !appCertificate) {
    return NextResponse.json({ error: "Missing Agora credentials" }, { status: 500 })
  }

  try {
    const uid = 0
    const expire = Math.floor(Date.now() / 1000) + 3600

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channel,
      uid,
      RtcRole.PUBLISHER,
      expire
    )

    return NextResponse.json({
      appId,
      channel,
      token,
      uid,
      expire
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to generate Agora token",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
