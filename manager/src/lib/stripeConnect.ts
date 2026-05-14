const DEFAULT_MANAGER_BASE_URL = "http://localhost:3000";

function normalizeBaseUrl(value: string | undefined, fallback: string): string {
  const candidate = value?.trim() || fallback;
  try {
    const parsed = new URL(candidate);
    return parsed.href.replace(/\/+$/, "");
  } catch {
    return fallback;
  }
}

export function getManagerBaseUrl(options?: { origin?: string }): string {
  if (options?.origin?.trim()) {
    return normalizeBaseUrl(options.origin, DEFAULT_MANAGER_BASE_URL);
  }

  return normalizeBaseUrl(
    process.env.NEXT_PUBLIC_MANAGER_BASE_URL,
    DEFAULT_MANAGER_BASE_URL,
  );
}

export function getStripeOnboardingReturnUrl(options?: { origin?: string }): string {
  const configured = process.env.STRIPE_CONNECT_RETURN_URL?.trim();
  if (configured) {
    return configured;
  }
  return `${getManagerBaseUrl(options)}/onboarding?stripe=returned`;
}

export function getStripeOnboardingRefreshUrl(options?: { origin?: string }): string {
  const configured = process.env.STRIPE_CONNECT_REFRESH_URL?.trim();
  if (configured) {
    return configured;
  }
  return `${getManagerBaseUrl(options)}/api/integrations/stripe/connect?source=refresh`;
}
