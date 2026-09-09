/**
 * Fake transport layer.
 *
 * Every service call goes through `request()`, which mimics network latency.
 * Replacing mocks with a real API means swapping the body of `request()` for
 * a fetch/axios call — module code and hooks stay untouched.
 */

import type { ListQuery, Paginated } from "@/types";

export const API_LATENCY = 320;

export function request<T>(resolver: () => T, latency = API_LATENCY): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(resolver()), latency);
  });
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
