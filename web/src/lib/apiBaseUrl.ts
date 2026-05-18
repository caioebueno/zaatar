function normalizeBaseUrl(value: string): string {
  try {
    const parsed = new URL(value);
    return parsed.href.replace(/\/+$/, "").replace(/\/api$/, "");
  } catch {
    throw new Error(`NEXT_PUBLIC_API_BASE_URL is set but is not a valid URL: "${value}"`);
  }
}

export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!raw) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  }
  return normalizeBaseUrl(raw);
}
