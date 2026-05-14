import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE_NAME, BUSINESS_ID_COOKIE_NAME } from "@/src/lib/auth";
import {
  getApiBaseUrl,
  getUberEatsCallbackUrl,
  UBER_EATS_OAUTH_STATE_COOKIE_NAME,
} from "@/src/lib/uberEatsOAuth";

type OAuthUrlResponse = {
  authorizationUrl?: string;
};

type ApiErrorPayload = {
  error?: unknown;
};

function redirectWithError(request: NextRequest, message: string): NextResponse {
  const target = new URL("/sales-channels/uber-eats", request.url);
  target.searchParams.set("status", "error");
  target.searchParams.set("message", message);
  return NextResponse.redirect(target);
}

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim();
  const businessId = request.cookies.get(BUSINESS_ID_COOKIE_NAME)?.value?.trim();

  if (!accessToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const state = crypto.randomUUID();
  const redirectUri = getUberEatsCallbackUrl({ origin: request.nextUrl.origin });
  const apiBaseUrl = getApiBaseUrl();
  const oauthUrlEndpoint = new URL("/integrations/uber-eats/oauth/url", apiBaseUrl);
  oauthUrlEndpoint.searchParams.set("redirectUri", redirectUri);
  oauthUrlEndpoint.searchParams.set("state", state);

  let response: Response;

  try {
    response = await fetch(oauthUrlEndpoint.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(businessId ? { "x-business-id": businessId } : {}),
      },
      cache: "no-store",
    });
  } catch {
    return redirectWithError(
      request,
      "Could not reach API service. Make sure API is running.",
    );
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload;
    const apiError =
      typeof payload.error === "string" && payload.error.trim().length > 0
        ? payload.error.trim()
        : null;

    if (response.status === 401) {
      return redirectWithError(
        request,
        "Session expired. Please login again and retry Uber Eats connection.",
      );
    }

    if (apiError) {
      return redirectWithError(request, `OAuth init failed: ${apiError}`);
    }

    return redirectWithError(
      request,
      `OAuth init failed with status ${response.status}.`,
    );
  }

  const payload = (await response.json().catch(() => ({}))) as OAuthUrlResponse;

  if (!payload.authorizationUrl || typeof payload.authorizationUrl !== "string") {
    return redirectWithError(request, "Invalid OAuth authorization URL.");
  }

  console.log("[manager] Uber Eats OAuth authorize URL:", payload.authorizationUrl);
  console.log("[manager] Uber Eats OAuth redirectUri:", redirectUri);

  const redirectResponse = NextResponse.redirect(payload.authorizationUrl);
  redirectResponse.cookies.set(UBER_EATS_OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: 10 * 60,
  });

  return redirectResponse;
}
