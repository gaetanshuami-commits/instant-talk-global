/**
 * Instant Talk Mobile — API client
 * All requests go to the same Next.js backend used by the web app.
 */

import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const BASE_URL: string =
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  "https://instant-talk.com";

const CUSTOMER_REF_KEY = "itg_customer_ref";

export async function getCustomerRef(): Promise<string> {
  let ref = await SecureStore.getItemAsync(CUSTOMER_REF_KEY);
  if (!ref) {
    ref = `mob_${Math.random().toString(36).substring(2, 26)}`;
    await SecureStore.setItemAsync(CUSTOMER_REF_KEY, ref);
  }
  return ref;
}

async function headers(): Promise<Record<string, string>> {
  const ref = await getCustomerRef();
  return {
    "Content-Type": "application/json",
    "x-customer-ref": ref,
  };
}

// ── Meetings ──────────────────────────────────────────────────────────────────

export async function fetchMeetings() {
  const res = await fetch(`${BASE_URL}/api/meetings`, { headers: await headers() });
  if (!res.ok) throw new Error(`fetchMeetings: ${res.status}`);
  return res.json();
}

export async function createMeeting(payload: {
  title: string;
  startsAt: string;
  endsAt: string;
  timezone?: string;
  description?: string;
  inviteeEmails?: string[];
}) {
  const res = await fetch(`${BASE_URL}/api/meetings`, {
    method: "POST",
    headers: await headers(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`createMeeting: ${res.status}`);
  return res.json();
}

export async function getMeeting(id: string) {
  const res = await fetch(`${BASE_URL}/api/meetings/${id}`, { headers: await headers() });
  if (!res.ok) throw new Error(`getMeeting: ${res.status}`);
  return res.json();
}

// ── Agora token ───────────────────────────────────────────────────────────────

export async function fetchAgoraToken(roomId: string, uid: number) {
  const res = await fetch(
    `${BASE_URL}/api/agora-token?roomId=${encodeURIComponent(roomId)}&uid=${uid}`,
    { headers: await headers() }
  );
  if (!res.ok) throw new Error(`fetchAgoraToken: ${res.status}`);
  return res.json() as Promise<{ token: string; appId: string }>;
}

// ── Translation ───────────────────────────────────────────────────────────────

export async function translateText(text: string, from: string, to: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/translate`, {
    method: "POST",
    headers: await headers(),
    body: JSON.stringify({ text, from, to }),
  });
  if (!res.ok) return text;
  const data = await res.json();
  return data.translated ?? text;
}

// ── TTS ───────────────────────────────────────────────────────────────────────

export async function fetchTTSAudioUrl(text: string, lang: string, voiceId?: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/elevenlabs-tts`, {
    method: "POST",
    headers: await headers(),
    body: JSON.stringify({ text, lang, voiceId }),
  });
  if (!res.ok) throw new Error(`fetchTTSAudio: ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// ── Voice clone ───────────────────────────────────────────────────────────────

export async function cloneVoice(audioUri: string): Promise<string | null> {
  const form = new FormData();
  form.append("audio", {
    uri: audioUri,
    name: "voice_sample.m4a",
    type: "audio/m4a",
  } as unknown as Blob);

  const hdrs = await headers();
  const res = await fetch(`${BASE_URL}/api/clone-voice`, {
    method: "POST",
    headers: { "x-customer-ref": hdrs["x-customer-ref"] }, // no Content-Type — multipart
    body: form,
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.voiceId ?? null;
}

// ── Contacts ──────────────────────────────────────────────────────────────────

export async function fetchContacts() {
  const res = await fetch(`${BASE_URL}/api/contacts`, { headers: await headers() });
  if (!res.ok) return { contacts: [] };
  return res.json();
}

// ── Azure Speech token ────────────────────────────────────────────────────────

export async function fetchAzureSpeechToken(): Promise<{ token: string; region: string }> {
  const res = await fetch(`${BASE_URL}/api/azure-speech-token`, { headers: await headers() });
  if (!res.ok) throw new Error("fetchAzureSpeechToken failed");
  return res.json();
}
