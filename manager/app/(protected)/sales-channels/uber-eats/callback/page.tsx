import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN_COOKIE_NAME, BUSINESS_ID_COOKIE_NAME } from "@/src/lib/auth";
import {
  getApiBaseUrl,
  getUberEatsCallbackUrl,
  UBER_EATS_OAUTH_STATE_COOKIE_NAME,
} from "@/src/lib/uberEatsOAuth";

type PageProps = {
  searchParams: Promise<{
    code?: string;
    error?: string;
    error_description?: string;
    state?: string;
  }>;
};

function toSafeMessage(value: string | undefined): string {
  if (!value) return "OAuth callback failed.";
  return value.trim() || "OAuth callback failed.";
}

export default async function UberEatsOAuthCallbackPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const code = resolvedSearchParams.code?.trim() || "";
  const oauthError = resolvedSearchParams.error?.trim() || "";
  const oauthErrorDescription = resolvedSearchParams.error_description?.trim() || "";
  const callbackState = resolvedSearchParams.state?.trim() || "";
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim();
  const businessId = cookieStore.get(BUSINESS_ID_COOKIE_NAME)?.value?.trim() || null;
  const expectedState = cookieStore.get(UBER_EATS_OAUTH_STATE_COOKIE_NAME)?.value?.trim() || "";

  if (!accessToken) {
    redirect("/login");
  }

  if (oauthError) {
    const message = encodeURIComponent(
      oauthErrorDescription || `Uber returned error: ${oauthError}`,
    );
    redirect(`/sales-channels/uber-eats?status=error&message=${message}`);
  }

  if (!code) {
    const message = encodeURIComponent("Missing authorization code in callback.");
    redirect(`/sales-channels/uber-eats?status=error&message=${message}`);
  }

  if (!callbackState || !expectedState || callbackState !== expectedState) {
    const message = encodeURIComponent("Invalid OAuth state. Please try connecting again.");
    redirect(`/sales-channels/uber-eats?status=error&message=${message}`);
  }

  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/integrations/uber-eats/oauth/exchange`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(businessId ? { "x-business-id": businessId } : {}),
    },
    body: JSON.stringify({
      code,
      redirectUri: getUberEatsCallbackUrl(),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    const message = encodeURIComponent(
      toSafeMessage(payload.error || "Could not exchange Uber OAuth code."),
    );
    redirect(`/sales-channels/uber-eats?status=error&message=${message}`);
  }

  redirect("/sales-channels/uber-eats?status=connected");
}
