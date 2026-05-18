import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE_NAME, BUSINESS_ID_COOKIE_NAME } from "@/src/lib/auth";
import { getApiBaseUrl } from "@/src/lib/uberEatsOAuth";

type Context = {
  params: Promise<{
    branchId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: Context) {
  const { branchId } = await context.params;
  const normalizedBranchId = branchId?.trim();
  if (!normalizedBranchId) {
    return NextResponse.json({ error: "Invalid branchId" }, { status: 400 });
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim();
  const businessId = request.cookies.get(BUSINESS_ID_COOKIE_NAME)?.value?.trim();
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    const response = await fetch(
      `${getApiBaseUrl()}/businesses/current/onboarding/branches/${encodeURIComponent(
        normalizedBranchId,
      )}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...(businessId ? { "x-business-id": businessId } : {}),
          "content-type": "application/json",
        },
        body: JSON.stringify(body ?? {}),
        cache: "no-store",
      },
    );
    const payload = (await response.json().catch(() => ({}))) as unknown;
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Could not reach API service" }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  const { branchId } = await context.params;
  const normalizedBranchId = branchId?.trim();
  if (!normalizedBranchId) {
    return NextResponse.json({ error: "Invalid branchId" }, { status: 400 });
  }

  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim();
  const businessId = request.cookies.get(BUSINESS_ID_COOKIE_NAME)?.value?.trim();
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(
      `${getApiBaseUrl()}/businesses/current/onboarding/branches/${encodeURIComponent(
        normalizedBranchId,
      )}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...(businessId ? { "x-business-id": businessId } : {}),
        },
        cache: "no-store",
      },
    );

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
    const payload = (await response.json().catch(() => ({}))) as unknown;
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Could not reach API service" }, { status: 502 });
  }
}
