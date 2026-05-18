import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE_NAME, BUSINESS_ID_COOKIE_NAME } from "@/src/lib/auth";
import { getApiBaseUrl } from "@/src/lib/uberEatsOAuth";

async function forwardToApi(request: NextRequest, method: "GET" | "POST") {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim();
  const businessId = request.cookies.get(BUSINESS_ID_COOKIE_NAME)?.value?.trim();

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const endpoint = `${getApiBaseUrl()}/drivers`;

  try {
    const body = method === "POST" ? await request.json().catch(() => ({})) : undefined;

    const response = await fetch(endpoint, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(businessId ? { "x-business-id": businessId } : {}),
        ...(method === "POST" ? { "content-type": "application/json" } : {}),
      },
      body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as unknown;
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Could not reach API service" }, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  return forwardToApi(request, "GET");
}

export async function POST(request: NextRequest) {
  return forwardToApi(request, "POST");
}
