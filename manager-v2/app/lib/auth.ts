/**
 * Manager session storage. The API accepts the token as either an
 * `Authorization: Bearer <token>` header or a `manager_access_token` cookie,
 * and resolves business context from `manager_business_id`.
 *
 * We persist to both localStorage (for Authorization headers on cross-origin
 * API calls) and cookies (so the server-side app-shell guard can read them).
 */

import type { OwnerBusiness, OwnerProfile, VerifyOtpResult } from "./api";

export const TOKEN_COOKIE = "manager_access_token";
export const BUSINESS_COOKIE = "manager_business_id";

const TOKEN_KEY = TOKEN_COOKIE;
const BUSINESS_KEY = BUSINESS_COOKIE;
const OWNER_KEY = "manager_owner";
const BUSINESSES_KEY = "manager_businesses";

const NINETY_DAYS_SECONDS = 60 * 60 * 24 * 90;

function setCookie(name: string, value: string, maxAgeSeconds = NINETY_DAYS_SECONDS) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}

export function saveManagerSession(result: VerifyOtpResult): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, result.accessToken);
  localStorage.setItem(OWNER_KEY, JSON.stringify(result.owner));
  setManagerBusinesses(result.businesses ?? []);
  setCookie(TOKEN_KEY, result.accessToken);
  if (result.selectedBusinessId) {
    setManagerBusinessId(result.selectedBusinessId);
  }
}

export function setManagerBusinesses(businesses: OwnerBusiness[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BUSINESSES_KEY, JSON.stringify(businesses));
}

export function setManagerBusinessId(businessId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BUSINESS_KEY, businessId);
  setCookie(BUSINESS_KEY, businessId);
}

export function getManagerToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getManagerBusinessId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(BUSINESS_KEY);
}

export function getManagerOwner(): OwnerProfile | null {
  return readJson<OwnerProfile>(OWNER_KEY);
}

export function getManagerBusinesses(): OwnerBusiness[] {
  return readJson<OwnerBusiness[]>(BUSINESSES_KEY) ?? [];
}

export function clearManagerSession(): void {
  if (typeof window === "undefined") return;
  [TOKEN_KEY, OWNER_KEY, BUSINESSES_KEY, BUSINESS_KEY].forEach((k) => localStorage.removeItem(k));
  deleteCookie(TOKEN_KEY);
  deleteCookie(BUSINESS_KEY);
}

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
