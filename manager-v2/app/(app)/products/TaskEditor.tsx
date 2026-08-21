"use client";

import { useEffect, useState } from "react";
import { KNOB_STYLE, primarySaveStyle, switchStyle } from "./data";
import type { PrepTask } from "./data";
import { CancelButton, Drawer, fieldLabelStyle, inputStyle } from "./Drawer";
import { Select } from "../_components/Select";
import { ApiError, createPreparationStep, listStations, updatePreparationStep } from "../../lib/api";
import type { ApiStation } from "../../lib/api";
import { getManagerBusinessId, getManagerToken } from "../../lib/auth";

export type TaskDraft = { mode: "create" | "edit"; id: string | null; name: string; station: string; goal: string; comments: boolean; modifiers: boolean };

export function TaskEditor({ initial, onCancel, onSaved }: { initial: TaskDraft; onCancel: () => void; onSaved: (task: PrepTask, mode: "create" | "edit") => void }) {
  const [name, setName] = useState(initial.name);
  const [station, setStation] = useState(initial.station);
  const [goal, setGoal] = useState(initial.goal);
  const [comments, setComments] = useState(initial.comments);
  const [modifiers, setModifiers] = useState(initial.modifiers);
  const [stations, setStations] = useState<ApiStation[]>([]);
  const [loadingStations, setLoadingStations] = useState(() => !!getManagerToken());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // The drawer fetches the real stations for the picker (GET /stations). On
  // create, default to the first station when none is chosen yet.
  useEffect(() => {
    const token = getManagerToken();
    if (!token) return;
    const businessId = getManagerBusinessId();
    let alive = true;
    listStations(token, businessId)
      .then((items) => {
        if (!alive) return;
        setStations(items);
        if (!initial.station && items.length) setStation(items[0].name);
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoadingStations(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only real stations from GET /stations. Keep the current value selectable so
  // editing a task whose station no longer exists still shows it.
  const stationNames = stations.map((s) => s.name);
  const stationOptions = station && !stationNames.includes(station) ? [station, ...stationNames] : stationNames;

  const canSave = name.trim().length > 0;

  const save = async () => {
    if (!canSave || busy) return;
    const token = getManagerToken();
    if (!token) return;
    const businessId = getManagerBusinessId();
    const picked = stations.find((s) => s.name === station);
    const goalMinutes = parseInt(goal, 10) || 1;
    // goalMinutes is station-wide: the API syncs it across every step in the station.
    const body = { name: name.trim(), goalMinutes, includeComments: comments, includeModifiers: modifiers };

    setBusy(true);
    setError("");
    try {
      if (initial.mode === "edit" && initial.id) {
        // The step is updated by id; stationId in the path is just a locator.
        const stationId = picked?.id ?? stations[0]?.id;
        if (!stationId) { setError("Select a station first."); setBusy(false); return; }
        const updated = await updatePreparationStep(token, stationId, initial.id, body, businessId);
        onSaved({ id: updated.id, name: updated.name, station: picked?.name ?? station, goal: updated.goalMinutes, comments: updated.includeComments, modifiers: updated.includeModifiers }, "edit");
      } else {
        if (!picked) { setError("Select a station first."); setBusy(false); return; }
        const created = await createPreparationStep(token, picked.id, body, businessId);
        onSaved({ id: created.id, name: created.name, station: picked.name, goal: created.goalMinutes, comments: created.includeComments, modifiers: created.includeModifiers }, "create");
      }
    } catch (e) {
      setError(e instanceof ApiError && e.status === 0 ? "Can't reach the server." : "Couldn't save task.");
      setBusy(false);
    }
  };

  return (
    <Drawer
      width={400}
      title={initial.mode === "edit" ? "Edit preparation task" : "New preparation task"}
      onClose={onCancel}
      footer={
        <>
          {error && <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: "#F08A6C", alignSelf: "center" }}>{error}</span>}
          <CancelButton onClick={onCancel} />
          <button type="button" onClick={save} disabled={busy || !canSave} style={primarySaveStyle(canSave && !busy, 30)}>
            {busy ? "Saving…" : initial.mode === "edit" ? "Save task" : "Create task"}
          </button>
        </>
      }
    >
      <div>
        <div style={fieldLabelStyle}>Name</div>
        <input className="zp-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grill patty" style={{ ...inputStyle, height: 32, fontSize: 12.5 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 116px", gap: 10 }}>
        <div>
          <div style={fieldLabelStyle}>Station</div>
          <Select
            value={station}
            onValueChange={setStation}
            ariaLabel="Station"
            placeholder={loadingStations ? "Loading…" : stationOptions.length ? "Select a station" : "No stations"}
            options={stationOptions.map((st) => ({ value: st, label: st }))}
            triggerStyle={{ ...inputStyle, height: 32, fontSize: 12.5, padding: "0 8px", width: "100%" }}
          />
        </div>
        <div>
          <div style={fieldLabelStyle}>Goal (min)</div>
          <input className="zp-input" value={goal} onChange={(e) => setGoal(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" style={{ ...inputStyle, height: 32, fontSize: 12.5, fontFamily: "var(--font-mono)" }} />
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontSize: 12.5, color: "#E8E8E8" }}>Include comments</span>
        <button type="button" onClick={() => setComments((v) => !v)} style={switchStyle(comments)}>
          <span style={KNOB_STYLE} />
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontSize: 12.5, color: "#E8E8E8" }}>Include modifiers</span>
        <button type="button" onClick={() => setModifiers((v) => !v)} style={switchStyle(modifiers)}>
          <span style={KNOB_STYLE} />
        </button>
      </div>
    </Drawer>
  );
}
