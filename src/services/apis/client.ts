import type { ListQuery, Paginated } from "@/types";

export const API_LATENCY = 320;
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8080";

function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("bizuno-auth-token") ?? "";
}

function buildHeaders(init?: HeadersInit, body?: BodyInit | null): Headers {
  const headers = new Headers(init ?? {});
  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (body instanceof FormData) {
    headers.delete("Content-Type");
    return headers;
  }
  if (!headers.has("Content-Type") && !headers.has("content-type")) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}

export async function requestWithMeta<T>(resolverOrUrl: (() => T) | string, optionsOrLatency?: RequestInit | number): Promise<ApiResponse<T>> {
  if (typeof resolverOrUrl === "function") {
    const data = await new Promise<T>((resolve) => {
      const latency = typeof optionsOrLatency === "number" ? optionsOrLatency : API_LATENCY;
      setTimeout(() => resolve(resolverOrUrl()), latency);
    });
    return { data, message: "", status: 200 };
  }

  const url = resolverOrUrl.startsWith("http") ? resolverOrUrl : `${API_BASE_URL}${resolverOrUrl}`;
  const init = typeof optionsOrLatency === "number" ? {} : (optionsOrLatency ?? {});
  const headers = buildHeaders(init.headers, init.body);

  const response = await fetch(url, {
    ...init,
    headers,
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  const applicationStatus = typeof payload === "object" && payload && "status" in payload
    ? Number((payload as { status?: number }).status)
    : response.status;

  if (!response.ok || (Number.isFinite(applicationStatus) && applicationStatus >= 400)) {
    const message = typeof payload === "object" && payload && "message" in payload
      ? String((payload as { message?: string }).message ?? "Request failed")
      : typeof payload === "string" && payload.trim()
        ? payload
        : "Request failed";
    throw new Error(message);
  }

  if (typeof payload === "object" && payload && "data" in payload) {
    const responsePayload = payload as { data: T; message?: string; status?: number };
    return {
      data: responsePayload.data,
      message: responsePayload.message ?? "",
      status: responsePayload.status ?? response.status,
    };
  }

  return { data: payload as T, message: "", status: response.status };
}

export async function request<T>(resolverOrUrl: (() => T) | string, optionsOrLatency?: RequestInit | number): Promise<T> {
  const response = await requestWithMeta<T>(resolverOrUrl, optionsOrLatency);
  return response.data;
}

export function paginate<T>(rows: T[], query: ListQuery = {}): Paginated<T> {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 10;
  const start = (page - 1) * pageSize;
  return { rows: rows.slice(start, start + pageSize), total: rows.length, page, pageSize };
}

export function matches(haystack: Array<string | undefined>, needle?: string): boolean {
  if (!needle?.trim()) return true;
  const q = needle.trim().toLowerCase();
  return haystack.some((h) => h?.toLowerCase().includes(q));
}

export function sortRows<T>(rows: T[], sortBy?: string, dir: "asc" | "desc" = "asc"): T[] {
  if (!sortBy) return rows;
  const factor = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = (a as Record<string, unknown>)[sortBy];
    const bv = (b as Record<string, unknown>)[sortBy];
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * factor;
    return String(av ?? "").localeCompare(String(bv ?? "")) * factor;
  });
}
