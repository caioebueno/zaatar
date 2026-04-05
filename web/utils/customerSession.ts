import TCustomer from "@/src/types/customer";

const CUSTOMER_SESSION_KEY = "foody-customer-session";
export const CUSTOMER_SESSION_UPDATED_EVENT = "foody-customer-session-updated";

type StoredCustomerSession = {
  customer: TCustomer;
  phone: string;
  phoneCountry?: string;
  selectedAddressId?: string;
};

function isCustomerSession(value: unknown): value is StoredCustomerSession {
  if (!value || typeof value !== "object") return false;

  const candidate = value as {
    customer?: unknown;
    phone?: unknown;
    phoneCountry?: unknown;
    selectedAddressId?: unknown;
  };

  if (typeof candidate.phone !== "string") return false;
  if (
    candidate.phoneCountry !== undefined &&
    typeof candidate.phoneCountry !== "string"
  ) {
    return false;
  }
  if (
    candidate.selectedAddressId !== undefined &&
    typeof candidate.selectedAddressId !== "string"
  ) {
    return false;
  }

  const customer = candidate.customer as
    | {
        id?: unknown;
        name?: unknown;
        addresses?: unknown;
      }
    | undefined;

  return (
    typeof customer?.id === "string" &&
    (customer.name === null ||
      customer.name === undefined ||
      typeof customer.name === "string") &&
    (customer.addresses === undefined || Array.isArray(customer.addresses))
  );
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

  window.localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent(CUSTOMER_SESSION_UPDATED_EVENT));
}

export function clearStoredCustomerSession() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
  window.dispatchEvent(new CustomEvent(CUSTOMER_SESSION_UPDATED_EVENT));
}

export type TStoredCustomerSession = StoredCustomerSession;
