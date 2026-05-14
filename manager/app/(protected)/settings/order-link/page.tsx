import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import OrderLinkSettingsForm from "@/app/components/OrderLinkSettingsForm";
import { ACCESS_TOKEN_COOKIE_NAME } from "@/src/lib/auth";
import { readBusinessIdFromCookieStore } from "@/src/lib/business";
import { getApiBaseUrl } from "@/src/lib/uberEatsOAuth";

type SettingsResponse = {
  bannerPhotoUrl: string | null;
  brandColor: string;
  businessId: string;
  logoUrl: string | null;
  name: string;
  orderLinkUrl: string;
};

export default async function OrderLinkSettingsPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim();
  const businessId = readBusinessIdFromCookieStore(cookieStore);

  if (!accessToken) {
    redirect("/login");
  }

  let initialSettings: SettingsResponse | null = null;
  let errorMessage: string | null = null;

  try {
    const response = await fetch(`${getApiBaseUrl()}/businesses/current/settings`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(businessId ? { "x-business-id": businessId } : {}),
      },
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as Partial<SettingsResponse> & {
      error?: string;
    };

    if (!response.ok) {
      errorMessage = payload.error ?? `Failed to load settings (${response.status})`;
    } else if (
      typeof payload.businessId === "string" &&
      typeof payload.name === "string" &&
      typeof payload.brandColor === "string" &&
      typeof payload.orderLinkUrl === "string"
    ) {
      initialSettings = {
        businessId: payload.businessId,
        name: payload.name,
        brandColor: payload.brandColor,
        orderLinkUrl: payload.orderLinkUrl,
        logoUrl: typeof payload.logoUrl === "string" ? payload.logoUrl : null,
        bannerPhotoUrl:
          typeof payload.bannerPhotoUrl === "string" ? payload.bannerPhotoUrl : null,
      };
    } else {
      errorMessage = "Invalid settings payload";
    }
  } catch {
    errorMessage = "Could not reach API service";
  }

  return (
    <div className="manager-page">
      <h1 className="manager-page-title">Order Link Settings</h1>
      <p className="manager-page-subtitle">
        Configure brand details for this business order link.
      </p>

      {errorMessage ? <p className="sales-channel-feedback is-error">{errorMessage}</p> : null}

      {initialSettings ? <OrderLinkSettingsForm initialSettings={initialSettings} /> : null}
    </div>
  );
}
