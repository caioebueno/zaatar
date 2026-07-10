import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import BusinessMembersManager from "@/app/components/BusinessMembersManager";
import { ACCESS_TOKEN_COOKIE_NAME } from "@/src/lib/auth";
import { readBusinessIdFromCookieStore } from "@/src/lib/business";
import { getApiBaseUrl } from "@/src/lib/uberEatsOAuth";

type BusinessMember = {
  createdAt: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  status: string;
  userId: string;
};

async function fetchBusinessMembers(input: {
  accessToken: string;
  businessId: string | null;
}): Promise<BusinessMember[]> {
  const response = await fetch(`${getApiBaseUrl()}/businesses/current/members`, {
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      ...(input.businessId ? { "x-business-id": input.businessId } : {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as
    | { items?: BusinessMember[]; error?: string }
    | BusinessMember[];

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      !Array.isArray(payload) &&
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

export default async function TeamSettingsPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim();
  const businessId = readBusinessIdFromCookieStore(cookieStore);

  if (!accessToken) {
    redirect("/login");
  }

  let initialMembers: BusinessMember[] = [];
  let initialError: string | null = null;

  try {
    initialMembers = await fetchBusinessMembers({ accessToken, businessId });
  } catch (error) {
    initialError =
      error instanceof Error ? error.message : "Could not load team members";
  }

  return (
    <div className="manager-page">
      <h1 className="manager-page-title">Team Access</h1>
      <p className="manager-page-subtitle">
        Manage who can log in to this business from the manager app.
      </p>

      <BusinessMembersManager
        initialMembers={initialMembers}
        initialError={initialError}
      />
    </div>
  );
}
