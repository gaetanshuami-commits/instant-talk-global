-- Migration: plan_features
-- Adds trialEndsAt + enterpriseEnabled to Subscription.
-- Adds RoomSlot table for participant-limit enforcement at token generation.

-- Subscription: new columns (nullable/defaulted → safe on existing rows)
ALTER TABLE "Subscription"
  ADD COLUMN IF NOT EXISTS "trialEndsAt"       TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "enterpriseEnabled" BOOLEAN NOT NULL DEFAULT false;

-- RoomSlot: participant tracking per channel
CREATE TABLE IF NOT EXISTS "RoomSlot" (
    "id"          TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "customerRef" TEXT NOT NULL,
    "uid"         INTEGER NOT NULL,
    "plan"        TEXT NOT NULL,
    "joinedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomSlot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RoomSlot_channelName_customerRef_key"
  ON "RoomSlot"("channelName", "customerRef");

CREATE INDEX IF NOT EXISTS "RoomSlot_channelName_idx" ON "RoomSlot"("channelName");
CREATE INDEX IF NOT EXISTS "RoomSlot_joinedAt_idx"    ON "RoomSlot"("joinedAt");
