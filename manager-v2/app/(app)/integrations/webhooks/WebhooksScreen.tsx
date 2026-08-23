"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, getSquareWebhookRun, listSquareWebhookRuns } from "../../../lib/api";
import type { SquareWebhookRun, SquareWebhookRunDetail, SquareWebhookRunStatus } from "../../../lib/api";
import { clearManagerSession, getManagerBusinessId, getManagerToken } from "../../../lib/auth";

type TabId = "all" | "SUCCESS" | "FAILED" | "SKIPPED";

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "SUCCESS", label: "Order created" },
  { id: "FAILED", label: "Failed" },
  { id: "SKIPPED", label: "Skipped" },
];

const RESULT: Record<SquareWebhookRunStatus, { color: string; bg: string }> = {
  SUCCESS: { color: "#4ADE80", bg: "rgba(74,222,128,0.12)" },
  FAILED: { color: "#F87171", bg: "rgba(248,113,113,0.12)" },
  DUPLICATE_SKIPPED: { color: "#9B9B9B", bg: "rgba(255,255,255,0.06)" },
  IGNORED: { color: "#9B9B9B", bg: "rgba(255,255,255,0.06)" },
  PROCESSING: { color: "#FFD600", bg: "rgba(255,214,0,0.12)" },
};

const matchesTab = (status: SquareWebhookRunStatus, tab: TabId) =>
  tab === "all" ||
  (tab === "SUCCESS" && status === "SUCCESS") ||
  (tab === "FAILED" && status === "FAILED") ||
  (tab === "SKIPPED" && (status === "DUPLICATE_SKIPPED" || status === "IGNORED"));

function pill(status: SquareWebhookRunStatus, size: "sm" | "lg"): CSSProperties {
  const r = RESULT[status];
  return {
    display: "inline-flex",
    alignSelf: "flex-start",
    alignItems: "center",
    height: size === "lg" ? 22 : 20,
    padding: "0 9px",
    borderRadius: 9999,
    fontSize: size === "lg" ? 11.5 : 11,
    fontWeight: 500,
    whiteSpace: "nowrap",
    background: r.bg,
    color: r.color,
  };
}

function relTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const s = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.round(h / 24)} d ago`;
}

function fullTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return `${date} · ${time}`;
}

const ms = (v: number | null) => (v == null ? "—" : `${v} ms`);

function codeColor(code: number | null): string {
  if (code == null) return "#75767C";
  if (code >= 200 && code < 300) return "#4ADE80";
  if (code >= 500) return "#F87171";
  return "#FFD600";
}

const LABEL: CSSProperties = { fontSize: 10.5, color: "#75767C", letterSpacing: "0.04em", textTransform: "uppercase" };
const MONO: CSSProperties = { fontFamily: "var(--font-mono)" };

export function WebhooksScreen() {
  const router = useRouter();
  const [runs, setRuns] = useState<SquareWebhookRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabId>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, SquareWebhookRunDetail>>({});
  const [detailBusy, setDetailBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const reqId = useRef(0);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    listSquareWebhookRuns(token, { limit: 50 }, businessId)
      .then((res) => {
        if (my !== reqId.current) return;
        const list = Array.isArray(res?.runs) ? res.runs : [];
        setRuns(list);
        // Auto-select the most recent run on first load (keep any existing selection).
        setSelectedId((cur) => cur ?? list[0]?.id ?? null);
      })
      .catch((err) => {
        if (my !== reqId.current) return;
        if (err instanceof ApiError && err.status === 401) {
          clearManagerSession();
          router.replace("/login");
          return;
        }
        setError(err instanceof ApiError && err.status === 0 ? "Can't reach the server." : "Couldn't load webhook events.");
      })
      .finally(() => {
        if (my === reqId.current) setLoading(false);
      });
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const filtered = useMemo(() => runs.filter((r) => matchesTab(r.status, tab)), [runs, tab]);

  // Lazily fetch the selected run's full detail (payload + delivery log). Selection
  // persists across tabs even when the row is filtered out (matches the design).
  useEffect(() => {
    if (!selectedId || details[selectedId]) return;
    const token = getManagerToken();
    if (!token) return;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetailBusy(true);
    getSquareWebhookRun(token, selectedId, getManagerBusinessId())
      .then((res) => {
        if (alive && res?.run) setDetails((prev) => ({ ...prev, [res.run.id]: res.run }));
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setDetailBusy(false);
      });
    return () => {
      alive = false;
    };
  }, [selectedId, details]);

  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  const selected = selectedId ? runs.find((r) => r.id === selectedId) ?? null : null;
  const detail = selectedId ? details[selectedId] ?? null : null;

  // The list already carries the best payload; detail only adds the delivery log.
  const payloadText = useMemo(() => {
    const body = selected?.payload ?? detail?.payload ?? null;
    try {
      return body == null ? "" : JSON.stringify(body, null, 2);
    } catch {
      return String(body);
    }
  }, [selected, detail]);

  const onCopy = () => {
    if (!payloadText) return;
    navigator.clipboard?.writeText(payloadText).then(() => {
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1400);
    }).catch(() => {});
  };

  const outcome = useMemo(() => {
    if (!selected) return null;
    const orderRef = selected.foodyOrderId;
    switch (selected.status) {
      case "SUCCESS":
        return { title: orderRef ? "Order created" : "Processed", body: "Line items matched the Zappy catalog and the order entered the queue.", failed: false };
      case "FAILED":
        return { title: "No order created", body: selected.errorMessage || "Processing failed after all retries.", failed: true };
      case "DUPLICATE_SKIPPED":
        return { title: "Matched existing order", body: "A Square order with this ID had already been imported. The webhook was acknowledged and discarded.", failed: false };
      case "IGNORED":
        return { title: "Ignored", body: selected.reason || "This event type isn't handled and was acknowledged.", failed: false };
      default:
        return { title: "Processing", body: "The webhook is still being processed.", failed: false };
    }
  }, [selected]);

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px", height: 56, borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <Link href="/integrations" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#75767C" }}>
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span>Integrations</span>
        </Link>
        <span style={{ color: "#3D3E42", fontSize: 12.5 }}>/</span>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "#F1F1F1", letterSpacing: "-0.2px" }}>Square webhooks</span>
        <span style={{ flex: 1 }} />
        <button type="button" className="zp-shell-btn" onClick={load} disabled={loading} style={{ height: 30 }}>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ animation: loading ? "zspin 0.7s linear infinite" : undefined }}><path d="M12 7a5 5 0 1 1-1.46-3.54M12 2v3h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Refresh
        </button>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 22, padding: "0 9px", borderRadius: 9999, background: "rgba(255,214,0,0.1)", fontSize: 10.5, fontWeight: 500, color: "#FFD600" }}>
          <span style={{ width: 5, height: 5, borderRadius: 9999, background: "#FFD600", animation: "zp-pulse 1.8s ease-in-out infinite" }} />
          <span>Listening</span>
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        {TABS.map((t) => (
          <button key={t.id} type="button" className="zp-tab" data-active={t.id === tab} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "#75767C" }}>{filtered.length} of {runs.length} events</span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", overflowX: "auto" }}>
        {/* List */}
        <div style={{ flex: 1, minWidth: 440, display: "flex", flexDirection: "column", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "34px 1.5fr 1.1fr 1fr 0.9fr", gap: 12, padding: "0 20px", height: 34, alignItems: "center", background: "#1C1C1C", borderBottom: "1px solid rgba(255,255,255,0.07)", fontSize: 10.5, fontWeight: 600, color: "#75767C", letterSpacing: "0.04em", textTransform: "uppercase", flexShrink: 0 }}>
            <span />
            <span>Event</span>
            <span>Received</span>
            <span>Result</span>
            <span style={{ textAlign: "right" }}>Attempts</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "56px 0", color: "#9B9B9B", fontSize: 12.5 }}>
                <span style={{ width: 16, height: 16, borderRadius: 9999, border: "2px solid rgba(255,255,255,0.15)", borderTopColor: "#FF5C1A", animation: "zspin 0.7s linear infinite" }} /> Loading events…
              </div>
            )}
            {!loading && error && (
              <div style={{ padding: "48px 20px", textAlign: "center", color: "#F87171", fontSize: 12.5 }}>{error}</div>
            )}
            {!loading && !error && filtered.length === 0 && (
              <div style={{ padding: "56px 0", textAlign: "center", fontSize: 11.5, color: "#9B9B9B" }}>No events in this view.</div>
            )}
            {!loading && !error && filtered.map((r) => {
              const isSel = r.id === selectedId;
              return (
                <div
                  key={r.id}
                  className="zp-row"
                  onClick={() => { setSelectedId(r.id); setCopied(false); }}
                  style={{ display: "grid", gridTemplateColumns: "34px 1.5fr 1.1fr 1fr 0.9fr", gap: 12, alignItems: "center", padding: "11px 20px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)", background: isSel ? "rgba(255,92,26,0.07)" : "transparent" }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: 9999, background: RESULT[r.status].color }} />
                  <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 12.5, color: "#F1F1F1" }}>{r.eventType || "event"}</span>
                    <span style={{ ...MONO, fontSize: 10.5, color: "#5B5C61", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.eventId || r.id}</span>
                  </div>
                  <span style={{ ...MONO, fontSize: 11.5, color: "#9B9B9B" }}>{relTime(r.lastReceivedAt)}</span>
                  <span style={{ minWidth: 0 }}><span style={pill(r.status, "sm")}>{r.resultLabel}</span></span>
                  <span style={{ textAlign: "right", ...MONO, fontSize: 11.5, color: "#75767C" }}>{r.attempts}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail */}
        <div style={{ width: selected ? 420 : 260, minWidth: selected ? 360 : 200, flexShrink: 0, display: "flex", flexDirection: "column", background: "#1E1E1E", transition: "width 0.22s cubic-bezier(0.16,1,0.3,1)" }}>
          {!selected && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", fontSize: 12, color: "#5B5C61", lineHeight: 1.6 }}>Select an event to see its payload and what it created.</div>
          )}
          {selected && (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14.5, color: "#F1F1F1" }}>{selected.eventType || "event"}</span>
                  <span style={{ ...MONO, fontSize: 11, color: "#75767C", wordBreak: "break-all" }}>{selected.eventId || selected.id}</span>
                </div>
                <button type="button" className="zp-shell-btn" onClick={() => setSelectedId(null)} style={{ width: 30, padding: 0, flexShrink: 0 }}>
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </button>
              </div>

              <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px 18px 40px", display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 14px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={LABEL}>Status</span>
                    <span style={pill(selected.status, "lg")}>{selected.resultLabel}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={LABEL}>Received</span>
                    <span style={{ ...MONO, fontSize: 12, color: "#E8E8E8" }}>{fullTime(selected.lastReceivedAt)}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={LABEL}>Attempts</span>
                    <span style={{ ...MONO, fontSize: 12, color: "#E8E8E8" }}>{selected.attempts}{selected.attempts > 1 ? " (retried)" : ""}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={LABEL}>Processed in</span>
                    <span style={{ ...MONO, fontSize: 12, color: "#E8E8E8" }}>{ms(selected.processingDurationMs)}</span>
                  </div>
                </div>

                {outcome && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "13px 14px", borderRadius: 8, border: "1px solid " + (outcome.failed ? "rgba(248,113,113,0.25)" : "rgba(255,255,255,0.08)"), background: outcome.failed ? "rgba(248,113,113,0.06)" : "#212121" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 9999, background: RESULT[selected.status].color }} />
                      <span style={{ fontSize: 12.5, fontWeight: 500, color: "#F1F1F1" }}>{outcome.title}</span>
                    </div>
                    <span style={{ fontSize: 11.5, color: "#9B9B9B", lineHeight: 1.5 }}>{outcome.body}</span>
                    {selected.foodyOrderId && (
                      <Link href="/orders" style={{ display: "inline-flex", alignItems: "center", gap: 6, ...MONO, fontSize: 12 }}>
                        <span>Open order</span>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 8L8 2M8 2H3.6M8 2v4.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </Link>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={LABEL}>Payload</span>
                    <span style={{ flex: 1 }} />
                    <button type="button" className="zp-shell-btn" onClick={onCopy} disabled={!payloadText} style={{ height: 26, fontSize: 11.5 }}>{copied ? "Copied" : "Copy JSON"}</button>
                  </div>
                  <pre style={{ margin: 0, padding: 12, background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, overflow: "auto", maxHeight: 280, ...MONO, fontSize: 11, lineHeight: 1.65, color: "#C7C8CC", whiteSpace: "pre" }}>{payloadText || "No payload recorded."}</pre>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={LABEL}>Delivery log</span>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {detail && detail.deliveryLog.length > 0 ? (
                      detail.deliveryLog.map((l) => (
                        <div key={l.id} style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "8px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                          <span style={{ ...MONO, fontSize: 11, color: "#5B5C61", width: 64, flexShrink: 0 }}>{new Date(l.receivedAt).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                          <span style={{ ...MONO, fontSize: 11, fontWeight: 500, width: 30, flexShrink: 0, color: codeColor(l.httpStatusCode) }}>{l.httpStatusCode ?? "—"}</span>
                          <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: "#9B9B9B", lineHeight: 1.5 }}>{l.message || l.reason || l.action || l.status}{detail.deliveryLog.length > 1 ? ` · attempt ${l.attemptNumber}` : ""}</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: "8px 0", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 11.5, color: "#5B5C61" }}>{detailBusy ? "Loading…" : "No delivery attempts recorded."}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
