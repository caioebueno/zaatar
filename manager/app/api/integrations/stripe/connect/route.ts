import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE_NAME, BUSINESS_ID_COOKIE_NAME } from "@/src/lib/auth";
import { getStripeOnboardingRefreshUrl, getStripeOnboardingReturnUrl } from "@/src/lib/stripeConnect";
import { getApiBaseUrl } from "@/src/lib/uberEatsOAuth";

type StripeOnboardingApiResponse = {
  onboardingUrl?: string;
  error?: string;
  message?: string;
};

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim();
  const businessId = request.cookies.get(BUSINESS_ID_COOKIE_NAME)?.value?.trim();

  if (!accessToken) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("message", "Please login to continue Stripe onboarding.");
    return NextResponse.redirect(loginUrl);
  }

  const origin = request.nextUrl.origin;
  const refreshUrl = getStripeOnboardingRefreshUrl({ origin });
  const returnUrl = getStripeOnboardingReturnUrl({ origin });

  try {
    const response = await fetch(`${getApiBaseUrl()}/integrations/stripe/connect/onboarding-link`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(businessId ? { "x-business-id": businessId } : {}),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        refreshUrl,
        returnUrl,
      }),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as StripeOnboardingApiResponse;

    if (!response.ok || typeof payload.onboardingUrl !== "string") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/onboarding";
      redirectUrl.searchParams.set("stripe", "error");
      redirectUrl.searchParams.set(
        "message",
        payload.message?.trim() || payload.error?.trim() || "Could not initialize Stripe onboarding.",
      );
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.redirect(payload.onboardingUrl);
  } catch {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/onboarding";
    redirectUrl.searchParams.set("stripe", "error");
    redirectUrl.searchParams.set("message", "Could not reach API server for Stripe onboarding.");
    return NextResponse.redirect(redirectUrl);
  }
}
