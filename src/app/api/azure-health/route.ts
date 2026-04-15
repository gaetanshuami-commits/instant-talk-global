import { NextResponse } from "next/server"

export const runtime = "nodejs"

/**
 * GET /api/azure-health
 * Diagnoses the Azure Speech configuration and returns a clear status.
 * Safe to call from the browser — does not expose the key itself.
 */
export async function GET() {
  const key    = process.env.AZURE_SPEECH_KEY    ?? ""
  const region = process.env.AZURE_SPEECH_REGION ?? "francecentral"

  // ── 1. Key presence check ──────────────────────────────────────────────────
  if (!key) {
    return NextResponse.json({
      ok: false,
      stage: "config",
      error: "AZURE_SPEECH_KEY manquant dans les variables d'environnement.",
      fix:   "Ajoutez AZURE_SPEECH_KEY=<votre-clé> dans .env.local",
    })
  }

  // ── 2. Key format check ────────────────────────────────────────────────────
  // Azure Speech subscription keys are 32 hex chars (classic Speech resource)
  // OR 84+ alphanumeric chars (Azure AI multi-service resource).
  // Accept both — only reject obviously short/empty values.
  const isValidFormat = key.length >= 32
  if (!isValidFormat) {
    return NextResponse.json({
      ok: false,
      stage: "format",
      keyLength: key.length,
      error: `Format de clé incorrect (${key.length} chars, minimum 32 attendu).`,
      hint:  "Dans Azure Portal → votre ressource Speech (ou AI multi-service) → Clés et point de terminaison → KEY 1",
    })
  }

  // ── 3. Live connection test ────────────────────────────────────────────────
  const stsUrl = `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`

  try {
    const res = await fetch(stsUrl, {
      method:  "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type":  "application/x-www-form-urlencoded",
        "Content-Length": "0",
      },
    })

    if (res.ok) {
      const token = await res.text()
      return NextResponse.json({
        ok:          true,
        stage:       "live",
        region,
        tokenLength: token.length,
        message:     "Azure Speech configuré correctement ✓",
      })
    }

    // 401 = bad key or wrong region
    if (res.status === 401) {
      return NextResponse.json({
        ok: false,
        stage: "auth",
        httpStatus: 401,
        region,
        error: "Clé Azure Speech invalide ou région incorrecte.",
        fix:   `Vérifiez que la ressource Speech est bien dans la région '${region}' et copiez KEY 1.`,
      })
    }

    // Other error
    const body = await res.text().catch(() => "")
    return NextResponse.json({
      ok: false,
      stage: "azure-error",
      httpStatus: res.status,
      error: `Azure STS a retourné HTTP ${res.status}`,
      detail: body.slice(0, 200),
    })

  } catch (err) {
    return NextResponse.json({
      ok: false,
      stage: "network",
      error: "Impossible de contacter Azure Speech Service.",
      detail: err instanceof Error ? err.message : String(err),
    })
  }
}
