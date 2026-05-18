export const UBER_EATS_OAUTH_STATE_COOKIE_NAME = "manager_uber_eats_oauth_state";

const DEFAULT_MANAGER_BASE_URL = "http://localhost:3000";

export function normalizeBaseUrl(value: string | undefined, fallback: string): string {
  const candidate = value?.trim() || fallback;
  try {
    const parsed = new URL(candidate);
    return parsed.href.replace(/\/+$/, "").replace(/\/api$/, "");
  } catch {
    return fallback;
  }
}

export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!raw) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  }
  try {
    const parsed = new URL(raw);
    return parsed.href.replace(/\/+$/, "").replace(/\/api$/, "");
  } catch {
    throw new Error(`NEXT_PUBLIC_API_BASE_URL is not a valid URL: "${raw}"`);
  }
}

export function getUberEatsCallbackUrl(options?: { origin?: string }): string {
  const configured =
    process.env.UBER_EATS_OAUTH_CALLBACK_URL?.trim() ||
    process.env.NEXT_PUBLIC_UBER_EATS_OAUTH_CALLBACK_URL?.trim();

  if (configured) {
    return configured;
  }

  if (options?.origin?.trim()) {
    const origin = normalizeBaseUrl(options.origin, DEFAULT_MANAGER_BASE_URL);
    return `${origin}/sales-channels/uber-eats/callback`;
  }

  const managerBaseUrl = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_MANAGER_BASE_URL,
    DEFAULT_MANAGER_BASE_URL,
  );
  return `${managerBaseUrl}/sales-channels/uber-eats/callback`;
}
