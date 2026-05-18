"use client";

import { useId, useRef, useState } from "react";
import { IconClock } from "./Icons";

export type TimeValue = { hh: string; mm: string; period: "AM" | "PM" };

/** "09:30" (24h) → TimeValue */
export function timeStringToValue(t: string): TimeValue {
  const [h, m] = t.split(":").map(Number);
  const period: "AM" | "PM" = h < 12 ? "AM" : "PM";
  const hh12 = h % 12 === 0 ? 12 : h % 12;
  return { hh: String(hh12).padStart(2, "0"), mm: String(m ?? 0).padStart(2, "0"), period };
}

/** TimeValue → "09:30" (24h) */
export function valueToTimeString(v: TimeValue): string {
  const h = parseInt(v.hh || "0", 10);
  const m = parseInt(v.mm || "0", 10);
  let h24 = h % 12;
  if (v.period === "PM") h24 += 12;
  return `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

type Props = {
  label?: string;
  required?: boolean;
  value?: TimeValue;
  defaultValue?: TimeValue;
  onChange?: (v: TimeValue) => void;
  error?: string;
  hint?: string;
  disabled?: boolean;
  size?: "sm" | "md";
};

export function TimeInput({
  label,
  required,
  value: controlledValue,
  defaultValue = { hh: "", mm: "", period: "AM" },
  onChange,
  error,
  hint,
  disabled,
  size = "md",
}: Props) {
  const id = useId();
  const [internal, setInternal] = useState<TimeValue>(defaultValue);
  const [focused, setFocused] = useState(false);
  // Digit accumulators: null = not editing, string = digits typed so far this focus
  const [hhTyping, setHhTyping] = useState<string | null>(null);
  const [mmTyping, setMmTyping] = useState<string | null>(null);
  const hhRef = useRef<HTMLInputElement>(null);
  const mmRef = useRef<HTMLInputElement>(null);
  // Set to true when keydown already committed the HH value and advanced focus;
  // prevents onHHBlur (which fires synchronously before React re-renders) from
  // overwriting with a stale hhTyping closure value.
  const hhJustCommitted = useRef(false);

  const isControlled = controlledValue !== undefined;
  const val = isControlled ? controlledValue : internal;

  function update(patch: Partial<TimeValue>) {
    const next = { ...val, ...patch };
    if (!isControlled) setInternal(next);
    onChange?.(next);
  }

  // ── HH ────────────────────────────────────────────────────────────────────────

  function onHHFocus() {
    setHhTyping("");
    hhRef.current?.select();
  }

  function onHHKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Tab" || e.key === "ArrowRight") {
      // Commit whatever is typed and let focus move naturally
      if (hhTyping) {
        update({ hh: hhTyping.padStart(2, "0") });
        setHhTyping(null);
      }
      return;
    }
    if (e.key === "Backspace") {
      e.preventDefault();
      setHhTyping((prev) => (prev ?? "").slice(0, -1));
      return;
    }
    if (!/^\d$/.test(e.key)) return;
    e.preventDefault();

    const next = (hhTyping ?? "") + e.key;

    if (next.length === 1 && parseInt(next) > 1) {
      // Digits 2-9 can only be single-digit hours (pad to 02-09) — advance immediately
      hhJustCommitted.current = true;
      update({ hh: next.padStart(2, "0") });
      setHhTyping(null);
      setMmTyping("");
      mmRef.current?.focus();
      mmRef.current?.select();
    } else if (next.length >= 2) {
      hhJustCommitted.current = true;
      update({ hh: next.slice(0, 2) });
      setHhTyping(null);
      setMmTyping("");
      mmRef.current?.focus();
      mmRef.current?.select();
    } else {
      setHhTyping(next);
    }
  }

  function onHHBlur() {
    if (hhJustCommitted.current) {
      hhJustCommitted.current = false;
      setHhTyping(null);
      return;
    }
    const t = hhTyping;
    setHhTyping(null);
    if (t === null) return;
    if (!t) update({ hh: val.hh || "12" });
    else update({ hh: t.padStart(2, "0") });
  }

  // ── MM ────────────────────────────────────────────────────────────────────────

  function onMMFocus() {
    setMmTyping("");
    mmRef.current?.select();
  }

  function onMMKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Tab" || e.key === "ArrowRight") {
      if (mmTyping) {
        update({ mm: mmTyping.padStart(2, "0") });
        setMmTyping(null);
      }
      return;
    }
    if (e.key === "Backspace") {
      e.preventDefault();
      setMmTyping((prev) => (prev ?? "").slice(0, -1));
      return;
    }
    if (!/^\d$/.test(e.key)) return;
    e.preventDefault();

    const next = (mmTyping ?? "") + e.key;

    if (next.length >= 2) {
      update({ mm: next.slice(0, 2) });
      setMmTyping(null);
    } else {
      setMmTyping(next);
    }
  }

  function onMMBlur() {
    const t = mmTyping;
    setMmTyping(null);
    if (t === null) return;
    if (!t) update({ mm: val.mm || "00" });
    else update({ mm: t.padStart(2, "0") });
  }

  // ── Styles ───────────────────────────────────────────────────────────────────

  const sm = size === "sm";

  const borderColor = error
    ? "var(--ember)"
    : focused
      ? "var(--zippy)"
      : "rgba(22,18,15,0.18)";

  const boxShadow = error
    ? "0 0 0 3px rgba(199,42,10,0.12)"
    : focused
      ? "0 0 0 3px rgba(255,61,20,0.12)"
      : "none";

  const segStyle: React.CSSProperties = {
    width: sm ? 22 : 28,
    border: "none",
    outline: "none",
    fontFamily: "var(--font-mono)",
    fontSize: sm ? 12 : 15,
    fontWeight: 500,
    color: "var(--ink)",
    background: "transparent",
    textAlign: "center",
    padding: sm ? "5px 1px" : "10px 2px",
    cursor: disabled ? "not-allowed" : "text",
    letterSpacing: "0.04em",
  };

  return (
    <div>
      {label && (
        <div
          className="mono"
          style={{ fontSize: 10, color: "var(--slate)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}
        >
          <label htmlFor={id}>
            {label}
            {required && <span style={{ color: "var(--zippy)", marginLeft: 3 }}>*</span>}
          </label>
        </div>
      )}

      <div
        style={{
          display: "flex", alignItems: "center",
          border: `1px solid ${borderColor}`, borderRadius: sm ? 6 : 8,
          padding: sm ? "0 7px" : "0 10px", boxShadow,
          background: disabled ? "rgba(22,18,15,0.04)" : "var(--paper)",
          transition: "border-color 120ms ease, box-shadow 120ms ease",
          boxSizing: "border-box", width: "100%", opacity: disabled ? 0.6 : 1,
        }}
        onFocus={() => setFocused(true)}
        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false); }}
      >
        <IconClock
          size={sm ? 11 : 14}
          color={focused ? "var(--zippy)" : "var(--slate)"}
          style={{ flexShrink: 0, marginRight: sm ? 4 : 6 }}
        />

        <input
          ref={hhRef}
          id={id}
          disabled={disabled}
          value={hhTyping !== null ? hhTyping : val.hh}
          onChange={() => { /* controlled via onKeyDown */ }}
          onFocus={onHHFocus}
          onBlur={onHHBlur}
          onKeyDown={onHHKeyDown}
          placeholder="HH"
          inputMode="numeric"
          style={segStyle}
        />

        <span style={{ color: "var(--slate)", fontFamily: "var(--font-mono)", fontSize: sm ? 12 : 15, fontWeight: 500, userSelect: "none" }}>:</span>

        <input
          ref={mmRef}
          disabled={disabled}
          value={mmTyping !== null ? mmTyping : val.mm}
          onChange={() => { /* controlled via onKeyDown */ }}
          onFocus={onMMFocus}
          onBlur={onMMBlur}
          onKeyDown={onMMKeyDown}
          placeholder="MM"
          inputMode="numeric"
          style={segStyle}
        />

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", border: "1px solid rgba(22,18,15,0.1)", flexShrink: 0, marginLeft: 8 }}>
          {(["AM", "PM"] as const).map((p) => (
            <button
              key={p}
              type="button"
              disabled={disabled}
              onClick={() => update({ period: p })}
              style={{
                border: "none", padding: sm ? "3px 5px" : "4px 8px",
                fontFamily: "var(--font-sans)", fontWeight: 600,
                fontSize: sm ? 9 : 11, letterSpacing: "0.04em",
                background: val.period === p ? "var(--ink)" : "transparent",
                color: val.period === p ? "var(--cream)" : "var(--slate)",
                cursor: disabled ? "not-allowed" : "pointer", transition: "background 120ms",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mono" style={{ fontSize: 10, color: "var(--ember)", letterSpacing: "0.06em", marginTop: 5 }}>{error}</div>
      )}
      {!error && hint && (
        <div className="mono" style={{ fontSize: 10, color: "var(--slate)", letterSpacing: "0.06em", marginTop: 5 }}>{hint}</div>
      )}
    </div>
  );
}
