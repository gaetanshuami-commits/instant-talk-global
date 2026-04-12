-- Baseline migration: documents tables already existing in the database.
-- Created with `prisma migrate resolve --applied` — does NOT run against DB.
-- All statements use IF NOT EXISTS to be safe if re-applied accidentally.

-- ── Enums ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'SENT', 'ACCEPTED', 'DECLINED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReminderChannel" AS ENUM ('EMAIL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "WebinarStatus" AS ENUM ('UPCOMING', 'LIVE', 'ENDED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Meeting ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Meeting" (
    "id"          TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "description" TEXT,
    "hostEmail"   TEXT NOT NULL,
    "roomId"      TEXT NOT NULL,
    "inviteToken" TEXT NOT NULL,
    "startsAt"    TIMESTAMP(3) NOT NULL,
    "endsAt"      TIMESTAMP(3) NOT NULL,
    "timezone"    TEXT NOT NULL DEFAULT 'Europe/Paris',
    "status"      "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Meeting_roomId_key"      ON "Meeting"("roomId");
CREATE UNIQUE INDEX IF NOT EXISTS "Meeting_inviteToken_key" ON "Meeting"("inviteToken");
CREATE INDEX        IF NOT EXISTS "Meeting_startsAt_idx"    ON "Meeting"("startsAt");
CREATE INDEX        IF NOT EXISTS "Meeting_endsAt_idx"      ON "Meeting"("endsAt");
CREATE INDEX        IF NOT EXISTS "Meeting_status_idx"      ON "Meeting"("status");

-- ── MeetingInvite ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "MeetingInvite" (
    "id"        TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "email"     TEXT NOT NULL,
    "name"      TEXT,
    "status"    "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MeetingInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MeetingInvite_meetingId_email_key" ON "MeetingInvite"("meetingId", "email");
CREATE INDEX        IF NOT EXISTS "MeetingInvite_email_idx"            ON "MeetingInvite"("email");

DO $$ BEGIN
  ALTER TABLE "MeetingInvite"
    ADD CONSTRAINT "MeetingInvite_meetingId_fkey"
    FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── MeetingReminder ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "MeetingReminder" (
    "id"        TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "remindAt"  TIMESTAMP(3) NOT NULL,
    "sentAt"    TIMESTAMP(3),
    "channel"   "ReminderChannel" NOT NULL DEFAULT 'EMAIL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MeetingReminder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MeetingReminder_remindAt_idx" ON "MeetingReminder"("remindAt");
CREATE INDEX IF NOT EXISTS "MeetingReminder_sentAt_idx"   ON "MeetingReminder"("sentAt");

DO $$ BEGIN
  ALTER TABLE "MeetingReminder"
    ADD CONSTRAINT "MeetingReminder_meetingId_fkey"
    FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Contact ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Contact" (
    "id"          TEXT NOT NULL,
    "customerRef" TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "email"       TEXT NOT NULL,
    "company"     TEXT,
    "role"        TEXT,
    "lang"        TEXT,
    "color"       TEXT NOT NULL DEFAULT '#6366f1',
    "starred"     BOOLEAN NOT NULL DEFAULT false,
    "online"      BOOLEAN NOT NULL DEFAULT false,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Contact_customerRef_email_key" ON "Contact"("customerRef", "email");
CREATE INDEX        IF NOT EXISTS "Contact_customerRef_idx"        ON "Contact"("customerRef");

-- ── ChatRoom ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ChatRoom" (
    "id"          TEXT NOT NULL,
    "customerRef" TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "emoji"       TEXT,
    "color"       TEXT NOT NULL DEFAULT '#6366f1',
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ChatRoom_customerRef_idx" ON "ChatRoom"("customerRef");

-- ── ChatMessage ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ChatMessage" (
    "id"        TEXT NOT NULL,
    "roomId"    TEXT NOT NULL,
    "author"    TEXT NOT NULL,
    "text"      TEXT NOT NULL,
    "lang"      TEXT,
    "mine"      BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ChatMessage_roomId_idx"    ON "ChatMessage"("roomId");
CREATE INDEX IF NOT EXISTS "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");

DO $$ BEGIN
  ALTER TABLE "ChatMessage"
    ADD CONSTRAINT "ChatMessage_roomId_fkey"
    FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Webinar ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Webinar" (
    "id"           TEXT NOT NULL,
    "customerRef"  TEXT NOT NULL,
    "title"        TEXT NOT NULL,
    "topic"        TEXT,
    "host"         TEXT NOT NULL,
    "startsAt"     TIMESTAMP(3) NOT NULL,
    "durationMins" INTEGER NOT NULL DEFAULT 60,
    "maxAttendees" INTEGER NOT NULL DEFAULT 1000,
    "langs"        TEXT[] DEFAULT ARRAY[]::TEXT[],
    "color"        TEXT NOT NULL DEFAULT '#6366f1',
    "status"       "WebinarStatus" NOT NULL DEFAULT 'UPCOMING',
    "roomId"       TEXT NOT NULL DEFAULT '',
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Webinar_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Webinar_customerRef_idx" ON "Webinar"("customerRef");
CREATE INDEX IF NOT EXISTS "Webinar_startsAt_idx"    ON "Webinar"("startsAt");

-- ── UserSettings ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "UserSettings" (
    "id"          TEXT NOT NULL,
    "customerRef" TEXT NOT NULL,
    "data"        JSONB NOT NULL DEFAULT '{}',
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserSettings_customerRef_key" ON "UserSettings"("customerRef");
