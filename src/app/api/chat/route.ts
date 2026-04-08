import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { normalizeAccess } from "@/lib/server-access";
import { getCapabilities } from "@/lib/planCapabilities";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function isActiveStatus(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const body = await req.json();
    const message        = body?.message;
    const activeLanguage = body?.activeLanguage || "EN";

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    // ── Plan check ────────────────────────────────────────────────────────────
    const cookiePlan  = normalizeAccess(req.cookies.get("instanttalk_access")?.value);
    const customerRef = req.cookies.get("instanttalk_customer_ref")?.value || null;

    let summaryLevel: "basic" | "advanced" | "custom" = "basic";

    if (customerRef) {
      try {
        const subs = await prisma.subscription.findMany({
          where: {
            OR: [
              { stripeCustomerId: customerRef },
              { customerEmail: customerRef },
            ],
          },
          orderBy: { updatedAt: "desc" },
          take: 5,
        });
        const activeSub = subs.find((s) => isActiveStatus(s.status));
        if (activeSub) {
          const caps = getCapabilities(activeSub.plan);
          summaryLevel = caps.summaryLevel;
        }
      } catch {
        // Non-fatal — fallback to basic summary
      }
    } else if (cookiePlan) {
      summaryLevel = getCapabilities(cookiePlan).summaryLevel;
    }

    // ── System prompt varies by plan ─────────────────────────────────────────
    const systemPrompt =
      summaryLevel === "custom"
        ? `You are the enterprise AI assistant inside Instant Talk. Respond in ${activeLanguage}. Provide comprehensive, detailed, and custom-tailored responses with full context and actionable insights.`
        : summaryLevel === "advanced"
        ? `You are the business AI assistant inside Instant Talk. Respond in ${activeLanguage}. Provide structured, detailed responses with key action items, summaries, and team-relevant insights.`
        : `You are the premium AI assistant inside Instant Talk. Respond only in ${activeLanguage}. Be concise, useful, and natural.`;

    const completion = await client.chat.completions.create({
      model: summaryLevel === "basic" ? "gpt-4o-mini" : "gpt-4o",
      temperature: 0.5,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: String(message) },
      ],
    });

    return NextResponse.json({
      reply: completion.choices?.[0]?.message?.content || "",
      summaryLevel,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Chat request failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
