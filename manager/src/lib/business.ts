import { BUSINESS_ID_COOKIE_NAME } from "./auth";

export function readBusinessIdFromCookieStore(cookieStore: {
  get: (name: string) => { value: string } | undefined;
}): string | null {
  const value = cookieStore.get(BUSINESS_ID_COOKIE_NAME)?.value?.trim();
  return value || null;
}

export function appendBusinessIdHeader(
  headers: HeadersInit | undefined,
  businessId: string | null,
): Headers {
  const resolvedHeaders = new Headers(headers);
  if (businessId?.trim()) {
    resolvedHeaders.set("x-business-id", businessId.trim());
  }
  return resolvedHeaders;
}
