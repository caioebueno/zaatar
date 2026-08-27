"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { listBusinesses } from "../../lib/api";
import type { OwnerBusiness } from "../../lib/api";
import { Menu, MenuItem } from "./Menu";
import {
  clearManagerSession,
  getManagerBusinesses,
  getManagerBusinessId,
  getManagerToken,
  setManagerBusinesses,
  setManagerBusinessId,
} from "../../lib/auth";

type NavId = "orders" | "products" | "stock" | "drivers" | "analytics" | "integrations";

type NavItem = { id: NavId; label: string; href: string; key: string };

const NAV_ITEMS: NavItem[] = [
  { id: "orders", label: "Orders", href: "/orders", key: "1" },
  { id: "products", label: "Products", href: "/products", key: "2" },
  { id: "stock", label: "Stock", href: "/stock", key: "3" },
  { id: "drivers", label: "Drivers", href: "/drivers", key: "4" },
  { id: "analytics", label: "Analytics", href: "/analytics", key: "5" },
  { id: "integrations", label: "Integrations", href: "/integrations", key: "6" },
];

function NavIcon({ id }: { id: NavId }): ReactNode {
  switch (id) {
    case "orders":
      return (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path d="M2 5l6-3 6 3-6 3-6-3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M2 5v6l6 3 6-3V5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M8 8v6" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
    case "products":
      return (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2.5" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M2 6h12M6.5 6v7.5" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
    case "stock":
      return (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path d="M2 4.2l6-2.4 6 2.4-6 2.4-6-2.4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M2 4.2v7.6l6 2.4 6-2.4V4.2M8 6.6V14" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      );
    case "drivers":
      return (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path d="M1.5 4.5h7v6h-7v-6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M8.5 7h3l2 2.2v1.3h-5V7z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <circle cx="4.5" cy="12" r="1.4" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="11" cy="12" r="1.4" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
    case "analytics":
      return (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path d="M3 13V8M8 13V3M13 13v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "integrations":
      return (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="12" height="12" rx="2.6" stroke="currentColor" strokeWidth="1.4" />
          <rect x="5.6" y="5.6" width="4.8" height="4.8" rx="1" fill="currentColor" />
        </svg>
      );
  }
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [businesses, setBusinesses] = useState<OwnerBusiness[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Load the session on mount. localStorage is client-only, so this must run
  // after hydration (reading it during render would mismatch the SSR output).
  // First show whatever login cached (instant), then reconcile against the
  // authoritative GET /businesses so names are always correct.
  useEffect(() => {
    const stored = getManagerBusinesses();
    /* eslint-disable react-hooks/set-state-in-effect */
    setBusinesses(stored);
    setCurrentId(getManagerBusinessId() ?? stored[0]?.id ?? null);
    /* eslint-enable react-hooks/set-state-in-effect */

    const token = getManagerToken();
    if (!token) return;
    let cancelled = false;
    listBusinesses(token)
      .then((res) => {
        if (cancelled) return;
        const list = res.items.map((b) => ({ id: b.id, name: b.name }));
        setManagerBusinesses(list);
        setBusinesses(list);
        setCurrentId((prev) => prev ?? res.selectedBusinessId ?? list[0]?.id ?? null);
      })
      .catch(() => {
        // Keep the cached list on failure.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Keyboard shortcuts 1–4 for nav (ignore while typing / with modifiers).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) return;
      const item = NAV_ITEMS.find((n) => n.key === e.key);
      if (item) {
        e.preventDefault();
        router.push(item.href);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router]);

  const current = businesses.find((b) => b.id === currentId) ?? null;
  const businessName = current?.name ?? "No business";
  const businessInitial = businessName.charAt(0).toUpperCase();

  const selectBusiness = (b: OwnerBusiness) => {
    setManagerBusinessId(b.id);
    setCurrentId(b.id);
    // Refresh business-scoped data for the current route.
    router.refresh();
  };

  const signOut = () => {
    clearManagerSession();
    router.push("/login");
  };

  return (
    <div
      style={{
        width: 208,
        flexShrink: 0,
        background: "#202020",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        height: "100vh",
      }}
    >
      {/* Business picker */}
      <div style={{ padding: "14px 10px 10px" }}>
        <Menu
          align="start"
          sideOffset={-2}
          contentStyle={{ width: "var(--radix-dropdown-menu-trigger-width)", padding: 4 }}
          trigger={
            <button type="button" className="zp-picker">
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: "rgba(255,92,26,0.14)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: "#FF7B42",
                }}
              >
                {businessInitial}
              </span>
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: "#F1F1F1",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {businessName}
              </span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ flexShrink: 0 }}>
                <path d="M1 1l4 4 4-4" stroke="#75767C" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
          }
        >
          {businesses.map((b) => {
            const active = b.id === currentId;
            return (
              <MenuItem
                key={b.id}
                onSelect={() => selectBusiness(b)}
                style={{ height: 32, padding: "0 9px", fontSize: 11.5, color: active ? "#F1F1F1" : "#9A9BA1" }}
              >
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {b.name}
                </span>
                {active && (
                  <svg width="11" height="9" viewBox="0 0 11 9" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M1 4.6L4 7.6L10 1.4" stroke="#FF5C1A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </MenuItem>
            );
          })}
        </Menu>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: "4px 10px", display: "flex", flexDirection: "column", gap: 1 }}>
        {NAV_ITEMS.map((n) => {
          const active = pathname === n.href || pathname.startsWith(n.href + "/");
          return (
            <button
              key={n.id}
              type="button"
              className="zp-nav-item"
              data-active={active}
              onClick={() => {
                if (!active) router.push(n.href);
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  flexShrink: 0,
                  color: active ? "#FF5C1A" : "#56575C",
                }}
              >
                <NavIcon id={n.id} />
              </span>
              <span>{n.label}</span>
              <span className="zp-key">{n.key}</span>
            </button>
          );
        })}
      </div>

      {/* Sign out */}
      <div style={{ padding: "8px 10px 12px", display: "flex", flexDirection: "column", gap: 1 }}>
        <button type="button" className="zp-nav-item" onClick={signOut}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 16,
              height: 16,
              flexShrink: 0,
              color: "#56575C",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M6 2H3.5A1.5 1.5 0 002 3.5v8A1.5 1.5 0 003.5 13H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M9.5 10.5L13 7.5L9.5 4.5M12.5 7.5H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}
