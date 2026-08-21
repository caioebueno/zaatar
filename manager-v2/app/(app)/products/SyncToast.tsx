"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { getSquareCatalogSyncTask } from "../../lib/api";
import type { SquareCatalogSyncTask, SquareSyncStatus } from "../../lib/api";
import { getManagerBusinessId, getManagerToken } from "../../lib/auth";

/**
 * Square catalog-sync toast stack — ported from the Zappy `Products.dc.html`
 * design and wired to the real sync-task API. A toast tracks one background
 * `SquareCatalogSyncTask`: it shows the in-flight spinner + indeterminate
 * progress bar while the task is running, then resolves to SUCCESS (green,
 * auto-dismiss), SKIPPED (no changes, auto-dismiss), or FAILED (red, with a
 * Retry action). See `updateProduct` → `squareSyncTask` and the recommended
 * poll flow: GET /integrations/square/catalog-sync-tasks/:id until it settles.
 */

export type SyncPhase = "syncing" | "synced" | "skipped" | "error";

/** Re-runs the mutation that created the task (used by Retry); returns the new task. */
type Retrigger = () => Promise<SquareCatalogSyncTask | null | undefined>;

type SyncToast = {
  id: string;
  taskId: string;
  label: string;
  phase: SyncPhase;
  errorMessage?: string;
  canRetry: boolean;
};

const POLL_MS = 2500;
const AUTO_DISMISS_MS = 3200;
const SKIPPED_DISMISS_MS = 2000;
const MAX_TOASTS = 3;
const MAX_POLL_ERRORS = 3;

const COPY: Record<SyncPhase, [title: string, detail: string]> = {
  syncing: ["Syncing to Square", "Pushing changes"],
  synced: ["Synced to Square", "Product updated"],
  skipped: ["No sync needed", "Already up to date on Square"],
  error: ["Square sync failed", "Saved on Foody, not on Square"],
};

const isTerminal = (t: SquareCatalogSyncTask) =>
  t.isRunning === false || t.status === "SUCCESS" || t.status === "FAILED" || t.status === "SKIPPED";

function phaseForStatus(status: SquareSyncStatus): SyncPhase {
  if (status === "SUCCESS") return "synced";
  if (status === "FAILED") return "error";
  if (status === "SKIPPED") return "skipped";
  return "syncing";
}

export function useSquareSync() {
  const [toasts, setToasts] = useState<SyncToast[]>([]);
  const seq = useRef(0);
  const retriggers = useRef<Record<string, Retrigger | undefined>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Bumped per toast to invalidate in-flight poll loops (on retry, dismiss, unmount).
  const generation = useRef<Record<string, number>>({});

  // Internal functions are plain (not memoized): they close over refs + functional
  // setState only, and nothing depends on their identity. Declaring them as hoisted
  // functions lets `applyTask` ⇄ `pollOnce` reference each other cleanly.
  function clearTimer(id: string) {
    const t = timers.current[id];
    if (t) {
      clearTimeout(t);
      delete timers.current[id];
    }
  }

  function setPhase(id: string, phase: SyncPhase, errorMessage?: string) {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, phase, errorMessage: errorMessage ?? t.errorMessage } : t)));
  }

  function dismiss(id: string) {
    clearTimer(id);
    delete retriggers.current[id];
    generation.current[id] = (generation.current[id] ?? 0) + 1; // cancel any live poll
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function pollOnce(id: string, taskId: string, gen: number, errCount: number) {
    if (generation.current[id] !== gen) return;
    const token = getManagerToken();
    if (!token) {
      setPhase(id, "error");
      return;
    }
    getSquareCatalogSyncTask(token, taskId, getManagerBusinessId())
      .then(({ task }) => applyTask(id, task, gen))
      .catch(() => {
        if (generation.current[id] !== gen) return;
        if (errCount + 1 >= MAX_POLL_ERRORS) {
          setPhase(id, "error");
          return;
        }
        timers.current[id] = setTimeout(() => pollOnce(id, taskId, gen, errCount + 1), POLL_MS);
      });
  }

  function applyTask(id: string, task: SquareCatalogSyncTask, gen: number) {
    if (generation.current[id] !== gen) return;
    if (!isTerminal(task)) {
      setPhase(id, "syncing");
      timers.current[id] = setTimeout(() => pollOnce(id, task.id, gen, 0), POLL_MS);
      return;
    }
    if (task.status === "SUCCESS") {
      setPhase(id, "synced");
      timers.current[id] = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    } else if (task.status === "SKIPPED") {
      setPhase(id, "skipped");
      timers.current[id] = setTimeout(() => dismiss(id), SKIPPED_DISMISS_MS);
    } else {
      setPhase(id, "error", task.errorMessage ?? undefined);
    }
  }

  /** Begin tracking a sync task returned by a product mutation. */
  function track(label: string, initialTask: SquareCatalogSyncTask, retrigger?: Retrigger) {
    seq.current += 1;
    const id = "sq" + seq.current;
    retriggers.current[id] = retrigger;
    const gen = (generation.current[id] = (generation.current[id] ?? 0) + 1);
    const fresh: SyncToast = {
      id,
      taskId: "#" + initialTask.id,
      label,
      phase: phaseForStatus(initialTask.status),
      errorMessage: initialTask.errorMessage ?? undefined,
      canRetry: !!retrigger,
    };
    setToasts((prev) => [fresh, ...prev.filter((t) => t.label !== label)].slice(0, MAX_TOASTS));
    applyTask(id, initialTask, gen);
  }

  function retry(id: string) {
    const retrigger = retriggers.current[id];
    if (!retrigger) return;
    clearTimer(id);
    const gen = (generation.current[id] = (generation.current[id] ?? 0) + 1);
    setPhase(id, "syncing");
    retrigger()
      .then((task) => {
        if (generation.current[id] !== gen) return;
        if (!task) {
          dismiss(id);
          return;
        }
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, taskId: "#" + task.id } : t)));
        applyTask(id, task, gen);
      })
      .catch(() => {
        if (generation.current[id] === gen) setPhase(id, "error");
      });
  }

  useEffect(() => {
    const pending = timers.current;
    return () => {
      Object.values(pending).forEach(clearTimeout);
    };
  }, []);

  return { toasts, track, retry, dismiss };
}

const iconWrap: CSSProperties = { flexShrink: 0, width: 22, height: 22, marginTop: 1, borderRadius: 9999, display: "flex", alignItems: "center", justifyContent: "center" };

export function SquareSyncToasts({
  toasts,
  onRetry,
  onDismiss,
}: {
  toasts: SyncToast[];
  onRetry: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 90, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "auto" }}>
      {toasts.map((t) => {
        const [title, baseDetail] = COPY[t.phase];
        const failed = t.phase === "error";
        const synced = t.phase === "synced";
        const detail = (failed && t.errorMessage ? t.errorMessage : baseDetail) + " · " + t.label;
        return (
          <div
            key={t.id}
            className="zp-toast"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              width: 320,
              padding: "12px 12px 12px 13px",
              background: "#2F2F2F",
              borderRadius: 10,
              boxSizing: "border-box",
              border: "1px solid " + (failed ? "rgba(239,68,68,0.4)" : synced ? "rgba(34,197,94,0.28)" : "rgba(255,255,255,0.1)"),
              boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            }}
          >
            <span style={{ ...iconWrap, background: failed ? "rgba(239,68,68,0.12)" : synced ? "rgba(34,197,94,0.12)" : "rgba(255,92,26,0.1)" }}>
              {t.phase === "syncing" && (
                <span style={{ display: "block", width: 14, height: 14, borderRadius: 9999, border: "2px solid rgba(255,92,26,0.22)", borderTopColor: "#FF5C1A", animation: "zp-spin 0.7s linear infinite" }} />
              )}
              {synced && (
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.4l3 3 6-6.4" stroke="#22C55E" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
              )}
              {t.phase === "skipped" && (
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M3.4 7h7.2" stroke="#9B9B9B" strokeWidth="1.8" strokeLinecap="round" /></svg>
              )}
              {failed && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.6" stroke="#EF4444" strokeWidth="1.5" /><path d="M7 4.2v3.6" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" /><circle cx="7" cy="10" r="0.85" fill="#EF4444" /></svg>
              )}
            </span>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 12.5, color: "#F1F1F1", letterSpacing: "-0.1px" }}>{title}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#75767C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 96 }}>{t.taskId}</span>
              </div>
              <span style={{ fontSize: 11.5, color: "#9B9B9B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{detail}</span>
              {t.phase === "syncing" && (
                <div style={{ marginTop: 4, height: 3, borderRadius: 9999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                  <div style={{ width: "30%", height: "100%", borderRadius: 9999, background: "#FF5C1A", animation: "zp-indet 1.1s cubic-bezier(0.16,1,0.3,1) infinite" }} />
                </div>
              )}
              {failed && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  {t.canRetry && (
                    <button type="button" className="zp-retry" onClick={() => onRetry(t.id)} style={{ height: 26, padding: "0 11px", background: "transparent", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 11.5, fontWeight: 500, color: "#C7C8CC" }}>Retry sync</button>
                  )}
                  <a href="/integrations" style={{ fontSize: 11.5, color: "#9B9B9B" }}>View integration</a>
                </div>
              )}
            </div>
            <button type="button" className="zp-toastx" title="Dismiss" onClick={() => onDismiss(t.id)} style={{ flexShrink: 0, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: 5, cursor: "pointer", color: "#75767C" }}>
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1 1l7 7M8 1l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
