import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import OnboardingSetupForm from "@/app/components/OnboardingSetupForm";
import type { OnboardingStatus } from "@/app/components/OnboardingSetupForm";
import { ACCESS_TOKEN_COOKIE_NAME } from "@/src/lib/auth";
import { readBusinessIdFromCookieStore } from "@/src/lib/business";
import { getApiBaseUrl } from "@/src/lib/uberEatsOAuth";

type OnboardingStatusResponse = {
  basicInfo?: {
    bannerPhotoUrl?: string | null;
    brandColor?: string;
    businessId?: string;
    logoUrl?: string | null;
    name?: string;
    orderLinkUrl?: string;
  };
  checklist?: {
    basicInfoComplete?: boolean;
    branchesComplete?: boolean;
    completed?: boolean;
    stripeReady?: boolean;
  };
  branches?: Array<{
    addressCity?: string | null;
    addressComplement?: string | null;
    addressDescription?: string;
    addressGoogleMapsUrl?: string;
    addressLatitude?: number | null;
    addressLongitude?: number | null;
    addressNumber?: string | null;
    addressNumberComplement?: string | null;
    addressPlaceId?: string | null;
    addressState?: string | null;
    addressStreet?: string | null;
    addressZipCode?: string | null;
    createdAt?: string;
    id?: string;
    name?: string;
    operationHours?: unknown;
  }>;
  stripe?: {
    accountId?: string | null;
    chargesEnabled?: boolean;
    detailsSubmitted?: boolean;
    payoutsEnabled?: boolean;
    readyForPayouts?: boolean;
  };
  suggestions?: string[];
  error?: string;
};

type PageProps = {
  searchParams: Promise<{
    message?: string;
    stripe?: string;
  }>;
};

function buildFallbackStatus(businessId: string): OnboardingStatus {
  return {
    basicInfo: {
      businessId,
      name: "",
      brandColor: "#0f766e",
      logoUrl: null,
      bannerPhotoUrl: null,
      orderLinkUrl: "",
    },
    checklist: {
      basicInfoComplete: false,
      branchesComplete: false,
      stripeReady: false,
      completed: false,
    },
    branches: [],
    stripe: {
      accountId: null,
      detailsSubmitted: false,
      chargesEnabled: false,
      payoutsEnabled: false,
      readyForPayouts: false,
    },
    suggestions: [],
  };
}

export default async function OnboardingPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim();
  const businessId = readBusinessIdFromCookieStore(cookieStore);

  if (!accessToken) {
    redirect("/login");
  }

  const fallback = buildFallbackStatus(businessId ?? "");
  let errorMessage: string | null = null;
  let initialStatus: OnboardingStatus = fallback;

  if (businessId) {
    try {
      const response = await fetch(`${getApiBaseUrl()}/businesses/current/onboarding`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-business-id": businessId,
        },
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => ({}))) as OnboardingStatusResponse;
      if (!response.ok) {
        errorMessage = payload.error ?? `Failed to load onboarding (${response.status})`;
      } else {
        initialStatus = {
          basicInfo: {
            businessId:
              typeof payload.basicInfo?.businessId === "string"
                ? payload.basicInfo.businessId
                : fallback.basicInfo.businessId,
            name:
              typeof payload.basicInfo?.name === "string"
                ? payload.basicInfo.name
                : fallback.basicInfo.name,
            brandColor:
              typeof payload.basicInfo?.brandColor === "string"
                ? payload.basicInfo.brandColor
                : fallback.basicInfo.brandColor,
            logoUrl:
              typeof payload.basicInfo?.logoUrl === "string"
                ? payload.basicInfo.logoUrl
                : fallback.basicInfo.logoUrl,
            bannerPhotoUrl:
              typeof payload.basicInfo?.bannerPhotoUrl === "string"
                ? payload.basicInfo.bannerPhotoUrl
                : fallback.basicInfo.bannerPhotoUrl,
            orderLinkUrl:
              typeof payload.basicInfo?.orderLinkUrl === "string"
                ? payload.basicInfo.orderLinkUrl
                : fallback.basicInfo.orderLinkUrl,
          },
          checklist: {
            basicInfoComplete: Boolean(payload.checklist?.basicInfoComplete),
            branchesComplete: Boolean(payload.checklist?.branchesComplete),
            stripeReady: Boolean(payload.checklist?.stripeReady),
            completed: Boolean(payload.checklist?.completed),
          },
          branches: Array.isArray(payload.branches)
            ? payload.branches
                .map((branch) => {
                  if (!branch || typeof branch !== "object") return null;
                  const record = branch as Record<string, unknown>;
                  if (
                    typeof record.id !== "string" ||
                    typeof record.name !== "string" ||
                    typeof record.createdAt !== "string"
                  ) {
                    return null;
                  }
                  return {
                    id: record.id,
                    name: record.name,
                    createdAt: record.createdAt,
                    addressCity:
                      typeof record.addressCity === "string" ? record.addressCity : null,
                    addressComplement:
                      typeof record.addressComplement === "string"
                        ? record.addressComplement
                        : null,
                    addressDescription:
                      typeof record.addressDescription === "string"
                        ? record.addressDescription
                        : "",
                    addressGoogleMapsUrl:
                      typeof record.addressGoogleMapsUrl === "string"
                        ? record.addressGoogleMapsUrl
                        : "",
                    addressLatitude:
                      typeof record.addressLatitude === "number"
                        ? record.addressLatitude
                        : null,
                    addressLongitude:
                      typeof record.addressLongitude === "number"
                        ? record.addressLongitude
                        : null,
                    addressNumber:
                      typeof record.addressNumber === "string"
                        ? record.addressNumber
                        : null,
                    addressNumberComplement:
                      typeof record.addressNumberComplement === "string"
                        ? record.addressNumberComplement
                        : null,
                    addressPlaceId:
                      typeof record.addressPlaceId === "string"
                        ? record.addressPlaceId
                        : null,
                    addressState:
                      typeof record.addressState === "string" ? record.addressState : null,
                    addressStreet:
                      typeof record.addressStreet === "string" ? record.addressStreet : null,
                    addressZipCode:
                      typeof record.addressZipCode === "string" ? record.addressZipCode : null,
                    operationHours: record.operationHours,
                  };
                })
                .filter(
                  (branch): branch is OnboardingStatus["branches"][number] => branch !== null,
                )
            : [],
          stripe: {
            accountId:
              typeof payload.stripe?.accountId === "string" ? payload.stripe.accountId : null,
            detailsSubmitted: Boolean(payload.stripe?.detailsSubmitted),
            chargesEnabled: Boolean(payload.stripe?.chargesEnabled),
            payoutsEnabled: Boolean(payload.stripe?.payoutsEnabled),
            readyForPayouts: Boolean(payload.stripe?.readyForPayouts),
          },
          suggestions: Array.isArray(payload.suggestions)
            ? payload.suggestions.filter(
                (item): item is string => typeof item === "string" && item.trim().length > 0,
              )
            : [],
        };
      }
    } catch {
      errorMessage = "Could not reach API service";
    }
  }

  const stripeMessage =
    query.stripe === "returned" ? "Checking Stripe setup..." : null;
  const stripeErrorMessage =
    query.stripe === "error" && typeof query.message === "string" && query.message.trim()
      ? query.message.trim()
      : null;

  return (
    <OnboardingSetupForm
      initialStatus={initialStatus}
      initialStripeReturned={query.stripe === "returned"}
      initialError={errorMessage ?? stripeErrorMessage}
      initialStripeMessage={stripeMessage}
    />
  );
}
