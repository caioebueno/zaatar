import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE_NAME, BUSINESS_ID_COOKIE_NAME } from "@/src/lib/auth";
import { getApiBaseUrl } from "@/src/lib/uberEatsOAuth";

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim();
  const businessId = request.cookies.get(BUSINESS_ID_COOKIE_NAME)?.value?.trim();

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    const response = await fetch(`${getApiBaseUrl()}/businesses/current/onboarding/branches`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(businessId ? { "x-business-id": businessId } : {}),
        "content-type": "application/json",
      },
      body: JSON.stringify(body ?? {}),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as unknown;
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Could not reach API service" }, { status: 502 });
  }
}
