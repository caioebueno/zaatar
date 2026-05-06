const CUSTOMER_SESSION_KEY = "foody-customer-session";
export const CUSTOMER_SESSION_UPDATED_EVENT = "foody-customer-session-updated";

type StoredCustomerSession = {
  accessToken?: string;
  accessTokenExpiresAt?: string;
  selectedAddressId?: string;
};

function isCustomerSession(value: unknown): value is StoredCustomerSession {
  if (!value || typeof value !== "object") return false;

  const candidate = value as {
    accessToken?: unknown;
    accessTokenExpiresAt?: unknown;
    selectedAddressId?: unknown;
  };

  if (
    candidate.accessToken !== undefined &&
    typeof candidate.accessToken !== "string"
  ) {
    return false;
  }
  if (
    candidate.accessTokenExpiresAt !== undefined &&
    typeof candidate.accessTokenExpiresAt !== "string"
  ) {
    return false;
  }
  if (
    candidate.selectedAddressId !== undefined &&
    typeof candidate.selectedAddressId !== "string"
  ) {
    return false;
  }

  return true;
}

export function getStoredCustomerSession(): StoredCustomerSession | null {
  if (typeof window === "undefined") return null;

  const storedValue = window.localStorage.getItem(CUSTOMER_SESSION_KEY);
  if (!storedValue) return null;

  try {
    const parsed = JSON.parse(storedValue) as unknown;
    return isCustomerSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function setStoredCustomerSession(session: StoredCustomerSession) {
  if (typeof window === "undefined") return;

  const currentSession = getStoredCustomerSession();
  const nextSession: StoredCustomerSession = {
    selectedAddressId:
      session.selectedAddressId !== undefined
        ? session.selectedAddressId
        : currentSession?.selectedAddressId,
    accessToken:
      session.accessToken !== undefined
        ? session.accessToken
        : currentSession?.accessToken,
    accessTokenExpiresAt:
      session.accessTokenExpiresAt !== undefined
        ? session.accessTokenExpiresAt
        : currentSession?.accessTokenExpiresAt,
  };

  if (!nextSession.accessToken) {
    window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
  } else {
    window.localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(nextSession));
  }
  window.dispatchEvent(new CustomEvent(CUSTOMER_SESSION_UPDATED_EVENT));
}

export function clearStoredCustomerSession() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
  window.dispatchEvent(new CustomEvent(CUSTOMER_SESSION_UPDATED_EVENT));
}

export type TStoredCustomerSession = StoredCustomerSession;
