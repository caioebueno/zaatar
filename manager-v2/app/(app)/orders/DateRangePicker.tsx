"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { RANGES, TODAY, addDays, fmtDate, resolveRange, sameDay } from "./data";
import { Popover } from "../_components/Popover";

const DOW = ["S", "M", "T", "W", "T", "F", "S"];

export type RangeValue = {
  rangeId: string | null;
  customStart: Date | null;
  customEnd: Date | null;
};

const navPrevStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  width: 26,
  height: 26,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 6,
  cursor: "pointer",
};

const navNextStyle: CSSProperties = { ...navPrevStyle, left: "auto", right: 0 };

type Cell = { label: string; onClick: () => void; wrapStyle: CSSProperties; style: CSSProperties };
type Month = { title: string; cells: Cell[] };

function monthCells(base: Date, offset: number, selStart: Date | null, selEnd: Date | null, onPick: (d: Date) => void): Month {
  const first = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const lead = first.getDay();
  const dim = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells: Cell[] = [];
  for (let i = 0; i < 42; i++) {
    const dayNum = i - lead + 1;
    if (dayNum < 1 || dayNum > dim) {
      cells.push({ label: "", wrapStyle: { height: 28 }, style: { display: "none" }, onClick: () => {} });
      continue;
    }
    const d = new Date(first.getFullYear(), first.getMonth(), dayNum);
    const future = d > TODAY;
    const isStart = sameDay(d, selStart);
    const isEnd = sameDay(d, selEnd);
    const inRange = !!selStart && !!selEnd && d > selStart && d < selEnd;
    const edge = isStart || isEnd;
    const both = !!selStart && !!selEnd;
    cells.push({
      label: String(dayNum),
      onClick: future ? () => {} : () => onPick(d),
      wrapStyle: {
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: inRange || (edge && both) ? "rgba(255,92,26,0.12)" : "transparent",
        borderRadius: edge && both ? (isStart ? "6px 0 0 6px" : "0 6px 6px 0") : inRange ? 0 : 6,
      },
      style: {
        width: 24,
        height: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        borderRadius: 6,
        cursor: future ? "default" : "pointer",
        fontFamily: "var(--font-body)",
        fontSize: 12,
        fontWeight: edge ? 600 : 400,
        background: edge ? "#FF5C1A" : "transparent",
        color: future ? "#5A5A5E" : edge ? "#171717" : "#E8E8E8",
      },
    });
  }
  return { title: first.toLocaleDateString("en-US", { month: "long", year: "numeric" }), cells };
}

export function DateRangePicker({ value, onChange }: { value: RangeValue; onChange: (next: RangeValue) => void }) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<Date | null>(null);
  const [selStart, setSelStart] = useState<Date | null>(null);
  const [selEnd, setSelEnd] = useState<Date | null>(null);

  const range = resolveRange(value.rangeId, value.customStart, value.customEnd);

  const pickDay = (d: Date) => {
    if (!selStart || (selStart && selEnd)) {
      setSelStart(d);
      setSelEnd(null);
      return;
    }
    if (d < selStart) {
      setSelStart(d);
      setSelEnd(selStart);
      return;
    }
    setSelEnd(d);
  };

  // Seed the visible selection from the active range when the panel opens.
  const onOpenChange = (o: boolean) => {
    if (o) {
      setSelStart(selStart ?? addDays(TODAY, -(range.days - 1)));
      setSelEnd(selEnd ?? TODAY);
    }
    setOpen(o);
  };

  const anchorBase = anchor ?? value.customEnd ?? TODAY;
  const monthBase = new Date(anchorBase.getFullYear(), anchorBase.getMonth() - 1, 1);
  const months = [
    monthCells(monthBase, 1, selStart, selEnd, pickDay),
    monthCells(monthBase, 2, selStart, selEnd, pickDay),
  ];

  const selectionLabel = selStart
    ? selEnd
      ? fmtDate(selStart) + " – " + fmtDate(selEnd)
      : fmtDate(selStart) + " – …"
    : "Pick a start date";

  return (
    <div style={{ flexShrink: 0 }}>
      <Popover
        open={open}
        onOpenChange={onOpenChange}
        align="end"
        sideOffset={8}
        contentStyle={{ display: "flex", borderRadius: 12, overflow: "hidden", padding: 0 }}
        trigger={
          <button
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              height: 32,
              padding: "0 10px",
              background: "#2F2F2F",
              border: "1px solid " + (open ? "#FF5C1A" : "rgba(255,255,255,0.09)"),
              borderRadius: 6,
              fontFamily: "var(--font-body)",
              fontSize: 12.5,
              fontWeight: 500,
              color: "#F1F1F2",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "border-color 0.12s ease",
            }}
          >
            <span>{range.id === "custom" ? range.label : "Last " + range.label}</span>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1L5 5L9 1" stroke="#75767C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        }
      >
          <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: 8, width: 112, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.08)" }}>
            {RANGES.map((r) => {
              const active = r.id === range.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    onChange({ rangeId: r.id, customStart: null, customEnd: null });
                    setSelStart(addDays(TODAY, -(r.days - 1)));
                    setSelEnd(TODAY);
                    setOpen(false);
                  }}
                  className="zp-quick"
                  style={{
                    textAlign: "left",
                    padding: "0 10px",
                    height: 30,
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    fontSize: 12.5,
                    fontWeight: active ? 600 : 400,
                    background: active ? "rgba(255,92,26,0.14)" : "transparent",
                    color: active ? "#FF5C1A" : "#E8E8E8",
                    whiteSpace: "nowrap",
                  }}
                >
                  Last {r.label}
                </button>
              );
            })}
          </div>

          <div style={{ padding: "12px 14px 10px" }}>
            {/* Month titles + absolute nav arrows */}
            <div style={{ position: "relative", display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
              {months.map((mo, i) => (
                <div key={i} style={{ width: 168, textAlign: "center", fontSize: 12.5, fontWeight: 600, color: "#F1F1F2", lineHeight: "26px" }}>
                  {mo.title}
                </div>
              ))}
              <button
                type="button"
                className="zp-cal-nav"
                onClick={() => setAnchor(new Date(monthBase.getFullYear(), monthBase.getMonth(), 1))}
                style={navPrevStyle}
              >
                <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                  <path d="M5 1L1 5L5 9" stroke="#B4B5BA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                className="zp-cal-nav"
                onClick={() => setAnchor(new Date(monthBase.getFullYear(), monthBase.getMonth() + 2, 1))}
                style={navNextStyle}
              >
                <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                  <path d="M1 1L5 5L1 9" stroke="#B4B5BA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Two month grids */}
            <div style={{ display: "flex", gap: 12 }}>
              {months.map((mo, mi) => (
                <div key={mi} style={{ width: 168 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
                    {DOW.map((d, i) => (
                      <div key={i} style={{ textAlign: "center", fontSize: 10.5, fontWeight: 600, color: "#B4B5BA", letterSpacing: "0.04em", lineHeight: "24px" }}>
                        {d}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", rowGap: 2 }}>
                    {mo.cells.map((c, i) => (
                      <div key={i} style={c.wrapStyle}>
                        <button type="button" onClick={c.onClick} style={c.style}>
                          {c.label}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer: selection label + actions on one row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 11, color: "#B4B5BA", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{selectionLabel}</div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  type="button"
                  className="zp-cal-cancel"
                  onClick={() => setOpen(false)}
                  style={{ height: 30, padding: "0 12px", background: "transparent", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, fontFamily: "var(--font-body)", fontSize: 12.5, color: "#E8E8E8", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selStart && selEnd) {
                      onChange({ rangeId: "custom", customStart: selStart, customEnd: selEnd });
                      setOpen(false);
                    }
                  }}
                  style={{ height: 30, padding: "0 14px", background: "#FF5C1A", border: "none", borderRadius: 6, fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 500, color: "#fff", cursor: "pointer", transition: "transform 120ms cubic-bezier(0.16,1,0.3,1)" }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
      </Popover>
    </div>
  );
}
