export type InstantTalkAccess = "premium" | "business" | "trial" | null;

export const ACCESS_COOKIE = "instanttalk_access";
export const CUSTOMER_REF_COOKIE = "instanttalk_customer_ref";

const ACCESS_VALUES = new Set(["premium", "business", "trial"]);

export function isValidAccess(value: string | null | undefined): value is Exclude<InstantTalkAccess, null> {
  return typeof value === "string" && ACCESS_VALUES.has(value);
}

export function normalizeAccess(value: string | null | undefined): InstantTalkAccess {
  return isValidAccess(value) ? value : null;
}

export function hasServerAccess(value: string | null | undefined) {
  return normalizeAccess(value) !== null;
}
