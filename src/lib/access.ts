export type InstantTalkAccess = "premium" | "business" | "trial" | null;

const ACCESS_COOKIE_NAME = "instanttalk_access";
const CUSTOMER_REF_KEY = "instanttalk_customer_ref";
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

export function getCustomerRef() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CUSTOMER_REF_KEY);
}

export function setCustomerRef(value: string | null) {
  if (typeof window === "undefined") return;

  if (!value) {
    localStorage.removeItem(CUSTOMER_REF_KEY);
    document.cookie = `${CUSTOMER_REF_KEY}=; path=/; max-age=0; SameSite=Lax`;
    return;
  }

  localStorage.setItem(CUSTOMER_REF_KEY, value);
  document.cookie = `${CUSTOMER_REF_KEY}=${value}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

export const ACCESS_COOKIE = ACCESS_COOKIE_NAME;
export const CUSTOMER_REF_COOKIE = CUSTOMER_REF_KEY;
