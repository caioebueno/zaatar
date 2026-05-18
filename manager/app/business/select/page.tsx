"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_STORAGE_KEY,
  BUSINESSES_STORAGE_KEY,
  readOwnedBusinessesSession,
  readOwnerSession,
  setSelectedBusinessIdSession,
} from "@/src/lib/auth";

type BusinessItem = {
  id: string;
  name: string;
};

function readTokenFromCookie(): string {
  if (typeof document === "undefined") return "";
  const chunk = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ACCESS_TOKEN_COOKIE_NAME}=`));

  if (!chunk) return "";
  const raw = chunk.slice(ACCESS_TOKEN_COOKIE_NAME.length + 1).trim();
  if (!raw) return "";

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default function BusinessSelectionPage() {
  const router = useRouter();
  const owner = useMemo(() => readOwnerSession(), []);
  const [businesses, setBusinesses] = useState<BusinessItem[]>(() => readOwnedBusinessesSession());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const apiBaseUrl = useMemo(
    () => (process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:4000").replace(/\/+$/, ""),
    [],
  );

  useEffect(() => {
    async function loadBusinesses() {
      setError(null);

      const accessToken =
        localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)?.trim() || readTokenFromCookie() || "";

      if (!accessToken) {
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/businesses`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        });

        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
          items?: Array<{ id?: unknown; name?: unknown }>;
        };

        if (!response.ok) {
          setError(payload.error ?? `Could not load businesses (${response.status})`);
          setLoading(false);
          return;
        }

        const parsed = Array.isArray(payload.items)
          ? payload.items
              .map((item) => {
                if (!item || typeof item !== "object") return null;
                const record = item as Record<string, unknown>;
                if (typeof record.id !== "string" || typeof record.name !== "string") {
                  return null;
                }
                const id = record.id.trim();
                const name = record.name.trim();
                if (!id || !name) return null;
                return { id, name } satisfies BusinessItem;
              })
              .filter((item): item is BusinessItem => item !== null)
          : [];

        setBusinesses(parsed);
        localStorage.setItem(BUSINESSES_STORAGE_KEY, JSON.stringify(parsed));

        if (parsed.length === 0) {
          setSelectedBusinessIdSession(null);
          router.replace("/onboarding");
          return;
        }
      } catch {
        setError("Could not reach API server.");
      } finally {
        setLoading(false);
      }
    }

    void loadBusinesses();
  }, [apiBaseUrl, router]);

  function onSelectBusiness(businessId: string) {
    setSelectingId(businessId);
    setSelectedBusinessIdSession(businessId);
    router.replace("/");
  }

  return (
    <main className="auth-shell">
      <section className="auth-card business-select-card">
        <h1 className="auth-title">Choose Business</h1>
        <p className="auth-subtitle">
          {owner ? `Select a business to continue, ${owner.name}.` : "Select a business to continue."}
        </p>

        {loading ? <p className="auth-footnote">Loading businesses...</p> : null}

        {!loading && error ? <p className="form-message form-message-error">{error}</p> : null}

        {!loading && !error ? (
          <div className="business-select-list">
            {businesses.map((business) => (
              <button
                key={business.id}
                type="button"
                className="business-select-option"
                onClick={() => onSelectBusiness(business.id)}
                disabled={Boolean(selectingId)}
              >
                <span className="business-select-logo" aria-hidden>
                  {business.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="business-select-copy">
                  <span className="business-select-name">{business.name}</span>
                  <span className="business-select-meta">Open dashboard</span>
                </span>
                <span className="business-select-arrow" aria-hidden>
                  {selectingId === business.id ? "..." : "→"}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
