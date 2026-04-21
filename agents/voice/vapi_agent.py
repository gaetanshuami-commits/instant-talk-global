"""
Instant Talk — Vapi Voice Agent Stub

STATUS: Not activated. Kept as a stub for future use.

DECISION (2026-04-21):
  Instant Talk already uses Azure STT + Gemini translation + ElevenLabs TTS
  for real-time meeting voice. Vapi adds value specifically for:
    - Outbound voice call automation (sales, onboarding)
    - Voice bot assistants in meeting waiting rooms
    - AI receptionist flows

  These are Phase 2 product features. The current audio pipeline (Agora RTC +
  Azure Speech + ElevenLabs streaming) handles all live meeting use cases.

TO ACTIVATE:
  1. Set VAPI_API_KEY in .env.local
  2. Implement create_meeting_assistant() below
  3. Connect to /api/meetings/vapi webhook endpoint
"""

import os

VAPI_API_KEY = os.getenv("VAPI_API_KEY")


def is_configured() -> bool:
    return bool(VAPI_API_KEY)


def create_meeting_assistant(meeting_id: str, language: str = "en") -> dict | None:
    """
    Placeholder: create a Vapi voice assistant for a meeting waiting room.
    Returns None until Vapi is activated.
    """
    if not is_configured():
        return None
    # TODO: Implement when Vapi is activated
    # from vapi import Vapi
    # client = Vapi(token=VAPI_API_KEY)
    # return client.assistants.create(...)
    return None
