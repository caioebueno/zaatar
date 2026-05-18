"use client";

import { useState } from "react";
import { ACCESS_TOKEN_STORAGE_KEY, BUSINESS_ID_STORAGE_KEY } from "@/src/lib/auth";

type Step = {
  goalMinutes: number;
  id: string;
  name: string;
  includeComments: boolean;
  includeModifiers: boolean;
};

type Station = {
  id: string;
  name: string;
  preparationSteps: Step[];
};

type Props = {
  initialStations: Station[];
  initialError: string | null;
};

function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "") || "http://localhost:4000";
}

function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const accessToken =
    typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) ?? "" : "";
  const businessId =
    typeof window !== "undefined" ? localStorage.getItem(BUSINESS_ID_STORAGE_KEY) ?? "" : "";

  return fetch(`${getApiBase()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(businessId ? { "x-business-id": businessId } : {}),
      ...(init?.headers ?? {}),
    },
  });
}

function toErr(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "error" in payload) {
    const msg = (payload as { error?: unknown }).error;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return fallback;
}

// ── Step form ─────────────────────────────────────────────────────────────────

type StepFormState = {
  goalMinutes: string;
  name: string;
  includeComments: boolean;
  includeModifiers: boolean;
};

function StepForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: StepFormState;
  onSave: (state: StepFormState) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [state, setState] = useState<StepFormState>(initial);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 14px", background: "rgba(22,18,15,0.03)", borderRadius: 8, border: "1px solid rgba(22,18,15,0.1)" }}>
      <input
        autoFocus
        placeholder="Step name"
        value={state.name}
        onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
        style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(22,18,15,0.18)", fontSize: 13, fontFamily: "var(--font-sans)", outline: "none", width: "100%", boxSizing: "border-box" }}
      />
      <input
        placeholder="Goal minutes (e.g. 15)"
        inputMode="numeric"
        value={state.goalMinutes}
        onChange={(e) =>
          setState((s) => ({
            ...s,
            goalMinutes: e.target.value.replace(/[^\d]/g, ""),
          }))
        }
        style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(22,18,15,0.18)", fontSize: 13, fontFamily: "var(--font-sans)", outline: "none", width: "100%", boxSizing: "border-box" }}
      />
      <div style={{ display: "flex", gap: 16 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--ink, #16120f)", cursor: "pointer", userSelect: "none" }}>
          <input
            type="checkbox"
            checked={state.includeComments}
            onChange={(e) => setState((s) => ({ ...s, includeComments: e.target.checked }))}
          />
          Include comments
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--ink, #16120f)", cursor: "pointer", userSelect: "none" }}>
          <input
            type="checkbox"
            checked={state.includeModifiers}
            onChange={(e) => setState((s) => ({ ...s, includeModifiers: e.target.checked }))}
          />
          Include modifiers
        </label>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          disabled={saving || !state.name.trim()}
          onClick={() => onSave(state)}
          style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: "#16120f", color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: saving || !state.name.trim() ? "not-allowed" : "pointer", opacity: saving || !state.name.trim() ? 0.5 : 1 }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{ padding: "5px 14px", borderRadius: 6, border: "1px solid rgba(22,18,15,0.18)", background: "transparent", fontSize: 12.5, fontWeight: 500, cursor: "pointer", color: "#16120f" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Step row ──────────────────────────────────────────────────────────────────

function StepRow({
  step,
  stationId,
  onUpdated,
  onDeleted,
}: {
  step: Step;
  stationId: string;
  onUpdated: (updated: Step) => void;
  onDeleted: (stepId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave(form: StepFormState) {
    setSaving(true);
    try {
      const parsedGoalMinutes = Number.parseInt(form.goalMinutes || "0", 10);
      const goalMinutes = Number.isFinite(parsedGoalMinutes)
        ? Math.max(0, parsedGoalMinutes)
        : 0;
      const res = await apiFetch(`/stations/${stationId}/steps/${step.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name.trim(),
          goalMinutes,
          includeComments: form.includeComments,
          includeModifiers: form.includeModifiers,
        }),
      });
      if (!res.ok) return;
      const updated = (await res.json()) as Step;
      onUpdated(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete step "${step.name}"?`)) return;
    setDeleting(true);
    try {
      await apiFetch(`/stations/${stationId}/steps/${step.id}`, { method: "DELETE" });
      onDeleted(step.id);
    } finally {
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <StepForm
        initial={{
          name: step.name,
          goalMinutes: String(step.goalMinutes ?? 0),
          includeComments: step.includeComments,
          includeModifiers: step.includeModifiers,
        }}
        onSave={handleSave}
        onCancel={() => setEditing(false)}
        saving={saving}
      />
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#fff", borderRadius: 7, border: "1px solid rgba(22,18,15,0.1)" }}>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#16120f" }}>{step.name}</span>
        <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
          <span style={{ fontSize: 11, color: "#555", background: "rgba(22,18,15,0.06)", padding: "1px 6px", borderRadius: 4 }}>
            {step.goalMinutes} min
          </span>
          {step.includeComments && (
            <span style={{ fontSize: 11, color: "#555", background: "rgba(22,18,15,0.06)", padding: "1px 6px", borderRadius: 4 }}>comments</span>
          )}
          {step.includeModifiers && (
            <span style={{ fontSize: 11, color: "#555", background: "rgba(22,18,15,0.06)", padding: "1px 6px", borderRadius: 4 }}>modifiers</span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        style={{ padding: "3px 10px", borderRadius: 5, border: "1px solid rgba(22,18,15,0.16)", background: "transparent", fontSize: 11.5, fontWeight: 500, cursor: "pointer", color: "#16120f" }}
      >
        Edit
      </button>
      <button
        type="button"
        disabled={deleting}
        onClick={() => void handleDelete()}
        style={{ padding: "3px 10px", borderRadius: 5, border: "1px solid rgba(199,42,10,0.3)", background: "transparent", fontSize: 11.5, fontWeight: 500, cursor: deleting ? "not-allowed" : "pointer", color: "#c72a0a", opacity: deleting ? 0.5 : 1 }}
      >
        {deleting ? "…" : "Delete"}
      </button>
    </div>
  );
}

// ── Station card ──────────────────────────────────────────────────────────────

function StationCard({
  station,
  onUpdated,
  onDeleted,
}: {
  station: Station;
  onUpdated: (updated: Station) => void;
  onDeleted: (id: string) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(station.name);
  const [savingName, setSavingName] = useState(false);
  const [deletingStation, setDeletingStation] = useState(false);
  const [addingStep, setAddingStep] = useState(false);
  const [savingStep, setSavingStep] = useState(false);

  async function handleSaveName() {
    if (!nameValue.trim() || nameValue.trim() === station.name) { setEditingName(false); return; }
    setSavingName(true);
    try {
      const res = await apiFetch(`/stations/${station.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: nameValue.trim() }),
      });
      if (!res.ok) return;
      const updated = (await res.json()) as Station;
      onUpdated(updated);
      setEditingName(false);
    } finally {
      setSavingName(false);
    }
  }

  async function handleDeleteStation() {
    if (!confirm(`Delete station "${station.name}" and all its steps?`)) return;
    setDeletingStation(true);
    try {
      await apiFetch(`/stations/${station.id}`, { method: "DELETE" });
      onDeleted(station.id);
    } finally {
      setDeletingStation(false);
    }
  }

  async function handleAddStep(form: StepFormState) {
    setSavingStep(true);
    try {
      const parsedGoalMinutes = Number.parseInt(form.goalMinutes || "0", 10);
      const goalMinutes = Number.isFinite(parsedGoalMinutes)
        ? Math.max(0, parsedGoalMinutes)
        : 0;
      const res = await apiFetch(`/stations/${station.id}/steps`, {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          goalMinutes,
          includeComments: form.includeComments,
          includeModifiers: form.includeModifiers,
        }),
      });
      if (!res.ok) return;
      const newStep = (await res.json()) as Step;
      onUpdated({ ...station, preparationSteps: [...station.preparationSteps, newStep] });
      setAddingStep(false);
    } finally {
      setSavingStep(false);
    }
  }

  function handleStepUpdated(updated: Step) {
    onUpdated({
      ...station,
      preparationSteps: station.preparationSteps.map((s) => (s.id === updated.id ? updated : s)),
    });
  }

  function handleStepDeleted(stepId: string) {
    onUpdated({
      ...station,
      preparationSteps: station.preparationSteps.filter((s) => s.id !== stepId),
    });
  }

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid rgba(22,18,15,0.1)", overflow: "hidden" }}>
      {/* Station header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: station.preparationSteps.length > 0 || addingStep ? "1px solid rgba(22,18,15,0.08)" : "none" }}>
        {editingName ? (
          <>
            <input
              autoFocus
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
              style={{ flex: 1, padding: "5px 10px", borderRadius: 6, border: "1px solid rgba(22,18,15,0.2)", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-sans)", outline: "none" }}
            />
            <button
              type="button"
              disabled={savingName || !nameValue.trim()}
              onClick={() => void handleSaveName()}
              style={{ padding: "4px 12px", borderRadius: 6, border: "none", background: "#16120f", color: "#fff", fontSize: 12, fontWeight: 600, cursor: savingName ? "not-allowed" : "pointer", opacity: savingName || !nameValue.trim() ? 0.5 : 1 }}
            >
              {savingName ? "…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => { setEditingName(false); setNameValue(station.name); }}
              style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(22,18,15,0.18)", background: "transparent", fontSize: 12, cursor: "pointer", color: "#16120f" }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: "#16120f", letterSpacing: "-0.01em" }}>{station.name}</span>
            <span style={{ fontSize: 12, color: "rgba(22,18,15,0.4)" }}>{station.preparationSteps.length} step{station.preparationSteps.length !== 1 ? "s" : ""}</span>
            <button
              type="button"
              onClick={() => setEditingName(true)}
              style={{ padding: "3px 10px", borderRadius: 5, border: "1px solid rgba(22,18,15,0.16)", background: "transparent", fontSize: 12, fontWeight: 500, cursor: "pointer", color: "#16120f" }}
            >
              Rename
            </button>
            <button
              type="button"
              disabled={deletingStation}
              onClick={() => void handleDeleteStation()}
              style={{ padding: "3px 10px", borderRadius: 5, border: "1px solid rgba(199,42,10,0.3)", background: "transparent", fontSize: 12, fontWeight: 500, cursor: deletingStation ? "not-allowed" : "pointer", color: "#c72a0a", opacity: deletingStation ? 0.5 : 1 }}
            >
              {deletingStation ? "…" : "Delete"}
            </button>
          </>
        )}
      </div>

      {/* Steps */}
      {(station.preparationSteps.length > 0 || addingStep) && (
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {station.preparationSteps.map((step) => (
            <StepRow
              key={step.id}
              step={step}
              stationId={station.id}
              onUpdated={handleStepUpdated}
              onDeleted={handleStepDeleted}
            />
          ))}

          {addingStep && (
            <StepForm
              initial={{
                name: "",
                goalMinutes: "0",
                includeComments: false,
                includeModifiers: false,
              }}
              onSave={handleAddStep}
              onCancel={() => setAddingStep(false)}
              saving={savingStep}
            />
          )}
        </div>
      )}

      {/* Add step button */}
      {!addingStep && (
        <div style={{ padding: "10px 16px", borderTop: station.preparationSteps.length > 0 ? "1px solid rgba(22,18,15,0.06)" : "none" }}>
          <button
            type="button"
            onClick={() => setAddingStep(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", background: "transparent", border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 500, color: "rgba(22,18,15,0.5)" }}
          >
            <svg width={12} height={12} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
            Add step
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StationsManager({ initialStations, initialError }: Props) {
  const [stations, setStations] = useState<Station[]>(initialStations);
  const [error, setError] = useState<string | null>(initialError);
  const [creatingStation, setCreatingStation] = useState(false);
  const [newStationName, setNewStationName] = useState("");
  const [savingStation, setSavingStation] = useState(false);

  async function handleCreateStation() {
    const name = newStationName.trim();
    if (!name) return;
    setSavingStation(true);
    setError(null);
    try {
      const res = await apiFetch("/stations", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      const payload = (await res.json().catch(() => ({}))) as unknown;
      if (!res.ok) {
        setError(toErr(payload, "Failed to create station"));
        return;
      }
      const newStation = payload as Station;
      setStations((prev) => [...prev, newStation]);
      setNewStationName("");
      setCreatingStation(false);
    } catch {
      setError("Could not reach server");
    } finally {
      setSavingStation(false);
    }
  }

  function handleStationUpdated(updated: Station) {
    setStations((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  function handleStationDeleted(id: string) {
    setStations((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#f0eee9" }}>

      {/* ── Topbar ──────────────────────────────────────────────────────────── */}
      <div style={{ height: 56, background: "var(--paper)", borderBottom: "1px solid rgba(22,18,15,0.08)", display: "flex", alignItems: "center", padding: "0 24px", gap: 16, justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Zippy mark */}
          <svg width="22" height="22" viewBox="0 0 100 100">
            <rect width="100" height="100" rx="18" fill="#ff3d14" />
            <circle cx="50" cy="60" r="9" fill="#faf5ee" />
            <path d="M28 60 A22 22 0 0 1 72 60" stroke="#faf5ee" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.55" />
            <path d="M18 60 A32 32 0 0 1 82 60" stroke="#faf5ee" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.25" />
          </svg>
          <div style={{ width: 1, height: 20, background: "rgba(22,18,15,0.1)" }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 650, color: "var(--ink)", letterSpacing: "-0.01em", lineHeight: 1 }}>Stations</div>
            <div style={{ fontSize: 11, color: "rgba(22,18,15,0.4)", marginTop: 2, lineHeight: 1 }}>Kitchen prep stations</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!creatingStation && (
            <button
              type="button"
              onClick={() => setCreatingStation(true)}
              style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#16120f", color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
            >
              + New station
            </button>
          )}
        </div>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
        <div style={{ maxWidth: 860 }}>

          {error && (
            <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(199,42,10,0.07)", border: "1px solid rgba(199,42,10,0.2)", borderRadius: 8, fontSize: 13, color: "#c72a0a" }}>
              {error}
            </div>
          )}

          {creatingStation && (
            <div style={{ marginBottom: 20, padding: "16px", background: "#fff", borderRadius: 12, border: "1px solid rgba(22,18,15,0.12)", display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#16120f" }}>New station</p>
              <input
                autoFocus
                placeholder="Station name"
                value={newStationName}
                onChange={(e) => setNewStationName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void handleCreateStation(); if (e.key === "Escape") setCreatingStation(false); }}
                style={{ padding: "8px 12px", borderRadius: 7, border: "1px solid rgba(22,18,15,0.18)", fontSize: 13.5, fontFamily: "var(--font-sans)", outline: "none" }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  disabled={savingStation || !newStationName.trim()}
                  onClick={() => void handleCreateStation()}
                  style={{ padding: "6px 16px", borderRadius: 7, border: "none", background: "#16120f", color: "#fff", fontSize: 13, fontWeight: 600, cursor: savingStation || !newStationName.trim() ? "not-allowed" : "pointer", opacity: savingStation || !newStationName.trim() ? 0.5 : 1 }}
                >
                  {savingStation ? "Creating…" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => { setCreatingStation(false); setNewStationName(""); }}
                  style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid rgba(22,18,15,0.18)", background: "transparent", fontSize: 13, cursor: "pointer", color: "#16120f" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {stations.length === 0 && !creatingStation ? (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "rgba(22,18,15,0.35)", fontSize: 14 }}>
              No stations yet. Create one to get started.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {stations.map((station) => (
                <StationCard
                  key={station.id}
                  station={station}
                  onUpdated={handleStationUpdated}
                  onDeleted={handleStationDeleted}
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
