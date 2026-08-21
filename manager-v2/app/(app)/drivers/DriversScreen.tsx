"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { ApiError, listDrivers } from "../../lib/api";
import type { ApiDriver } from "../../lib/api";
import { clearManagerSession, getManagerBusinessId, getManagerToken } from "../../lib/auth";
import { parsePhone } from "../../lib/phone";
import { PageHeader } from "../_components/PageHeader";

const spinner: CSSProperties = {
  width: 18,
  height: 18,
  borderRadius: "9999px",
  boxSizing: "border-box",
  border: "2px solid rgba(255,255,255,0.15)",
  borderTopColor: "#FF5C1A",
  animation: "zspin 0.7s linear infinite",
};

const GRID = "minmax(0,1.4fr) minmax(0,1fr) 88px 96px";
const HEAD: { label: string; right?: boolean }[] = [
  { label: "Driver" },
  { label: "Phone" },
  { label: "Priority", right: true },
  { label: "Status", right: true },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function phoneText(raw: string | null): string {
  if (!raw) return "—";
  const p = parsePhone(raw);
  return p ? [p.dialCode, p.formatted].filter(Boolean).join(" ") : raw;
}

export function DriversScreen() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<ApiDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reqId = useRef(0);

  const load = useCallback(() => {
    const token = getManagerToken();
    const businessId = getManagerBusinessId();
    if (!token) {
      router.replace("/login");
      return;
    }
    const my = ++reqId.current;
    setLoading(true);
    setError("");
    listDrivers(token, businessId)
      .then((res) => {
        if (my !== reqId.current) return;
        setDrivers(res);
      })
      .catch((err) => {
        if (my !== reqId.current) return;
        if (err instanceof ApiError && err.status === 401) {
          clearManagerSession();
          router.replace("/login");
          return;
        }
        setError(err instanceof ApiError && err.status === 0 ? "Can't reach the server." : "Couldn't load drivers.");
      })
      .finally(() => {
        if (my === reqId.current) setLoading(false);
      });
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const activeCount = drivers.filter((d) => d.active).length;

  return (
    <>
      <PageHeader
        title="Drivers"
        actions={
          !loading && !error ? (
            <span style={{ fontSize: 12, color: "#75767C", fontFamily: "var(--font-mono)" }}>
              {activeCount}/{drivers.length} online
            </span>
          ) : undefined
        }
      />

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: GRID, gap: 8, alignItems: "center", padding: "0 20px", height: 38, background: "#202020", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          {HEAD.map((h) => (
            <div key={h.label} style={{ fontSize: 10, fontWeight: 600, color: "#75767C", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: h.right ? "right" : "left", minWidth: 0 }}>{h.label}</div>
          ))}
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "56px 0", color: "#9B9B9B", fontSize: 12.5 }}>
              <span style={spinner} /> Loading drivers…
            </div>
          )}

          {!loading && error && (
            <div style={{ padding: "48px 0", textAlign: "center" }}>
              <div style={{ fontSize: 12.5, color: "#F87171", marginBottom: 12 }}>{error}</div>
              <button type="button" onClick={load} style={{ height: 32, padding: "0 14px", background: "#FF5C1A", border: "none", borderRadius: 6, fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 600, color: "#171717", cursor: "pointer" }}>Try again</button>
            </div>
          )}

          {!loading && !error && drivers.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", fontSize: 11.5, color: "#75767C" }}>No drivers yet.</div>
          )}

          {!loading && !error && drivers.map((d) => {
            const color = d.active ? "#22C55E" : "#8A8B90";
            return (
              <div key={d.id} className="zp-prow" style={{ display: "grid", gridTemplateColumns: GRID, gap: 8, alignItems: "center", padding: "0 20px", height: 52, borderBottom: "1px solid rgba(255,255,255,0.05)", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                  <span style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 8, background: "#2F2F2F", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 12, color: "#C7C8CC" }}>{initials(d.name)}</span>
                  <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, color: "#F1F1F1" }}>{d.name || "Unnamed driver"}</span>
                </div>
                <div style={{ fontSize: 12.5, color: "#B4B5BA", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{phoneText(d.phone)}</div>
                <div style={{ fontSize: 12.5, color: "#75767C", fontFamily: "var(--font-mono)", textAlign: "right" }}>{d.priorityLevel}</div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 8px", borderRadius: 9999, background: color + "1F", color, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                    <span style={{ width: 5, height: 5, borderRadius: 9999, background: color, flexShrink: 0 }} />
                    {d.active ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
