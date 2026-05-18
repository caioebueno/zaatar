import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DriversManager from "@/app/components/DriversManager";
import { ACCESS_TOKEN_COOKIE_NAME } from "@/src/lib/auth";
import { readBusinessIdFromCookieStore } from "@/src/lib/business";
import { getApiBaseUrl } from "@/src/lib/uberEatsOAuth";

type Driver = {
  active: boolean;
  createdAt: string;
  id: string;
  name: string;
  phone: string | null;
  priorityLevel: number;
};

async function fetchDrivers(input: {
  accessToken: string;
  businessId: string | null;
}): Promise<Driver[]> {
  const response = await fetch(`${getApiBaseUrl()}/drivers`, {
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      ...(input.businessId ? { "x-business-id": input.businessId } : {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as
    | Driver[]
    | { error?: string; items?: Driver[] };

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : `Request failed (${response.status})`;

    throw new Error(message);
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "items" in payload &&
    Array.isArray(payload.items)
  ) {
    return payload.items;
  }

  return [];
}

export default async function DriversPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim();
  const businessId = readBusinessIdFromCookieStore(cookieStore);

  if (!accessToken) {
    redirect("/login");
  }

  let initialDrivers: Driver[] = [];
  let initialError: string | null = null;

  try {
    initialDrivers = await fetchDrivers({ accessToken, businessId });
  } catch (error) {
    initialError = error instanceof Error ? error.message : "Could not load drivers";
  }

  return (
    <DriversManager initialDrivers={initialDrivers} initialError={initialError} />
  );
}
