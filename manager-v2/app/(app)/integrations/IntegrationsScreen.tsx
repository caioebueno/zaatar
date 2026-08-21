"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Select } from "../_components/Select";
import {
  ApiError, disconnectSquare, getSquareConnection, getSquareOAuthUrl, squareOAuthRedirectUri, syncSquareMenus,
} from "../../lib/api";
import type { SquareConnection, SquareLocation } from "../../lib/api";
import { getManagerBusinessId, getManagerToken } from "../../lib/auth";

const SCOPES = ["Read orders and payments", "Read and update item catalog", "Read location details"];
const STATE_KEY = "square_oauth_state";

type Status = "loading" | "disconnected" | "connected";

const ghostBtn: CSSProperties = { height: 30, padding: "0 12px", background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12.5, color: "#C7C8CC" };
const primaryBtn: CSSProperties = { height: 30, padding: "0 14px", background: "#FF5C1A", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, color: "#171717" };
const kicker: CSSProperties = { fontSize: 11, color: "#75767C" };
const monoVal: CSSProperties = { fontFamily: "var(--font-mono)", fontSize: 12, color: "#E8E8E8" };

function relTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  return new Date(iso).toLocaleDateString();
}

function randomState(): string {
  const c = typeof crypto !== "undefined" ? crypto : undefined;
  return c?.randomUUID ? c.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function SquareGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="2.2" y="2.2" width="15.6" height="15.6" rx="3.4" stroke="#F1F1F1" strokeWidth="1.7" />
      <rect x="7.1" y="7.1" width="5.8" height="5.8" rx="1.2" fill="#F1F1F1" />
    </svg>
  );
}

export function IntegrationsScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [connection, setConnection] = useState<SquareConnection | null>(null);
  const [locations, setLocations] = useState<SquareLocation[]>([]);
  const [location, setLocation] = useState("");
  const [authorizing, setAuthorizing] = useState(false);
  const [pending, setPending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState("—");
  const [error, setError] = useState("");
  const connected = status === "connected";

  // Load the real Square connection status on mount.
  useEffect(() => {
    const token = getManagerToken();
    if (!token) return;
    const businessId = getManagerBusinessId();
    let alive = true;
    getSquareConnection(token, businessId)
      .then((res) => {
        if (!alive) return;
        setStatus(res.connected ? "connected" : "disconnected");
        setConnection(res.connection);
        setLocations(res.locations);
        setLocation(res.locations[0]?.name ?? res.locations[0]?.id ?? "");
        setLastSync(relTime(res.connection?.updatedAt));
      })
      .catch(() => { if (alive) setStatus("disconnected"); });
    return () => { alive = false; };
  }, []);

  // Redirect the browser to Square's consent page. The API completes the token
  // exchange when Square redirects back to the configured redirect URI.
  const beginConnect = async () => {
    const token = getManagerToken();
    if (!token) { router.replace("/login"); return; }
    const businessId = getManagerBusinessId();
    setPending(true);
    setError("");
    const state = randomState();
    try {
      sessionStorage.setItem(STATE_KEY, state);
    } catch { /* ignore */ }
    try {
      const { authorizationUrl } = await getSquareOAuthUrl(token, squareOAuthRedirectUri(), state, businessId);
      if (!authorizationUrl) throw new ApiError(0, { error: "No authorization URL returned" });
      console.log("[square] redirect_uri:", squareOAuthRedirectUri());
      console.log("[square] authorizationUrl:", authorizationUrl);
      window.location.href = authorizationUrl;
    } catch (e) {
      console.error("[square] oauth url error", e);
      setPending(false);
      setError(
        e instanceof ApiError
          ? e.status === 0
            ? "Can't reach the API. Check NEXT_PUBLIC_API_BASE_URL."
            : `Square authorization failed (${e.status}): ${e.reason || e.message}`
          : "Couldn't start Square authorization. Try again.",
      );
    }
  };

  const disconnect = async () => {
    const token = getManagerToken();
    if (!token) return;
    const businessId = getManagerBusinessId();
    setError("");
    try {
      await disconnectSquare(token, businessId);
      setStatus("disconnected");
      setConnection(null);
      setLocations([]);
    } catch {
      setError("Couldn't disconnect Square.");
    }
  };

  const syncNow = async () => {
    const token = getManagerToken();
    if (!token) return;
    const businessId = getManagerBusinessId();
    setSyncing(true);
    setError("");
    try {
      await syncSquareMenus(token, businessId);
      setLastSync("just now");
    } catch {
      setError("Sync failed. Try again.");
    } finally {
      setSyncing(false);
    }
  };

  const pill = connected
    ? { bg: "rgba(255,214,0,0.12)", fg: "#FFD600", dot: "#FFD600", label: "Connected" }
    : status === "loading"
      ? { bg: "rgba(255,255,255,0.06)", fg: "#9B9B9B", dot: "#5B5C61", label: "Checking…" }
      : { bg: "rgba(255,255,255,0.06)", fg: "#9B9B9B", dot: "#5B5C61", label: "Not connected" };

  const locationOptions = locations.map((l) => l.name ?? l.id);

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 20px", height: 56, borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "#F1F1F1", letterSpacing: "-0.2px" }}>Integrations</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11.5, color: "#75767C" }}>{connected ? "1 of 1 connected" : "0 of 1 connected"}</span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "auto", padding: "22px 20px 64px" }}>
        <div style={{ maxWidth: 680, display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 12.5, color: "#9B9B9B", lineHeight: 1.5, maxWidth: 520 }}>
            Connect the systems this branch already runs on. Orders and menu items stay in sync automatically.
          </div>

          {error && <div style={{ fontSize: 12, color: "#F08A6C" }}>{error}</div>}

          {/* Square card */}
          <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, background: "#212121", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: 16 }}>
              <span style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 8, background: "#2F2F2F", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <SquareGlyph size={20} />
              </span>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, color: "#F1F1F1" }}>Square</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 19, padding: "0 8px", borderRadius: 9999, fontSize: 10.5, fontWeight: 500, background: pill.bg, color: pill.fg }}>
                    <span style={{ width: 5, height: 5, borderRadius: 9999, background: pill.dot }} />
                    <span>{pill.label}</span>
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#9B9B9B", lineHeight: 1.5, maxWidth: 400 }}>
                  Point of sale. Pulls in-store orders into the Zappy queue and keeps your item catalog and prices matched.
                </div>
              </div>
              <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
                {connected ? (
                  <button type="button" className="zp-ghost" onClick={disconnect} style={ghostBtn}>Disconnect</button>
                ) : (
                  <button type="button" className="zp-primary" onClick={() => setAuthorizing(true)} disabled={status === "loading"} style={{ ...primaryBtn, opacity: status === "loading" ? 0.6 : 1 }}>Connect</button>
                )}
              </div>
            </div>

            {connected && (
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={kicker}>Merchant</span>
                    <span style={monoVal}>{connection?.merchantId ?? "—"}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={kicker}>Last sync</span>
                    <span style={monoVal}>{lastSync}</span>
                  </div>
                  <span style={{ flex: 1 }} />
                  <button type="button" className="zp-ghost" onClick={syncNow} disabled={syncing} style={{ ...ghostBtn, height: 28, padding: "0 11px", fontSize: 12 }}>
                    {syncing ? "Syncing…" : "Sync now"}
                  </button>
                </div>

                {locationOptions.length > 0 && (
                  <label style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 280 }}>
                    <span style={{ fontSize: 11.5, color: "#9B9B9B" }}>Square location</span>
                    <Select
                      value={location}
                      onValueChange={setLocation}
                      ariaLabel="Square location"
                      options={locationOptions.map((l) => ({ value: l, label: l }))}
                      triggerStyle={{ height: 32, background: "#252525", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, fontSize: 12.5, color: "#E8E8E8", padding: "0 8px", width: "100%" }}
                    />
                  </label>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Authorize modal */}
      {authorizing && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ width: 404, maxWidth: "100%", background: "#252525", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 18px 0" }}>
              <span style={{ width: 32, height: 32, borderRadius: 7, background: "#2F2F2F", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <SquareGlyph size={17} />
              </span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14.5, color: "#F1F1F1" }}>Connect Square</span>
            </div>
            <div style={{ padding: "12px 18px 4px", fontSize: 12, color: "#9B9B9B", lineHeight: 1.5 }}>You&apos;ll be taken to Square to authorize access to:</div>
            <div style={{ padding: "4px 18px 0", display: "flex", flexDirection: "column", gap: 8 }}>
              {SCOPES.map((s) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M1 5.2L4.2 8.4L11 1.4" stroke="#FF5C1A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: 12.5, color: "#E8E8E8" }}>{s}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 18, marginTop: 8 }}>
              <span style={{ flex: 1, fontSize: 11, color: "#5B5C61" }}>You can disconnect at any time.</span>
              <button type="button" className="zp-ghost" onClick={() => { setAuthorizing(false); setPending(false); }} disabled={pending} style={ghostBtn}>Cancel</button>
              <button type="button" className="zp-primary" onClick={beginConnect} disabled={pending} style={primaryBtn}>{pending ? "Redirecting…" : "Continue to Square"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
