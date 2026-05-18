"use server";

import { unstable_cache } from "next/cache";
import { getConfiguredBusinessId } from "./constants/business";
import { getApiBaseUrl } from "./lib/apiBaseUrl";

export type TOrderLinkSettings = {
  bannerPhotoUrl: string | null;
  brandColor: string;
  businessId: string | null;
  businessName: string;
  logoUrl: string | null;
};

const DEFAULT_ORDER_LINK_SETTINGS: TOrderLinkSettings = {
  businessId: null,
  businessName: "Business",
  brandColor: "#142826",
  logoUrl: null,
  bannerPhotoUrl: null,
};

const loadOrderLinkSettingsByBusinessId = unstable_cache(
  async (businessId: string): Promise<TOrderLinkSettings | null> => {
    const endpoint = `${getApiBaseUrl()}/public/order-link/settings?businessId=${encodeURIComponent(
      businessId,
    )}`;

    const response = await fetch(endpoint, {
      headers: {
        "x-business-id": businessId,
      },
      next: {
        revalidate: 60,
      },
    }).catch(() => null);

    if (!response || !response.ok) {
      return null;
    }

    const payload = (await response.json().catch(() => null)) as {
      bannerPhotoUrl?: string | null;
      brandColor?: string | null;
      businessId?: string;
      logoUrl?: string | null;
      name?: string;
    } | null;

    if (!payload || typeof payload.businessId !== "string") {
      return null;
    }

    return {
      businessId: payload.businessId,
      businessName:
        typeof payload.name === "string" && payload.name.trim().length > 0
          ? payload.name.trim()
          : DEFAULT_ORDER_LINK_SETTINGS.businessName,
      brandColor:
        typeof payload.brandColor === "string" && payload.brandColor.trim().length > 0
          ? payload.brandColor
          : DEFAULT_ORDER_LINK_SETTINGS.brandColor,
      logoUrl:
        typeof payload.logoUrl === "string" && payload.logoUrl.trim().length > 0
          ? payload.logoUrl
          : null,
      bannerPhotoUrl:
        typeof payload.bannerPhotoUrl === "string" &&
        payload.bannerPhotoUrl.trim().length > 0
          ? payload.bannerPhotoUrl
          : null,
    };
  },
  ["order-link-settings-by-business-id"],
  {
    revalidate: 60,
  },
);

export async function getOrderLinkSettings(): Promise<TOrderLinkSettings> {
  const businessId = getConfiguredBusinessId();

  if (!businessId) {
    return DEFAULT_ORDER_LINK_SETTINGS;
  }

  const settings = await loadOrderLinkSettingsByBusinessId(businessId);

  if (!settings) {
    return {
      ...DEFAULT_ORDER_LINK_SETTINGS,
      businessId,
    };
  }

  return settings;
}
