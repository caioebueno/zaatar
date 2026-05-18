import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN_COOKIE_NAME } from "@/src/lib/auth";
import { readBusinessIdFromCookieStore } from "@/src/lib/business";
import { getApiBaseUrl } from "@/src/lib/uberEatsOAuth";
import StationsManager from "@/app/components/StationsManager";

export const dynamic = "force-dynamic";

type Step = {
  goalMinutes: number;
  id: string;
  name: string;
  includeComments: boolean;
  includeModifiers: boolean;
};

type Station = {
  id: string;
  name: string;
  preparationSteps: Step[];
};

async function fetchStations(input: {
  accessToken: string;
  businessId: string | null;
}): Promise<Station[]> {
  const response = await fetch(`${getApiBaseUrl()}/stations`, {
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      ...(input.businessId ? { "x-business-id": input.businessId } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? `Request failed (${response.status})`);
  }

  const payload = (await response.json().catch(() => ({}))) as { items?: unknown };
  if (Array.isArray(payload.items)) {
    return payload.items as Station[];
  }

  return [];
}

export default async function StationsPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim();
  const businessId = readBusinessIdFromCookieStore(cookieStore);

  if (!accessToken) {
    redirect("/login");
  }

  let initialStations: Station[] = [];
  let initialError: string | null = null;

  try {
    initialStations = await fetchStations({ accessToken, businessId });
  } catch (error) {
    initialError = error instanceof Error ? error.message : "Could not load stations";
  }

  return (
    <StationsManager
      initialStations={initialStations}
      initialError={initialError}
    />
  );
}
