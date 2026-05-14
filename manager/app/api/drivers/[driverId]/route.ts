import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE_NAME, BUSINESS_ID_COOKIE_NAME } from "@/src/lib/auth";
import { getApiBaseUrl } from "@/src/lib/uberEatsOAuth";

type RouteContext = {
  params: Promise<{
    driverId: string;
  }>;
};

async function forwardToApi(
  request: NextRequest,
  context: RouteContext,
  method: "GET" | "PATCH" | "DELETE",
) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim();
  const businessId = request.cookies.get(BUSINESS_ID_COOKIE_NAME)?.value?.trim();

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { driverId } = await context.params;
  const normalizedDriverId = driverId.trim();

  if (!normalizedDriverId) {
    return NextResponse.json({ error: "Invalid driverId" }, { status: 400 });
  }

  const endpoint = `${getApiBaseUrl()}/drivers/${encodeURIComponent(normalizedDriverId)}`;

  try {
    const body = method === "PATCH" ? await request.json().catch(() => ({})) : undefined;

    const response = await fetch(endpoint, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(businessId ? { "x-business-id": businessId } : {}),
        ...(method === "PATCH" ? { "content-type": "application/json" } : {}),
      },
      body: method === "PATCH" ? JSON.stringify(body ?? {}) : undefined,
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as unknown;
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Could not reach API service" }, { status: 502 });
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return forwardToApi(request, context, "GET");
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return forwardToApi(request, context, "PATCH");
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return forwardToApi(request, context, "DELETE");
}
