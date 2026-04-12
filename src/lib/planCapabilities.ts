// planCapabilities.ts
// Single source of truth for plan limits enforced across backend + room.

export type PlanTier = "premium" | "business" | "enterprise" | "trial"

// ─── Language sets per plan ────────────────────────────────────────────────────
// Premium / Trial: 10 most-requested languages
export const PREMIUM_LANGS: string[] = [
  "fr", "en", "es", "de", "it", "ru", "pt", "nl", "ar", "ja",
]

// Business: all 23 UI languages + extra locales in SOURCE_LOCALE
export const BUSINESS_LANGS: string[] = [
  ...PREMIUM_LANGS,
  "ko", "hi", "tr", "zh", "sw", "ro", "el", "sv", "hu", "cs", "th", "vi",
  "pl", "bg", "da", "fi", "sk", "no",
]

// Enterprise: all 26 (null = no restriction — voice engine uses full SOURCE_LOCALE)

// ─── Capabilities ─────────────────────────────────────────────────────────────

export type PlanCapabilities = {
  /** Max simultaneous participants in a room. 999 = unlimited. */
  maxParticipants: number
  /** Max selectable target languages. 999 = unlimited. */
  maxLanguages: number
  /** null = all languages allowed */
  allowedLangs: string[] | null
  summaryLevel: "basic" | "advanced" | "custom"
  prioritySupport: boolean
  enterpriseEnabled: boolean
}

export const PLAN_CAPABILITIES: Record<PlanTier, PlanCapabilities> = {
  trial: {
    maxParticipants: 5,
    maxLanguages: 10,
    allowedLangs: PREMIUM_LANGS,
    summaryLevel: "basic",
    prioritySupport: false,
    enterpriseEnabled: false,
  },
  premium: {
    maxParticipants: 5,
    maxLanguages: 10,
    allowedLangs: PREMIUM_LANGS,
    summaryLevel: "basic",
    prioritySupport: false,
    enterpriseEnabled: false,
  },
  business: {
    maxParticipants: 50,
    maxLanguages: 20,
    allowedLangs: BUSINESS_LANGS,
    summaryLevel: "advanced",
    prioritySupport: true,
    enterpriseEnabled: false,
  },
  enterprise: {
    maxParticipants: 999,
    maxLanguages: 999,
    allowedLangs: null,
    summaryLevel: "custom",
    prioritySupport: true,
    enterpriseEnabled: true,
  },
}

export function getCapabilities(plan: string | null | undefined): PlanCapabilities {
  const tier = plan as PlanTier
  return PLAN_CAPABILITIES[tier] ?? PLAN_CAPABILITIES.premium
}

/** Returns true if the given language code is allowed for the plan. */
export function isLangAllowed(lang: string, caps: PlanCapabilities): boolean {
  return caps.allowedLangs === null || caps.allowedLangs.includes(lang)
}
