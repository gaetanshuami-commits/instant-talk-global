export type InstantTalkAccess = "premium" | "business" | "trial" | null;

const ACCESS_COOKIE_NAME = "instanttalk_access";
const ACCESS_VALUES = new Set(["premium", "business", "trial"]);

export function isValidAccess(value: string | null | undefined): value is Exclude<InstantTalkAccess, null> {
  return typeof value === "string" && ACCESS_VALUES.has(value);
}

export function normalizeAccess(value: string | null | undefined): InstantTalkAccess {
  return isValidAccess(value) ? value : null;
}

export function getClientAccess(): InstantTalkAccess {
  if (typeof window === "undefined") return null;
  return normalizeAccess(localStorage.getItem(ACCESS_COOKIE_NAME));
}

export function setClientAccess(plan: InstantTalkAccess) {
  if (typeof window === "undefined") return;

  if (!plan) {
    localStorage.removeItem(ACCESS_COOKIE_NAME);
    document.cookie = `${ACCESS_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    return;
  }

  localStorage.setItem(ACCESS_COOKIE_NAME, plan);
  document.cookie = `${ACCESS_COOKIE_NAME}=${plan}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

export function hasClientAccess() {
  return getClientAccess() !== null;
}

export const ACCESS_COOKIE = ACCESS_COOKIE_NAME;
