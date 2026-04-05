import { NextResponse } from "next/server"

export async function GET() {
  const speechKey = process.env.AZURE_SPEECH_KEY
  const speechRegion = "francecentral"

  if (!speechKey) {
    return NextResponse.json(
      { error: "Missing AZURE_SPEECH_KEY" },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(
      `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": speechKey,
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": "0",
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()

      return NextResponse.json(
        {
          error: "Failed to fetch Azure speech token",
          details: errorText,
        },
        { status: 500 }
      )
    }

    const token = await response.text()

    return NextResponse.json({
      token,
      region: speechRegion,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Azure speech token request crashed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}