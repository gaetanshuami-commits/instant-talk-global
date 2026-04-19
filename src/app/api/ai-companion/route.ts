import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

export const runtime = "nodejs"

let openai: OpenAI | null = null
function getOpenAI() {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return openai
}

// Map language codes to full names for the prompt
const LANG_NAMES: Record<string, string> = {
  fr: "français", en: "English", de: "Deutsch", es: "español",
  it: "italiano", pt: "português", nl: "Nederlands", ar: "العربية",
  ja: "日本語", ko: "한국어", zh: "中文", hi: "हिन्दी",
  ru: "русский", tr: "Türkçe", pl: "polski", sv: "svenska",
  ro: "română", el: "ελληνικά", hu: "magyar", cs: "čeština",
}

function buildSummaryPrompt(lang: string) {
  const langName = LANG_NAMES[lang] ?? lang
  return `You are a multilingual enterprise meeting assistant.
From a partial transcript, generate a structured meeting summary in ${langName} covering:
- Main topics discussed
- Decisions made
- Key takeaways
Be concise (max 200 words), structured, professional. Write ONLY in ${langName}.`
}

function buildActionsPrompt(lang: string) {
  const langName = LANG_NAMES[lang] ?? lang
  return `You are a multilingual enterprise meeting assistant.
From a meeting transcript, extract actionable tasks written in ${langName}.
STRICT response format — return ONLY a JSON object:
{"actions": [{"task": "...", "assignee": "...", "priority": "high|medium|low"}, ...]}
All text values MUST be in ${langName}.`
}

export async function POST(req: NextRequest) {
  const { transcript, type, outputLang = "fr" } = await req.json() as {
    transcript: string[]
    type: "summary" | "actions"
    outputLang?: string
  }

  if (!transcript || transcript.length === 0) {
    return NextResponse.json({ error: "Empty transcript" }, { status: 400 })
  }

  const content = transcript.slice(-80).join("\n")

  try {
    if (type === "summary") {
      const res = await getOpenAI().chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: buildSummaryPrompt(outputLang) },
          { role: "user",   content: `Transcript:\n${content}` },
        ],
        max_tokens: 450,
        temperature: 0.3,
      })
      return NextResponse.json({ result: res.choices[0].message.content })
    }

    if (type === "actions") {
      const res = await getOpenAI().chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: buildActionsPrompt(outputLang) },
          { role: "user",   content: `Transcript:\n${content}` },
        ],
        max_tokens: 700,
        temperature: 0.2,
        response_format: { type: "json_object" },
      })
      const parsed = JSON.parse(res.choices[0].message.content ?? "{}")
      return NextResponse.json({ result: parsed.actions ?? [] })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (err) {
    console.error("[AI Companion]", err)
    return NextResponse.json({ error: "AI service error" }, { status: 500 })
  }
}
