export type DemoRole = "PlatformAdmin" | "Owner" | "Manager" | "Salesperson" | "Accountant";

const ROLE_KEY = "bizuno-demo-role";

export function getStoredRole(): DemoRole | null {
  if (typeof window === "undefined") return null;
  const role = window.localStorage.getItem(ROLE_KEY);
  return role === "PlatformAdmin" || role === "Owner" || role === "Manager" || role === "Salesperson" || role === "Accountant"
    ? role
    : null;
}

export function signIn(role: DemoRole): void {
  window.localStorage.setItem(ROLE_KEY, role);
}

export function signOut(): void {
  window.localStorage.removeItem(ROLE_KEY);
}

export function landingPath(role: DemoRole): "/" | "/inventory" | "/sales" | "/reports" | "/platform" {
  if (role === "PlatformAdmin") return "/platform";
  if (role === "Salesperson") return "/sales";
  if (role === "Accountant") return "/reports";
  if (role === "Manager") return "/inventory";
  return "/";
}
