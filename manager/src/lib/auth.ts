export const ACCESS_TOKEN_COOKIE_NAME = "manager_access_token";
export const ACCESS_TOKEN_STORAGE_KEY = "manager_access_token";
export const OWNER_STORAGE_KEY = "manager_owner";
export const BUSINESS_ID_COOKIE_NAME = "manager_business_id";
export const BUSINESS_ID_STORAGE_KEY = "manager_business_id";
export const BUSINESSES_STORAGE_KEY = "manager_businesses";
export const ACCESS_TOKEN_TTL_DAYS = 90;

export type OwnerSession = {
  email: string;
  id: string;
  name: string;
};

export type OwnerBusinessSession = {
  id: string;
  name: string;
};

export function saveAuthSession(input: {
  accessToken: string;
  businesses?: OwnerBusinessSession[];
  owner: OwnerSession;
  selectedBusinessId?: string | null;
}) {
  if (typeof window === "undefined") return;

  const maxAgeSeconds = ACCESS_TOKEN_TTL_DAYS * 24 * 60 * 60;
  const encodedToken = encodeURIComponent(input.accessToken);
  const normalizedBusinesses = (input.businesses ?? []).filter(
    (business) =>
      typeof business?.id === "string" &&
      business.id.trim().length > 0 &&
      typeof business?.name === "string" &&
      business.name.trim().length > 0,
  );
  const selectedBusinessId =
    input.selectedBusinessId?.trim() ||
    normalizedBusinesses[0]?.id?.trim() ||
    null;

  document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=${encodedToken}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
  if (selectedBusinessId) {
    document.cookie = `${BUSINESS_ID_COOKIE_NAME}=${encodeURIComponent(selectedBusinessId)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
    localStorage.setItem(BUSINESS_ID_STORAGE_KEY, selectedBusinessId);
  } else {
    document.cookie = `${BUSINESS_ID_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
    localStorage.removeItem(BUSINESS_ID_STORAGE_KEY);
  }

  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, input.accessToken);
  localStorage.setItem(OWNER_STORAGE_KEY, JSON.stringify(input.owner));
  localStorage.setItem(BUSINESSES_STORAGE_KEY, JSON.stringify(normalizedBusinesses));
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;

  document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `${BUSINESS_ID_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(OWNER_STORAGE_KEY);
  localStorage.removeItem(BUSINESS_ID_STORAGE_KEY);
  localStorage.removeItem(BUSINESSES_STORAGE_KEY);
}

export function readOwnerSession(): OwnerSession | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(OWNER_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as OwnerSession;
    if (!parsed?.id || !parsed?.email || !parsed?.name) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function readOwnedBusinessesSession(): OwnerBusinessSession[] {
  if (typeof window === "undefined") return [];

  const raw = localStorage.getItem(BUSINESSES_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((business) => {
        if (!business || typeof business !== "object") return null;
        const record = business as Record<string, unknown>;
        if (typeof record.id !== "string" || typeof record.name !== "string") {
          return null;
        }
        const id = record.id.trim();
        const name = record.name.trim();
        if (!id || !name) return null;
        return { id, name } satisfies OwnerBusinessSession;
      })
      .filter((business): business is OwnerBusinessSession => business !== null);
  } catch {
    return [];
  }
}

export function readSelectedBusinessIdSession(): string | null {
  if (typeof window === "undefined") return null;
  const fromStorage = localStorage.getItem(BUSINESS_ID_STORAGE_KEY)?.trim();
  if (fromStorage) return fromStorage;
  return readCookieValue(BUSINESS_ID_COOKIE_NAME);
}

export function setSelectedBusinessIdSession(businessId: string | null) {
  if (typeof window === "undefined") return;

  const maxAgeSeconds = ACCESS_TOKEN_TTL_DAYS * 24 * 60 * 60;
  const normalized = businessId?.trim() || "";

  if (!normalized) {
    document.cookie = `${BUSINESS_ID_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
    localStorage.removeItem(BUSINESS_ID_STORAGE_KEY);
    return;
  }

  document.cookie = `${BUSINESS_ID_COOKIE_NAME}=${encodeURIComponent(normalized)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
  localStorage.setItem(BUSINESS_ID_STORAGE_KEY, normalized);
}

function readCookieValue(cookieName: string): string | null {
  const chunk = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${cookieName}=`));

  if (!chunk) return null;
  const raw = chunk.slice(cookieName.length + 1).trim();
  if (!raw) return null;

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
