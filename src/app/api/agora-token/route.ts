import { NextRequest, NextResponse } from "next/server"
import pkg from "agora-access-token"

const { RtcRole, RtcTokenBuilder } = pkg

export async function GET(req: NextRequest) {
  try {
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID
    const appCertificate = process.env.AGORA_APP_CERTIFICATE

    if (!appId || !appCertificate) {
      return NextResponse.json(
        { error: "Variables Agora manquantes" },
        { status: 500 }
      )
    }

    const roomId = req.nextUrl.searchParams.get("roomId")
    if (!roomId) {
      return NextResponse.json(
        { error: "roomId manquant" },
        { status: 400 }
      )
    }

    const uid = Math.floor(Math.random() * 1000000)
    const expirationSeconds = 3600
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const privilegeExpiredTs = currentTimestamp + expirationSeconds

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      roomId,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    )

    return NextResponse.json({
      token,
      uid,
      channel: roomId,
      expiresIn: expirationSeconds
    })
  } catch (error) {
    console.error("agora-token route error:", error)
    return NextResponse.json(
      { error: "Impossible de générer le token Agora" },
      { status: 500 }
    )
  }
}
