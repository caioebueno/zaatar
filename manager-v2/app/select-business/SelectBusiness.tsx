"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { ApiError, listBusinesses } from "../lib/api";
import type { BusinessListItem } from "../lib/api";
import {
  clearManagerSession,
  getManagerToken,
  setManagerBusinesses,
  setManagerBusinessId,
} from "../lib/auth";

type Status = "loading" | "ready" | "error" | "empty";

const spinnerStyle: CSSProperties = {
  width: 18,
  height: 18,
  borderRadius: "9999px",
  boxSizing: "border-box",
  border: "2px solid rgba(255,255,255,0.15)",
  borderTopColor: "#FF5C1A",
  animation: "zspin 0.7s linear infinite",
};

const rowSpinnerStyle: CSSProperties = {
  width: 15,
  height: 15,
  borderRadius: "9999px",
  boxSizing: "border-box",
  border: "2px solid rgba(255,255,255,0.15)",
  borderTopColor: "#FF5C1A",
  animation: "zspin 0.7s linear infinite",
  flexShrink: 0,
};

export function SelectBusiness() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [items, setItems] = useState<BusinessListItem[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const loadSeq = useRef(0);

  const goToApp = (id: string, list: BusinessListItem[]) => {
    setManagerBusinesses(list.map((b) => ({ id: b.id, name: b.name })));
    setManagerBusinessId(id);
    router.push("/orders");
  };

  // No synchronous setState here: on mount the initial status is already
  // "loading", and the retry handler flips it back before re-running.
  const doLoad = () => {
    const seq = ++loadSeq.current;
    const token = getManagerToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    listBusinesses(token)
      .then((res) => {
        if (seq !== loadSeq.current) return;
        const list = res.items ?? [];
        if (list.length === 0) {
          setStatus("empty");
          return;
        }
        setManagerBusinesses(list.map((b) => ({ id: b.id, name: b.name })));
        if (list.length === 1) {
          goToApp(list[0].id, list);
          return;
        }
        setItems(list);
        setStatus("ready");
      })
      .catch((err) => {
        if (seq !== loadSeq.current) return;
        if (err instanceof ApiError && err.status === 401) {
          clearManagerSession();
          router.replace("/login");
          return;
        }
        setErrorMsg(
          err instanceof ApiError && err.status === 0
            ? "Can't reach the server. Please try again."
            : "Couldn't load your businesses. Please try again.",
        );
        setStatus("error");
      });
  };

  const retry = () => {
    setStatus("loading");
    setErrorMsg("");
    doLoad();
  };

  useEffect(() => {
    doLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (b: BusinessListItem) => {
    if (selectingId) return;
    setSelectingId(b.id);
    goToApp(b.id, items);
  };

  const signOut = () => {
    clearManagerSession();
    router.push("/login");
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        background: "#17181C",
        fontFamily: "var(--font-body)",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
          boxSizing: "border-box",
        }}
      >
        <div style={{ width: 380, display: "flex", flexDirection: "column" }}>
          {status === "loading" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "40px 0" }}>
              <span style={spinnerStyle} />
              <span style={{ fontSize: 13, color: "#B4B5BA" }}>Loading businesses…</span>
            </div>
          )}

          {status === "error" && (
            <div>
              <div style={headingStyle}>Something went wrong</div>
              <div style={{ ...subtextStyle, marginBottom: 24 }}>{errorMsg}</div>
              <button type="button" className="zp-primary-btn" onClick={retry} style={primaryBtn}>
                Try again
              </button>
              <SignOutLink onClick={signOut} />
            </div>
          )}

          {status === "empty" && (
            <div>
              <div style={headingStyle}>No businesses yet</div>
              <div style={{ ...subtextStyle, marginBottom: 24 }}>
                This account doesn&apos;t have any businesses linked to it.
              </div>
              <SignOutLink onClick={signOut} />
            </div>
          )}

          {status === "ready" && (
            <div>
              <div style={headingStyle}>Choose a business</div>
              <div style={{ ...subtextStyle, marginBottom: 24 }}>
                Select which business you want to manage.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {items.map((b) => (
                  <div
                    key={b.id}
                    className="zp-restaurant"
                    onClick={() => choose(b)}
                    style={{
                      background: "#222226",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 8,
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      cursor: selectingId ? "default" : "pointer",
                      opacity: selectingId && selectingId !== b.id ? 0.5 : 1,
                    }}
                  >
                    <BusinessLogo item={b} />
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#F1F1F2",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {b.name}
                    </div>
                    {selectingId === b.id ? (
                      <span style={rowSpinnerStyle} />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B4B5BA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
              <SignOutLink onClick={signOut} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BusinessLogo({ item }: { item: BusinessListItem }) {
  const base: CSSProperties = {
    width: 32,
    height: 32,
    borderRadius: 7,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  if (item.logoUrl) {
    return (
      <div
        style={{
          ...base,
          backgroundImage: `url(${item.logoUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
        aria-hidden
      />
    );
  }
  return (
    <div
      style={{
        ...base,
        background: "rgba(255,92,26,0.14)",
        fontFamily: "var(--font-mono)",
        fontSize: 12.5,
        fontWeight: 600,
        color: "#FF7B42",
      }}
      aria-hidden
    >
      {item.name.charAt(0).toUpperCase()}
    </div>
  );
}

function SignOutLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        marginTop: 20,
        background: "none",
        border: "none",
        padding: 0,
        color: "#75767C",
        fontSize: 12.5,
        fontFamily: "var(--font-body)",
        cursor: "pointer",
        alignSelf: "flex-start",
      }}
    >
      Sign out
    </button>
  );
}

const headingStyle: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 24,
  color: "#F1F1F2",
  marginBottom: 6,
};

const subtextStyle: CSSProperties = {
  fontSize: 13,
  color: "#B4B5BA",
  lineHeight: 1.5,
};

const primaryBtn: CSSProperties = {
  width: "100%",
  height: 42,
  background: "#FF5C1A",
  color: "#171717",
  border: "none",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "var(--font-body)",
  cursor: "pointer",
};
