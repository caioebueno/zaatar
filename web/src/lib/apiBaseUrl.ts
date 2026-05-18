const DEFAULT_API_BASE_URL = "http://127.0.0.1:4000";

function normalizeBaseUrl(value: string | undefined, fallback: string): string {
  const candidate = value?.trim() || fallback;

  try {
    const parsed = new URL(candidate);
    return parsed.href.replace(/\/+$/, "").replace(/\/api$/, "");
  } catch {
    return fallback;
  }
}

export function getApiBaseUrl(): string {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL, DEFAULT_API_BASE_URL);
}

