"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { TODAY, resolveCompare, sameDay } from "./data";
import type { CompareValue } from "./data";
import { Popover } from "../_components/Popover";

const DOW = ["S", "M", "T", "W", "T", "F", "S"];

const navPrevStyle: CSSProperties = {
  position: "absolute", left: 0, top: 0, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
  background: "transparent", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, cursor: "pointer",
};
const navNextStyle: CSSProperties = { ...navPrevStyle, left: "auto", right: 0 };

type Cell = { label: string; onClick: () => void; wrapStyle: CSSProperties; style: CSSProperties };

function monthCells(base: Date, offset: number, selStart: Date, selEnd: Date, onPick: (d: Date) => void) {
  const first = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const lead = first.getDay();
  const dim = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells: Cell[] = [];
  for (let i = 0; i < 42; i++) {
    const dayNum = i - lead + 1;
    if (dayNum < 1 || dayNum > dim) {
      cells.push({ label: "", wrapStyle: { height: 26 }, style: { display: "none" }, onClick: () => {} });
      continue;
    }
    const d = new Date(first.getFullYear(), first.getMonth(), dayNum);
    const future = d > TODAY;
    const isStart = sameDay(d, selStart);
    const isEnd = sameDay(d, selEnd);
    const inRange = d > selStart && d < selEnd;
    const edge = isStart || isEnd;
    cells.push({
      label: String(dayNum),
      onClick: future ? () => {} : () => onPick(d),
      wrapStyle: {
        height: 26, display: "flex", alignItems: "center", justifyContent: "center",
        background: inRange || edge ? "rgba(255,92,26,0.12)" : "transparent",
        borderRadius: edge ? (isStart ? "6px 0 0 6px" : "0 6px 6px 0") : inRange ? 0 : 6,
      },
      style: {
        width: 22, height: 22, border: "none", borderRadius: 6, cursor: future ? "default" : "pointer",
        fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: edge ? 600 : 400,
        background: edge ? "#FF5C1A" : "transparent",
        color: future ? "#4A4A4A" : edge ? "#FFFFFF" : "#E8E8E8",
      },
    });
  }
  return { title: first.toLocaleDateString("en-US", { month: "long", year: "numeric" }), cells };
}

export function CompareControl({ value, days, primaryEnd, onChange }: { value: CompareValue; days: number; primaryEnd: Date; onChange: (v: CompareValue) => void }) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<Date | null>(null);

  const rc = resolveCompare(value, days, primaryEnd);

  const pick = (d: Date) => { onChange({ on: value.on, start: d }); setOpen(false); };
  const a = anchor ?? rc.start;
  const anchorBase = new Date(a.getFullYear(), a.getMonth(), 1);
  const months = [monthCells(anchorBase, 0, rc.start, rc.end, pick), monthCells(anchorBase, 1, rc.start, rc.end, pick)];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 12.5, color: "#B4B5BA", whiteSpace: "nowrap" }}>Compare</span>
      <button
        type="button"
        onClick={() => { onChange({ on: !value.on, start: value.start }); setOpen(false); }}
        style={{ width: 32, height: 18, borderRadius: 999, border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center", justifyContent: value.on ? "flex-end" : "flex-start", background: value.on ? "#FF5C1A" : "#3D3E42", flexShrink: 0, transition: "background 120ms cubic-bezier(0.16,1,0.3,1)" }}
      >
        <span style={{ width: 14, height: 14, borderRadius: 999, background: "#FFFFFF", display: "block" }} />
      </button>

      {value.on && (
        <Popover
          open={open}
          onOpenChange={setOpen}
          align="end"
          sideOffset={8}
          contentStyle={{ borderRadius: 12, padding: "12px 14px 10px" }}
          trigger={
            <button
              type="button"
              style={{ display: "flex", alignItems: "center", gap: 10, height: 32, padding: "0 10px", background: "#2F2F2F", border: "1px solid " + (open ? "#FF5C1A" : "rgba(255,255,255,0.1)"), borderRadius: 6, fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 500, color: "#F1F1F2", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              <span>{rc.label}</span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="#75767C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          }
        >
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
            <button type="button" className="zp-cal-nav" onClick={() => setAnchor(new Date(anchorBase.getFullYear(), anchorBase.getMonth() - 1, 1))} style={navPrevStyle}>
              <svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M5 1L1 5L5 9" stroke="#9A9BA1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <div style={{ display: "flex", gap: 36 }}>
              {months.map((mo, i) => (<div key={i} style={{ width: 168, textAlign: "center", fontSize: 12.5, fontWeight: 600, color: "#F1F1F2" }}>{mo.title}</div>))}
            </div>
            <button type="button" className="zp-cal-nav" onClick={() => setAnchor(new Date(anchorBase.getFullYear(), anchorBase.getMonth() + 1, 1))} style={navNextStyle}>
              <svg width="6" height="10" viewBox="0 0 6 10" fill="none"><path d="M1 1L5 5L1 9" stroke="#9A9BA1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
          <div style={{ display: "flex", gap: 36 }}>
            {months.map((mo, mi) => (
              <div key={mi} style={{ width: 168 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
                  {DOW.map((d, i) => (<div key={i} style={{ textAlign: "center", fontSize: 10.5, fontWeight: 600, color: "#9A9BA1", letterSpacing: "0.04em", lineHeight: "22px" }}>{d}</div>))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", rowGap: 2 }}>
                  {mo.cells.map((c, i) => (<div key={i} style={c.wrapStyle}><button type="button" onClick={c.onClick} style={c.style}>{c.label}</button></div>))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: 10.5, color: "#9A9BA1", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{days} days · fixed to range</div>
            <button type="button" onClick={() => setOpen(false)} style={{ height: 30, padding: "0 14px", background: "#FF5C1A", border: "none", borderRadius: 6, fontFamily: "var(--font-body)", fontSize: 12.5, fontWeight: 500, color: "#fff", cursor: "pointer" }}>Done</button>
          </div>
        </Popover>
      )}
    </div>
  );
}
