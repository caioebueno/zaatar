import { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE_NAME, BUSINESS_ID_COOKIE_NAME } from "@/src/lib/auth";
import { getApiBaseUrl } from "@/src/lib/uberEatsOAuth";

function buildRedirectUrl(request: NextRequest, message: string, ok: boolean) {
  const target = new URL("/sales-channels/uber-eats", request.url);
  target.searchParams.set("syncStatus", ok ? "success" : "error");
  target.searchParams.set("syncMessage", message);
  return target;
}

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim();
  const businessId = request.cookies.get(BUSINESS_ID_COOKIE_NAME)?.value?.trim();
  if (!accessToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();
  const menuId = String(formData.get("menuId") ?? "").trim();
  const storeId = String(formData.get("storeId") ?? "").trim();
  const dryRun = String(formData.get("dryRun") ?? "") === "on";
  const force = String(formData.get("force") ?? "") === "on";

  if (!menuId || !storeId) {
    return NextResponse.redirect(
      buildRedirectUrl(request, "menuId and storeId are required", false),
    );
  }

  const apiBaseUrl = getApiBaseUrl();

  try {
    const response = await fetch(`${apiBaseUrl}/integrations/uber-eats/menu-sync/publish`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(businessId ? { "x-business-id": businessId } : {}),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        menuId,
        storeId,
        dryRun,
        force,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      skipped?: boolean;
      success?: boolean;
    };

    if (!response.ok) {
      const message = payload.error ?? `Sync failed (${response.status})`;
      return NextResponse.redirect(buildRedirectUrl(request, message, false));
    }

    const message = payload.skipped
      ? "No changes detected. Sync skipped."
      : dryRun
        ? "Dry-run sync completed."
        : "Uber Eats sync completed.";

    return NextResponse.redirect(buildRedirectUrl(request, message, true));
  } catch {
    return NextResponse.redirect(
      buildRedirectUrl(request, "Could not reach API service", false),
    );
  }
}
