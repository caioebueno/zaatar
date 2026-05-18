import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE_NAME, BUSINESS_ID_COOKIE_NAME } from "@/src/lib/auth";
import { getApiBaseUrl } from "@/src/lib/uberEatsOAuth";

function buildRedirectUrl(request: NextRequest, message: string, ok: boolean) {
  const target = new URL("/sales-channels/uber-eats", request.url);
  target.searchParams.set("menuCreateStatus", ok ? "success" : "error");
  target.searchParams.set("menuCreateMessage", message);
  return target;
}

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim();
  const businessId = request.cookies.get(BUSINESS_ID_COOKIE_NAME)?.value?.trim();
  if (!accessToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return NextResponse.redirect(
      buildRedirectUrl(request, "Menu name is required", false),
    );
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/menus`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(businessId ? { "x-business-id": businessId } : {}),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name,
        active: true,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: unknown;
      id?: unknown;
    };

    if (!response.ok) {
      const errorMessage =
        typeof payload.error === "string" && payload.error.trim().length > 0
          ? payload.error
          : `Failed to create menu (${response.status})`;
      return NextResponse.redirect(buildRedirectUrl(request, errorMessage, false));
    }

    return NextResponse.redirect(
      buildRedirectUrl(request, "Menu created successfully", true),
    );
  } catch {
    return NextResponse.redirect(
      buildRedirectUrl(request, "Could not reach API service", false),
    );
  }
}
