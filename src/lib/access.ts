export type InstantTalkAccess = "premium" | "business" | "trial" | null;

export function getClientAccess(): InstantTalkAccess {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem("instanttalk_access");
  if (value === "premium" || value === "business" || value === "trial") return value;
  return null;
}

export function setClientAccess(plan: InstantTalkAccess) {
  if (typeof window === "undefined") return;
  if (!plan) {
    localStorage.removeItem("instanttalk_access");
    return;
  }
  localStorage.setItem("instanttalk_access", plan);
}

export function hasClientAccess() {
  return getClientAccess() !== null;
}