import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN_COOKIE_NAME, BUSINESS_ID_COOKIE_NAME } from "@/src/lib/auth";
import { getApiBaseUrl, getUberEatsCallbackUrl } from "@/src/lib/uberEatsOAuth";

type PageProps = {
  searchParams: Promise<{
    menuCreateMessage?: string;
    menuCreateStatus?: string;
    message?: string;
    status?: string;
    syncMessage?: string;
    syncStatus?: string;
  }>;
};

type UberEatsConnectionStatusResponse = {
  connected?: boolean;
  stores?: Array<{
    id?: string;
    name?: string;
  }>;
  connection?: {
    connectedAt?: string | null;
    environment?: "SANDBOX" | "PRODUCTION" | string;
  } | null;
};

type UberEatsStore = {
  id: string;
  name: string;
};

type ApiMenu = {
  id: string;
  isDefault: boolean;
  name: string;
};

type SyncStatusResponse = {
  latestRun?: {
    createdAt: string;
    dryRun: boolean;
    errorMessage?: string | null;
    menuId: string;
    status: string;
  } | null;
};

type SyncHistoryResponse = {
  runs?: Array<{
    createdAt: string;
    dryRun: boolean;
    errorMessage?: string | null;
    id: string;
    status: string;
  }>;
};

async function fetchUberEatsConnectionStatus(
  accessToken: string,
  businessId: string | null,
): Promise<UberEatsConnectionStatusResponse | null> {
  const apiBaseUrl = getApiBaseUrl();
  try {
    const response = await fetch(`${apiBaseUrl}/integrations/uber-eats/connection`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(businessId ? { "x-business-id": businessId } : {}),
      },
      cache: "no-store",
    });

    if (!response.ok) return null;
    return (await response.json()) as UberEatsConnectionStatusResponse;
  } catch {
    return null;
  }
}

async function fetchMenus(accessToken: string, businessId: string | null): Promise<ApiMenu[]> {
  const apiBaseUrl = getApiBaseUrl();
  try {
    const response = await fetch(`${apiBaseUrl}/menus`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(businessId ? { "x-business-id": businessId } : {}),
      },
      cache: "no-store",
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as unknown;
    return Array.isArray(payload)
      ? payload
          .filter((item): item is ApiMenu =>
            Boolean(item) &&
            typeof item === "object" &&
            typeof (item as { id?: unknown }).id === "string" &&
            typeof (item as { name?: unknown }).name === "string",
          )
      : [];
  } catch {
    return [];
  }
}

async function fetchSyncStatus(
  accessToken: string,
  businessId: string | null,
  menuId: string,
): Promise<SyncStatusResponse | null> {
  const apiBaseUrl = getApiBaseUrl();
  try {
    const response = await fetch(
      `${apiBaseUrl}/integrations/uber-eats/menu-sync/status?menuId=${encodeURIComponent(menuId)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...(businessId ? { "x-business-id": businessId } : {}),
        },
        cache: "no-store",
      },
    );
    if (!response.ok) return null;
    return (await response.json()) as SyncStatusResponse;
  } catch {
    return null;
  }
}

async function fetchSyncHistory(
  accessToken: string,
  businessId: string | null,
  menuId: string,
): Promise<SyncHistoryResponse | null> {
  const apiBaseUrl = getApiBaseUrl();
  try {
    const response = await fetch(
      `${apiBaseUrl}/integrations/uber-eats/menu-sync/history?menuId=${encodeURIComponent(menuId)}&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...(businessId ? { "x-business-id": businessId } : {}),
        },
        cache: "no-store",
      },
    );
    if (!response.ok) return null;
    return (await response.json()) as SyncHistoryResponse;
  } catch {
    return null;
  }
}

function normalizeStores(
  value: UberEatsConnectionStatusResponse | null,
): UberEatsStore[] {
  if (!Array.isArray(value?.stores)) return [];
  return value.stores
    .map((store) => {
      const id = typeof store.id === "string" ? store.id.trim() : "";
      if (!id) return null;
      const name =
        typeof store.name === "string" && store.name.trim().length > 0
          ? store.name.trim()
          : "Unnamed store";
      return { id, name };
    })
    .filter((store): store is UberEatsStore => store !== null);
}

export default async function UberEatsChannelPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const menuCreateStatus = resolvedSearchParams.menuCreateStatus;
  const menuCreateMessage = resolvedSearchParams.menuCreateMessage;
  const status = resolvedSearchParams.status;
  const message = resolvedSearchParams.message;
  const syncStatus = resolvedSearchParams.syncStatus;
  const syncMessage = resolvedSearchParams.syncMessage;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim();
  const businessId = cookieStore.get(BUSINESS_ID_COOKIE_NAME)?.value?.trim() || null;

  if (!accessToken) {
    redirect("/login");
  }

  const callbackUrl = getUberEatsCallbackUrl();
  const [persistedConnection, menus] = await Promise.all([
    fetchUberEatsConnectionStatus(accessToken, businessId),
    fetchMenus(accessToken, businessId),
  ]);
  const stores = normalizeStores(persistedConnection);
  const selectedMenuId =
    menus.find((menu) => menu.isDefault)?.id ?? menus[0]?.id ?? "";
  const selectedStoreId = stores[0]?.id ?? "";
  const [syncStatusPayload, syncHistoryPayload] = selectedMenuId
    ? await Promise.all([
        fetchSyncStatus(accessToken, businessId, selectedMenuId),
        fetchSyncHistory(accessToken, businessId, selectedMenuId),
      ])
    : [null, null];
  const isPersistedConnected = persistedConnection?.connected === true;
  const shouldShowConnected = status === "connected" || isPersistedConnected;
  const connectedAt =
    typeof persistedConnection?.connection?.connectedAt === "string"
      ? persistedConnection.connection.connectedAt
      : null;
  const connectedEnvironment =
    typeof persistedConnection?.connection?.environment === "string"
      ? persistedConnection.connection.environment
      : null;

  return (
    <div className="manager-page sales-channel-page">
      <header className="sales-channel-header">
        <h1 className="manager-page-title">Sales Channels</h1>
        <p className="manager-page-subtitle">
          Connect marketplace channels to sync menus and receive orders.
        </p>
      </header>

      <div className="sales-channel-tabs" role="tablist" aria-label="Sales channels">
        <button className="sales-channel-tab is-active" role="tab" aria-selected="true" type="button">
          Uber Eats
        </button>
      </div>

      <section className="sales-channel-card" aria-labelledby="uber-eats-title">
        <div className="sales-channel-card-head">
          <div>
            <h2 id="uber-eats-title" className="sales-channel-title">
              Uber Eats Integration
            </h2>
            <p className="sales-channel-muted">
              Connect your Uber Eats account with OAuth. No manual token input required.
            </p>
          </div>
          <span
            className={`sales-channel-badge${shouldShowConnected ? " is-connected" : ""}`}
            aria-label="connection status"
          >
            {shouldShowConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        {status === "connected" && (
          <p className="sales-channel-feedback is-success">
            Uber Eats account connected successfully.
          </p>
        )}

        {isPersistedConnected && connectedAt && (
          <p className="sales-channel-muted">
            Connected on {new Date(connectedAt).toLocaleString()}{" "}
            {connectedEnvironment ? `(${connectedEnvironment})` : ""}
          </p>
        )}

        {status === "error" && (
          <p className="sales-channel-feedback is-error">
            {message?.trim() || "Could not connect Uber Eats account."}
          </p>
        )}

        <div className="sales-channel-cta">
          <a className="button button-primary" href="/api/integrations/uber-eats/connect">
            Connect with Uber Eats
          </a>
          <p className="sales-channel-muted">
            Callback URL: <code>{callbackUrl}</code>
          </p>
        </div>
      </section>

      <section className="sales-channel-card sales-channel-help">
        <h3 className="sales-channel-subtitle">Sync Ordering Menu to Uber Eats</h3>

        {menuCreateStatus === "success" && (
          <p className="sales-channel-feedback is-success">
            {menuCreateMessage ?? "Menu created successfully"}
          </p>
        )}
        {menuCreateStatus === "error" && (
          <p className="sales-channel-feedback is-error">
            {menuCreateMessage ?? "Could not create menu"}
          </p>
        )}

        <form className="sales-channel-form" action="/api/menus/create" method="post">
          <label className="field-label" htmlFor="new-menu-name">
            Create menu
          </label>
          <input
            id="new-menu-name"
            name="name"
            className="field-input"
            placeholder="e.g. Uber Eats Dinner"
            required
          />
          <div className="sales-channel-actions">
            <button className="button button-primary" type="submit">
              Create menu
            </button>
          </div>
        </form>

        {syncStatus === "success" && (
          <p className="sales-channel-feedback is-success">
            {syncMessage ?? "Sync completed"}
          </p>
        )}
        {syncStatus === "error" && (
          <p className="sales-channel-feedback is-error">
            {syncMessage ?? "Sync failed"}
          </p>
        )}

        <form
          className="sales-channel-form"
          action="/api/integrations/uber-eats/menu-sync/publish"
          method="post"
        >
          <label className="field-label" htmlFor="sync-menu-id">
            Menu
          </label>
          <select
            id="sync-menu-id"
            name="menuId"
            className="field-input"
            defaultValue={selectedMenuId}
            required
          >
            {menus.length === 0 && <option value="">No menus available</option>}
            {menus.map((menu) => (
              <option key={menu.id} value={menu.id}>
                {menu.name}
              </option>
            ))}
          </select>

          <label className="field-label" htmlFor="sync-store-id">
            Uber store
          </label>
          {stores.length > 0 ? (
            <select
              id="sync-store-id"
              name="storeId"
              className="field-input"
              defaultValue={selectedStoreId}
              required
            >
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name} ({store.id})
                </option>
              ))}
            </select>
          ) : (
            <>
              <input
                id="sync-store-id"
                name="storeId"
                className="field-input"
                placeholder="Enter Uber store ID"
                required
              />
              <p className="sales-channel-muted">
                No stores were auto-loaded from OAuth yet. Reconnect Uber Eats or enter Store ID manually.
              </p>
            </>
          )}

          <label className="sales-channel-check">
            <input type="checkbox" name="dryRun" />
            Dry run (validate/build only, do not publish)
          </label>

          <label className="sales-channel-check">
            <input type="checkbox" name="force" />
            Force sync even if no changes detected
          </label>

          <div className="sales-channel-actions">
            <button className="button button-primary" type="submit">
              Publish to Uber Eats
            </button>
          </div>
        </form>

        {syncStatusPayload?.latestRun && (
          <p className="sales-channel-muted">
            Latest run: {syncStatusPayload.latestRun.status} on{" "}
            {new Date(syncStatusPayload.latestRun.createdAt).toLocaleString()}
            {syncStatusPayload.latestRun.dryRun ? " (dry-run)" : ""}
          </p>
        )}

        {Array.isArray(syncHistoryPayload?.runs) && syncHistoryPayload.runs.length > 0 && (
          <div className="sales-channel-history">
            <p className="sales-channel-subtitle">Recent sync runs</p>
            <ul className="sales-channel-list">
              {syncHistoryPayload.runs.map((run) => (
                <li key={run.id}>
                  {new Date(run.createdAt).toLocaleString()} - {run.status}
                  {run.dryRun ? " (dry-run)" : ""}
                  {run.errorMessage ? ` - ${run.errorMessage}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="sales-channel-card sales-channel-help">
        <h3 className="sales-channel-subtitle">Required API environment variables</h3>
        <ul className="sales-channel-list">
          <li>
            <code>UBER_EATS_CLIENT_ID</code>
          </li>
          <li>
            <code>UBER_EATS_CLIENT_SECRET</code>
          </li>
          <li>
            <code>UBER_EATS_REDIRECT_URI</code> (optional fallback)
          </li>
          <li>
            <code>UBER_EATS_OAUTH_SCOPES</code> (default: <code>eats.pos_provisioning</code>)
          </li>
        </ul>
        <p className="sales-channel-muted">
          Manager optional env: <code>NEXT_PUBLIC_MANAGER_BASE_URL</code>.
        </p>
      </section>
    </div>
  );
}
