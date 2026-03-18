export function hasClientAccess() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("instanttalk_access") === "premium" || localStorage.getItem("instanttalk_access") === "business";
}

export function setClientAccess(plan: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("instanttalk_access", plan);
}