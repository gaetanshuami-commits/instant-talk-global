/**
 * Usage tracking for future Stripe metered billing.
 * Tracks: translation_minutes, voice_clone_minutes, participants_peak, meeting_duration_seconds.
 * Stored as JSON in a usage_events table (created lazily via ensureSchema).
 * Does NOT affect current subscription billing — reads are safe anytime.
 */

import { prisma } from "@/lib/prisma"

export type UsageEventType =
  | "translation_request"
  | "tts_request"
  | "voice_clone"
  | "meeting_start"
  | "meeting_end"
  | "participant_join"

export interface UsageEvent {
  type:         UsageEventType
  customerRef:  string
  roomId?:      string
  durationMs?:  number   // for tts_request: audio duration; for meeting_end: meeting length
  langFrom?:    string
  langTo?:      string
  charCount?:   number   // translation character count
  participantCount?: number
}

let _schemaReady = false

async function ensureUsageSchema() {
  if (_schemaReady) return
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS usage_events (
        id            TEXT    PRIMARY KEY DEFAULT gen_random_uuid()::text,
        type          TEXT    NOT NULL,
        customer_ref  TEXT    NOT NULL,
        room_id       TEXT,
        duration_ms   INTEGER,
        lang_from     TEXT,
        lang_to       TEXT,
        char_count    INTEGER,
        participant_count INTEGER,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS usage_events_customer_ref_idx ON usage_events(customer_ref);
      CREATE INDEX IF NOT EXISTS usage_events_type_idx        ON usage_events(type);
      CREATE INDEX IF NOT EXISTS usage_events_created_at_idx  ON usage_events(created_at);
    `)
    _schemaReady = true
  } catch {
    // Non-blocking — if schema creation fails, tracking silently skips
  }
}

export async function trackUsage(event: UsageEvent): Promise<void> {
  try {
    await ensureUsageSchema()
    await prisma.$executeRawUnsafe(
      `INSERT INTO usage_events
         (type, customer_ref, room_id, duration_ms, lang_from, lang_to, char_count, participant_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      event.type,
      event.customerRef,
      event.roomId ?? null,
      event.durationMs ?? null,
      event.langFrom ?? null,
      event.langTo ?? null,
      event.charCount ?? null,
      event.participantCount ?? null,
    )
  } catch {
    // Tracking is best-effort — never throw
  }
}

/** Aggregate usage stats for a customer over a time window. */
export async function getUsageSummary(customerRef: string, since: Date) {
  try {
    await ensureUsageSchema()
    const rows = await prisma.$queryRawUnsafe<Array<{ type: string; count: bigint; total_ms: bigint | null; total_chars: bigint | null }>>(
      `SELECT type,
              COUNT(*)         AS count,
              SUM(duration_ms) AS total_ms,
              SUM(char_count)  AS total_chars
       FROM  usage_events
       WHERE customer_ref = $1
         AND created_at  >= $2
       GROUP BY type`,
      customerRef,
      since,
    )

    const summary = {
      translation_requests: 0,
      translation_chars:    0,
      tts_requests:         0,
      tts_duration_ms:      0,
      voice_clones:         0,
      meetings_started:     0,
      total_meeting_ms:     0,
      peak_participants:    0,
    }

    for (const row of rows) {
      const count = Number(row.count)
      const totalMs = Number(row.total_ms ?? 0)
      const totalChars = Number(row.total_chars ?? 0)

      switch (row.type) {
        case "translation_request": summary.translation_requests = count; summary.translation_chars = totalChars; break
        case "tts_request":         summary.tts_requests = count; summary.tts_duration_ms = totalMs; break
        case "voice_clone":         summary.voice_clones = count; break
        case "meeting_start":       summary.meetings_started = count; break
        case "meeting_end":         summary.total_meeting_ms = totalMs; break
      }
    }

    // Peak participants — max participant_count for participant_join events
    const peak = await prisma.$queryRawUnsafe<Array<{ peak: number | null }>>(
      `SELECT MAX(participant_count) AS peak
       FROM  usage_events
       WHERE customer_ref = $1
         AND type         = 'participant_join'
         AND created_at  >= $2`,
      customerRef,
      since,
    )
    summary.peak_participants = Number(peak[0]?.peak ?? 0)

    return summary
  } catch {
    return null
  }
}
