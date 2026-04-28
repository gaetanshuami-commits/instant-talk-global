export const runtime = "nodejs"

import { NextResponse } from "next/server"

export async function GET() {

  const key = process.env.AZURE_SPEECH_KEY
  const region = process.env.AZURE_SPEECH_REGION

  if (!key || !region) {
    console.error("Azure env missing")
    return NextResponse.json(
      { error: "Azure Speech env missing" },
      { status: 500 }
    )
  }

  try {

    const response = await fetch(
      `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": key
        }
      }
    )

    if (!response.ok) {
      console.error("Azure token fetch failed", response.status)
      return NextResponse.json(
        { error: "Azure token fetch failed" },
        { status: 500 }
      )
    }

    const token = await response.text()

    return NextResponse.json({
      token,
      region
    })

  } catch (err) {

    console.error("Azure token error:", err)

    return NextResponse.json(
      { error: "Azure token exception" },
      { status: 500 }
    )
  }

}
