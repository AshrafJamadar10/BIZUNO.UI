export type DemoRole = "PlatformAdmin" | "Owner" | "Manager" | "Salesperson" | "Accountant";

const ROLE_KEY = "bizuno-demo-role";
const TOKEN_KEY = "bizuno-auth-token";
const USER_KEY = "bizuno-auth-user";

export function getStoredRole(): DemoRole | null {
  if (typeof window === "undefined") return null;
  const role = window.localStorage.getItem(ROLE_KEY);
  return role === "PlatformAdmin" || role === "Owner" || role === "Manager" || role === "Salesperson" || role === "Accountant"
    ? role
    : null;
}

export function getStoredToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(TOKEN_KEY) ?? "";
}

export function getStoredUser(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  const rawUser = window.localStorage.getItem(USER_KEY);
  if (!rawUser) return null;
  try {
    return JSON.parse(rawUser) as Record<string, unknown>;
  } catch {
    return null;
  }

}

export function getStoredBusinessCode(): string {
  const user = getStoredUser();
  const userCode = user?.businessCode;
  if (typeof userCode === "string" && userCode) return userCode;
  const token = getStoredToken();
  try {
    const payload = token.split(".")[1];
    if (!payload) return "";
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as { businessCode?: unknown };
    return typeof decoded.businessCode === "string" ? decoded.businessCode : "";
  } catch {
    return "";
  }
}

export function signIn(role: DemoRole, token?: string, user?: Record<string, unknown>): void {
  window.localStorage.setItem(ROLE_KEY, role);
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function signOut(): void {
  window.localStorage.removeItem(ROLE_KEY);
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function landingPath(role: DemoRole): "/" | "/inventory" | "/sales" | "/reports" | "/platform" {
  if (role === "PlatformAdmin") return "/platform";
  if (role === "Salesperson") return "/sales";
  if (role === "Accountant") return "/reports";
  if (role === "Manager") return "/inventory";
  return "/";
}
