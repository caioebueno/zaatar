"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_STORAGE_KEY,
  BUSINESSES_STORAGE_KEY,
  clearAuthSession,
  readOwnedBusinessesSession,
  readOwnerSession,
  readSelectedBusinessIdSession,
  setSelectedBusinessIdSession,
} from "@/src/lib/auth";

type ManagerShellProps = { children: ReactNode };

// ── design tokens ─────────────────────────────────────────────────────────────

const SB = {
  bg: "#fffdf9",
  bgHover: "rgba(22,18,15,0.04)",
  bgActive: "rgba(255,61,20,0.08)",
  border: "rgba(22,18,15,0.08)",
  orange: "#ff3d14",
  ink: "#16120f",
  muted: "rgba(22,18,15,0.36)",
  mutedHover: "rgba(22,18,15,0.62)",
  green: "#00a866",
  divider: "rgba(22,18,15,0.07)",
  popBg: "#fffdf9",
  popBorder: "rgba(22,18,15,0.10)",
  popShadow: "0 8px 32px rgba(22,18,15,0.12), 0 0 0 1px rgba(22,18,15,0.07)",
} as const;

// ── category palette ───────────────────────────────────────────────────────────

const CAT = {
  intelligence: {
    color: "oklch(0.50 0.17 258)",
    bg: "oklch(0.50 0.17 258 / 0.07)",
  },
  operations: {
    color: "oklch(0.50 0.17 34)",
    bg: "oklch(0.50 0.17 34 / 0.07)",
  },
  logistics: {
    color: "oklch(0.50 0.17 160)",
    bg: "oklch(0.50 0.17 160 / 0.07)",
  },
} as const;

// ── helpers ───────────────────────────────────────────────────────────────────

function getBizAvatar(name: string) {
  const words = name.trim().split(/\s+/);
  const initials = words.length >= 2
    ? ((words[0]![0] ?? "") + (words[1]![0] ?? "")).toUpperCase()
    : name.slice(0, 2).toUpperCase();
  const palette = ["#c96442", "#2a6fbd", "#7c5cbf", "#1a8a4a", "#b5571e"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h * 31) + name.charCodeAt(i)) | 0;
  return { initials, color: palette[Math.abs(h) % palette.length] ?? "#888" };
}

// ── Box Icons ─────────────────────────────────────────────────────────────────

import {
  BiBarChartAlt2,
  BiSolidReport,
  BiFoodMenu,
  BiStore,
  BiFlag,
  BiCog,
  BiReceipt,
  BiUser,
  BiChevronDown,
  BiCheck,
  BiPlus,
  BiLogOut,
} from "react-icons/bi";

const biProps = { size: 14 } as const;

const IAnalytics    = () => <BiBarChartAlt2 {...biProps} />;
const IFeedback     = () => <BiSolidReport  {...biProps} />;
const IMenu         = () => <BiFoodMenu     {...biProps} />;
const ISalesChannels = () => <BiStore       {...biProps} />;
const IOnboarding   = () => <BiFlag         {...biProps} />;
const ISettings     = () => <BiCog          {...biProps} />;
const IOrders       = () => <BiReceipt      {...biProps} />;
const IDrivers      = () => <BiUser         {...biProps} />;

const IChevDown = ({ open }: { open?: boolean }) => (
  <div style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "flex", flexShrink: 0 }}>
    <BiChevronDown size={14} />
  </div>
);

const ICheckOrange = () => <BiCheck size={13} color={SB.orange} style={{ strokeWidth: 1 }} />;
const IPlus        = () => <BiPlus  size={14} color={SB.muted} />;
const ILogout      = () => <BiLogOut size={14} color="#d43a2c" />;

// ── nav config ────────────────────────────────────────────────────────────────

type NavChild  = { href: string; label: string; exact?: boolean };
type NavLink   = { type: "link";   href: string; label: string; icon: ReactNode; exact?: boolean };
type NavExpand = { type: "expand"; key: string;  label: string; icon: ReactNode; children: NavChild[] };
type NavItem   = NavLink | NavExpand;
type NavGroup  = { label: string; cat: keyof typeof CAT; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Intelligence",
    cat: "intelligence",
    items: [
      { type: "link", href: "/analytics",  label: "Analytics", icon: <IAnalytics /> },
      { type: "link", href: "/feedback",   label: "Feedback",  icon: <IFeedback />  },
    ],
  },
  {
    label: "Operations",
    cat: "operations",
    items: [
      {
        type: "link", href: '/menu/products', label: "Menu", icon: <IMenu />,

      },
      // {
      //   type: "expand", key: "sales", label: "Sales Channels", icon: <ISalesChannels />,
      //   children: [
      //     { href: "/sales-channels",            label: "Overview",  exact: true },
      //     { href: "/sales-channels/uber-eats",  label: "Uber Eats" },
      //   ],
      // },
      // { type: "link", href: "/onboarding",          label: "Onboarding", icon: <IOnboarding /> },
      // { type: "link", href: "/settings/order-link", label: "Settings",   icon: <ISettings />   },
    ],
  },
  {
    label: "Logistics",
    cat: "logistics",
    items: [
      { type: "link", href: "/orders", label: "Orders", icon: <IOrders /> },
      { type: "link", href: "/drivers", label: "Drivers", icon: <IDrivers /> },
    ],
  },
];

function matchActive(pathname: string, href: string, exact?: boolean): boolean {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
}

// ── nav primitives ────────────────────────────────────────────────────────────

function GroupHeader({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "14px 16px 5px" }}>
      <div style={{
        width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
        background: color,
        boxShadow: `0 0 0 2px color-mix(in srgb, ${color} 15%, transparent)`,
      }} />
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: 9.5, fontWeight: 500,
        letterSpacing: "0.1em", textTransform: "uppercase",
        color: SB.muted, userSelect: "none",
      } as CSSProperties}>
        {label}
      </span>
    </div>
  );
}

function SbNavLink({ href, active, icon, children, badge, groupColor = SB.orange, groupBg = SB.bgActive }: {
  href: string; active: boolean; icon: ReactNode; children: ReactNode;
  badge?: number; groupColor?: string; groupBg?: string;
}) {
  return (
    <Link
      href={href}
      className={`sb-link${active ? " sb-active" : ""}`}
      style={{ "--sb-active-bg": groupBg } as CSSProperties}
    >
      <div style={{ width: 22, height: 22, flexShrink: 0, color: SB.bg, background: groupColor, borderRadius: 6, display: "grid", placeItems: "center" }}>
        {icon}
      </div>
      <span style={{ fontWeight: active ? 600 : 450, fontSize: 13, letterSpacing: "-0.01em", color: active ? SB.ink : SB.mutedHover, flex: 1 }}>
        {children}
      </span>
      {badge != null && badge > 0 && (
        <span style={{ background: groupColor, color: "#fff", borderRadius: 4, fontWeight: 600, fontSize: 9.5, padding: "1.5px 5px", flexShrink: 0, letterSpacing: "0.02em" }}>
          {badge}
        </span>
      )}
    </Link>
  );
}

function SbSubLink({ href, active, children, groupColor = SB.orange, groupBg = SB.bgActive }: {
  href: string; active: boolean; children: ReactNode; groupColor?: string; groupBg?: string;
}) {
  return (
    <Link
      href={href}
      className={`sb-sub-link${active ? " sb-active" : ""}`}
      style={{ "--sb-active-bg": groupBg } as CSSProperties}
    >
      <div style={{
        width: 5, height: 5, borderRadius: 1.5, flexShrink: 0,
        background: active ? groupColor : "rgba(22,18,15,0.14)",
        transition: "background 0.15s",
      }} />
      <span style={{ fontWeight: active ? 580 : 400, fontSize: 12.5, letterSpacing: "-0.01em", color: active ? SB.ink : SB.muted, flex: 1 }}>
        {children}
      </span>
    </Link>
  );
}

function SbExpandButton({ anyActive, icon, children, expanded, onToggle, groupColor = SB.orange }: {
  anyActive: boolean; icon: ReactNode; children: ReactNode;
  expanded: boolean; onToggle: () => void; groupColor?: string;
}) {
  return (
    <button type="button" className="sb-link" onClick={onToggle}>
      <div style={{ width: 22, height: 22, flexShrink: 0, color: SB.bg, background: groupColor, borderRadius: 6, display: "grid", placeItems: "center" }}>
        {icon}
      </div>
      <span style={{ fontWeight: anyActive ? 600 : 450, fontSize: 13, letterSpacing: "-0.01em", color: anyActive ? SB.ink : SB.mutedHover, flex: 1 }}>
        {children}
      </span>
      <div style={{ color: anyActive ? SB.mutedHover : SB.muted }}>
        <IChevDown open={expanded} />
      </div>
    </button>
  );
}

// ── shell ─────────────────────────────────────────────────────────────────────

export default function ManagerShell({ children }: ManagerShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const owner = useMemo(() => readOwnerSession(), []);
  const [ownedBusinesses, setOwnedBusinesses] = useState(() => readOwnedBusinessesSession());
  const [selectedBusinessId, setSelectedBusinessId] = useState(
    () => readSelectedBusinessIdSession() ?? readOwnedBusinessesSession()[0]?.id ?? "",
  );
  const [businessMenuOpen, setBusinessMenuOpen] = useState(false);
  const businessMenuRef = useRef<HTMLDivElement | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const group of NAV_GROUPS)
      for (const item of group.items)
        if (item.type === "expand")
          init[item.key] = item.children.some((c) => matchActive(pathname, c.href, c.exact));
    return init;
  });

  const selectedBusiness = useMemo(
    () => ownedBusinesses.find((b) => b.id === selectedBusinessId) ?? null,
    [ownedBusinesses, selectedBusinessId],
  );
  const bizAvatar = useMemo(
    () => selectedBusiness ? getBizAvatar(selectedBusiness.name) : { initials: "—", color: "#888" },
    [selectedBusiness],
  );
  const apiBaseUrl = useMemo(
    () => (process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:4000").replace(/\/+$/, ""),
    [],
  );

  useEffect(() => {
    if (!businessMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (businessMenuRef.current && !businessMenuRef.current.contains(e.target as Node)) setBusinessMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setBusinessMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [businessMenuOpen]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setUserMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [userMenuOpen]);

  useEffect(() => {
    if (!selectedBusinessId && ownedBusinesses[0]?.id) setSelectedBusinessId(ownedBusinesses[0].id);
  }, [ownedBusinesses, selectedBusinessId]);

  useEffect(() => {
    setSelectedBusinessIdSession(selectedBusinessId || null);
  }, [selectedBusinessId]);

  useEffect(() => {
    async function loadBusinessesIfMissing() {
      if (ownedBusinesses.length > 0) return;
      const tokenFromCookie = document.cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${ACCESS_TOKEN_COOKIE_NAME}=`))
        ?.split("=").slice(1).join("=").trim();
      const accessToken =
        localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)?.trim() ||
        (tokenFromCookie ? decodeURIComponent(tokenFromCookie) : "") || "";
      if (!accessToken) return;
      try {
        const res = await fetch(`${apiBaseUrl}/businesses`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        });
        if (!res.ok) return;
        const payload = (await res.json().catch(() => ({}))) as {
          items?: Array<{ id?: unknown; name?: unknown }>;
          selectedBusinessId?: unknown;
        };
        const businesses = Array.isArray(payload.items)
          ? payload.items
              .map((item) => {
                if (!item || typeof item !== "object") return null;
                const r = item as Record<string, unknown>;
                if (typeof r.id !== "string" || typeof r.name !== "string") return null;
                const id = r.id.trim(); const name = r.name.trim();
                if (!id || !name) return null;
                return { id, name };
              })
              .filter((item): item is { id: string; name: string } => item !== null)
          : [];
        if (businesses.length === 0) return;
        setOwnedBusinesses(businesses);
        localStorage.setItem(BUSINESSES_STORAGE_KEY, JSON.stringify(businesses));
        if (!selectedBusinessId) {
          const sel = typeof payload.selectedBusinessId === "string" ? payload.selectedBusinessId.trim() : "";
          setSelectedBusinessId(sel || businesses[0]!.id);
        }
      } catch { /* ignore */ }
    }
    void loadBusinessesIfMissing();
  }, [apiBaseUrl, ownedBusinesses.length, selectedBusinessId]);

  function onLogout() { clearAuthSession(); router.replace("/login"); }

  function onBusinessChange(nextId: string) {
    if (nextId === selectedBusinessId) { setBusinessMenuOpen(false); return; }
    setSelectedBusinessId(nextId);
    setBusinessMenuOpen(false);
    router.refresh();
  }

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="manager-shell">
      <aside className="manager-sidebar" style={{ padding: 0, background: SB.bg, gap: 0 }}>

        {/* ── Business selector ─────────────────────────────────────────────── */}
        <div style={{ position: "relative", padding: "10px 10px 0" }} ref={businessMenuRef}>
          <button
            type="button"
            className="sb-biz-btn"
            onClick={() => setBusinessMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={businessMenuOpen}
            style={{
              width: "100%", background: businessMenuOpen ? SB.bgHover : "transparent",
              border: `1px solid ${businessMenuOpen ? SB.border : "transparent"}`,
              borderRadius: 10, padding: "7px 9px",
              display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: Math.round(28 * 0.28),
              background: bizAvatar.color, flexShrink: 0,
              display: "grid", placeItems: "center",
              fontWeight: 700, fontSize: 10, color: "#fff", letterSpacing: "-0.03em",
            }}>
              {bizAvatar.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: SB.ink, letterSpacing: "-0.015em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {selectedBusiness?.name ?? "—"}
              </div>
            </div>
            <div style={{ transform: businessMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0, color: businessMenuOpen ? SB.ink : SB.muted }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6l4 4 4-4"/>
              </svg>
            </div>
          </button>

          {businessMenuOpen && (
            <div role="menu" aria-label="Businesses" style={{
              position: "absolute", top: "calc(100% + 4px)", left: 10, right: 10, zIndex: 100,
              background: SB.popBg, borderRadius: 12, border: `1px solid ${SB.popBorder}`,
              boxShadow: SB.popShadow, overflow: "hidden",
            }}>
              <div style={{ padding: "6px 6px 0" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, color: SB.muted, letterSpacing: "0.12em", textTransform: "uppercase", padding: "4px 8px 6px" }}>
                  Businesses
                </div>
                {ownedBusinesses.map((biz) => {
                  const av = getBizAvatar(biz.name);
                  const isSel = biz.id === selectedBusinessId;
                  return (
                    <button
                      key={biz.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={isSel}
                      onClick={() => onBusinessChange(biz.id)}
                      className={`sb-biz-opt${isSel ? " sb-selected" : ""}`}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 10,
                        padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                        background: isSel ? "rgba(22,18,15,0.05)" : "transparent",
                        border: "none", textAlign: "left", transition: "background 0.12s",
                      }}
                    >
                      <div style={{ width: 26, height: 26, borderRadius: 7, background: av.color, flexShrink: 0, display: "grid", placeItems: "center", fontWeight: 700, fontSize: 10, color: "#fff" }}>
                        {av.initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 12.5, color: SB.ink, letterSpacing: "-0.01em" }}>{biz.name}</div>
                      </div>
                      {isSel && <ICheckOrange />}
                    </button>
                  );
                })}
              </div>
              <div style={{ height: 1, background: SB.divider, margin: "6px 0" }} />
              <div className="sb-create-biz" style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 16px 12px", cursor: "pointer" }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, border: `1px dashed rgba(22,18,15,0.18)`, display: "grid", placeItems: "center" }}>
                  <IPlus />
                </div>
                <span style={{ fontWeight: 500, fontSize: 12.5, color: SB.muted }}>Add business</span>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: SB.divider, margin: "8px 0" }} />

        {/* ── Nav ─────────────────────────────────────────────────────────────── */}
        <nav style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }} aria-label="Main">
          {NAV_GROUPS.map((group) => {
            const { color, bg } = CAT[group.cat];
            return (
              <div key={group.label}>
                <GroupHeader label={group.label} color={color} />
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {group.items.map((item) => {
                    if (item.type === "link") {
                      return (
                        <SbNavLink key={item.href} href={item.href}
                          active={matchActive(pathname, item.href, item.exact)}
                          icon={item.icon} groupColor={color} groupBg={bg}>
                          {item.label}
                        </SbNavLink>
                      );
                    }
                    const isOpen = !!expanded[item.key];
                    const anyActive = item.children.some((c) => matchActive(pathname, c.href, c.exact));
                    return (
                      <div key={item.key}>
                        <SbExpandButton anyActive={anyActive} icon={item.icon}
                          expanded={isOpen} onToggle={() => toggle(item.key)}
                          groupColor={color}>
                          {item.label}
                        </SbExpandButton>
                        {isOpen && (
                          <div style={{ paddingLeft: 14, marginTop: 2, marginBottom: 2 }}>
                            {item.children.map((child) => (
                              <SbSubLink key={child.href} href={child.href}
                                active={matchActive(pathname, child.href, child.exact)}
                                groupColor={color} groupBg={bg}>
                                {child.label}
                              </SbSubLink>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Divider */}
        <div style={{ height: 1, background: SB.divider, margin: "4px 10px 6px" }} />

        {/* ── User section ─────────────────────────────────────────────────── */}
        <div style={{ position: "relative", padding: "0 10px 10px" }} ref={userMenuRef}>
          <button
            type="button"
            className="sb-user-btn"
            onClick={() => setUserMenuOpen((v) => !v)}
            style={{
              width: "100%", background: userMenuOpen ? SB.bgHover : "transparent",
              border: `1px solid ${userMenuOpen ? SB.border : "transparent"}`,
              borderRadius: 10, padding: "7px 9px",
              display: "flex", alignItems: "center", gap: 9, cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: "#2a231e", flexShrink: 0,
              display: "grid", placeItems: "center",
              fontWeight: 700, fontSize: 12, color: "#e8dfd5",
            }}>
              {(owner?.name ?? "O").slice(0, 1).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
              <div style={{ fontWeight: 600, fontSize: 12.5, color: SB.ink, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {owner?.name ?? "Owner"}
              </div>
              <div style={{ fontSize: 11, color: SB.muted, marginTop: 0.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {owner?.email ?? ""}
              </div>
            </div>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: SB.green, flexShrink: 0, boxShadow: `0 0 0 1.5px ${SB.bg}` }} />
          </button>

          {/* User popup — opens upward */}
          {userMenuOpen && (
            <div style={{
              position: "absolute", bottom: "calc(100% + 6px)", left: 10, right: 10, zIndex: 100,
              background: SB.popBg, borderRadius: 12, border: `1px solid ${SB.popBorder}`,
              boxShadow: SB.popShadow, overflow: "hidden", padding: 6,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px 10px" }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "#2a231e", flexShrink: 0, display: "grid", placeItems: "center", fontWeight: 700, fontSize: 13, color: "#e8dfd5" }}>
                  {(owner?.name ?? "O").slice(0, 1).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: SB.ink }}>{owner?.name ?? "Owner"}</div>
                  <div style={{ fontSize: 11, color: SB.muted, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{owner?.email ?? ""}</div>
                </div>
              </div>

              <div style={{ height: 1, background: SB.divider, margin: "0 0 4px" }} />

              {[
                { label: "Profile & preferences" },
                { label: "Keyboard shortcuts" },
                { label: "Help & support" },
              ].map(({ label }) => (
                <div key={label} className="sb-menu-opt" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", cursor: "pointer" }}>
                  <span style={{ fontSize: 13, color: SB.mutedHover, letterSpacing: "-0.01em" }}>{label}</span>
                </div>
              ))}

              <div style={{ height: 1, background: SB.divider, margin: "4px 0" }} />

              <div className="sb-logout-opt" onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", cursor: "pointer" }}>
                <ILogout />
                <span style={{ fontSize: 13, color: "#d43a2c", letterSpacing: "-0.01em", fontWeight: 500 }}>Log out</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      <section className="">{children}</section>
    </div>
  );
}
