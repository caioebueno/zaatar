"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";

// ── Date utilities ────────────────────────────────────────────
function todayDate(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function soMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function eoMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function soWeekMon(d: Date): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + (r.getDay() === 0 ? -6 : 1 - r.getDay()));
  return r;
}
function sameDay(a: Date | null, b: Date | null) {
  return !!(a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate());
}
function between(d: Date, s: Date | null, e: Date | null) {
  if (!s || !e) return false;
  const t = d.getTime(), mn = Math.min(s.getTime(), e.getTime()), mx = Math.max(s.getTime(), e.getTime());
  return t > mn && t < mx;
}
function fmtFull(d: Date | null) {
  return d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
}
function fmtShort(d: Date | null) {
  return d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
}
function fmtTrigger(s: Date | null, e: Date | null) {
  if (!s) return "Select range";
  if (!e || sameDay(s, e)) return fmtFull(s);
  return s.getFullYear() === e.getFullYear() ? `${fmtShort(s)} – ${fmtFull(e)}` : `${fmtFull(s)} – ${fmtFull(e)}`;
}
function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function parseIso(str: string): Date | null {
  const [y, m, d] = str.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}
function parseD(str: string): Date | null {
  const d = new Date(str);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function monthDays(year: number, month: number): Array<{ date: Date; cur: boolean }> {
  const first = new Date(year, month, 1), last = new Date(year, month + 1, 0);
  const off = (first.getDay() + 6) % 7;
  const days: Array<{ date: Date; cur: boolean }> = [];
  for (let i = off - 1; i >= 0; i--) days.push({ date: addDays(first, -(i + 1)), cur: false });
  for (let d = 1; d <= last.getDate(); d++) days.push({ date: new Date(year, month, d), cur: true });
  let f = 1;
  while (days.length < 42) days.push({ date: new Date(year, month + 1, f++), cur: false });
  return days;
}

// ── Presets ──────────────────────────────────────────────────
const PILLS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last7", label: "7 days" },
  { id: "last30", label: "30 days" },
  { id: "thisMonth", label: "This month" },
  { id: "last12m", label: "12 months" },
];
const SIDEBAR_PRESETS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "thisWeek", label: "This week" },
  { id: "lastWeek", label: "Last week" },
  { id: "thisMonth", label: "This month" },
  { id: "lastMonth", label: "Last month" },
  { id: "thisYear", label: "This year" },
  { id: "lastYear", label: "Last year" },
];
const COMP_OPTIONS = [
  { id: "previous", label: "Previous period" },
  { id: "lastMonth", label: "Same month last yr" },
  { id: "lastYear", label: "Same period last yr" },
];

function rangeOf(id: string): [Date, Date] {
  const t = todayDate();
  switch (id) {
    case "today":     return [t, t];
    case "yesterday": { const y = addDays(t, -1); return [y, y]; }
    case "thisWeek":  return [soWeekMon(t), t];
    case "last7":     return [addDays(t, -6), t];
    case "lastWeek":  { const s = soWeekMon(addDays(t, -7)); return [s, addDays(s, 6)]; }
    case "last30":    return [addDays(t, -29), t];
    case "thisMonth": return [soMonth(t), t];
    case "lastMonth": { const lm = new Date(t.getFullYear(), t.getMonth() - 1, 1); return [lm, eoMonth(lm)]; }
    case "thisYear":  return [new Date(t.getFullYear(), 0, 1), t];
    case "last12m":   return [addDays(t, -364), t];
    case "lastYear":  return [new Date(t.getFullYear() - 1, 0, 1), new Date(t.getFullYear() - 1, 11, 31)];
    default:          return [addDays(t, -29), t];
  }
}
function compOf(s: Date | null, e: Date | null, type: string): [Date | null, Date | null] {
  if (!s || !e) return [null, null];
  const dur = Math.round((e.getTime() - s.getTime()) / 86400000);
  if (type === "previous")  return [addDays(s, -(dur + 1)), addDays(s, -1)];
  if (type === "lastMonth") return [new Date(s.getFullYear(), s.getMonth() - 1, s.getDate()), new Date(e.getFullYear(), e.getMonth() - 1, e.getDate())];
  return [new Date(s.getFullYear() - 1, s.getMonth(), s.getDate()), new Date(e.getFullYear() - 1, e.getMonth(), e.getDate())];
}

// ── CalMonth ─────────────────────────────────────────────────
const MN = ["January","February","March","April","May","June","July","August","September","October","November","December"];

interface CalMonthProps {
  year: number; month: number;
  rS: Date | null; rE: Date | null; hov: Date | null; picking: boolean;
  onDay: (d: Date) => void; onHov: (d: Date | null) => void;
  onPrev?: () => void; onNext?: () => void; showPrev: boolean; showNext: boolean;
}

function CalMonth({ year, month, rS, rE, hov, picking, onDay, onHov, onPrev, onNext, showPrev, showNext }: CalMonthProps) {
  const days = monthDays(year, month);
  const todD = todayDate();
  let eS = rS, eE = picking && hov ? hov : rE;
  if (eS && eE && eS > eE) { [eS, eE] = [eE, eS]; }
  const isSingle = !!(eS && eE && sameDay(eS, eE));

  const navBtn = "w-7 h-7 rounded-[6px] border border-[rgba(22,18,15,0.12)] bg-[#fffdf9] text-[#6c6259] cursor-pointer flex items-center justify-center transition-all duration-100 hover:bg-[#f2f2f0] hover:border-[rgba(22,18,15,0.20)] hover:text-[#16120f]";

  return (
    <div className="flex-1 min-w-[200px]">
      <div className="flex items-center justify-between mb-[14px]">
        {showPrev
          ? <button className={navBtn} onClick={onPrev} type="button" title="Previous month">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L4 6l3.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          : <span className="w-7" />}
        <span className="text-[15px] font-semibold text-[#16120f] tracking-[-0.2px]">{MN[month]} {year}</span>
        {showNext
          ? <button className={navBtn} onClick={onNext} type="button" title="Next month">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M4.5 2L8 6l-3.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          : <span className="w-7" />}
      </div>

      <div className="grid grid-cols-7 mb-0.5">
        {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d => (
          <span key={d} className="text-center text-[11.5px] font-medium text-[#a09e9a] py-1">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7" onMouseLeave={() => onHov(null)}>
        {days.map(({ date, cur }, i) => {
          const isToday = cur && sameDay(date, todD);
          const isStart = !isSingle && sameDay(date, eS);
          const isEnd   = !isSingle && sameDay(date, eE);
          const isSel   = isSingle  && sameDay(date, eS);
          const inRng   = !isSingle && between(date, eS, eE);
          const showCirc  = isStart || isEnd || isSel;
          const showStrip = (isStart || isEnd || inRng) && !isSingle;

          return (
            <div
              key={i}
              className={`group relative flex flex-col items-center justify-center h-9 select-none ${cur ? "cursor-pointer" : "cursor-default"}`}
              onClick={() => cur && onDay(date)}
              onMouseEnter={() => cur && onHov(date)}
            >
              {showStrip && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-8 bg-[rgba(255,61,20,0.08)] pointer-events-none z-0"
                  style={{ left: isStart ? "50%" : 0, right: isEnd ? "50%" : 0 }}
                />
              )}
              <span className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-[13px] transition-colors duration-100 ${
                !cur       ? "text-[#a09e9a]" :
                showCirc   ? "bg-[#ff3d14] text-white font-[550]" :
                             "text-[#16120f] group-hover:bg-[#f2f2f0]"
              }`}>
                {date.getDate()}
              </span>
              {isToday && (
                <span className={`absolute bottom-0.5 z-20 pointer-events-none w-[3.5px] h-[3.5px] rounded-full ${showCirc ? "bg-white/80" : "bg-[#ff3d14]"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── DatePicker dropdown ───────────────────────────────────────
interface DatePickerProps {
  initS: Date | null; initE: Date | null; initPreset: string | null;
  onApply: (s: Date, e: Date, pr: string | null) => void;
  onCancel: () => void;
}

function DatePicker({ initS, initE, initPreset, onApply, onCancel }: DatePickerProps) {
  const ref = initE ?? todayDate();
  const initLY = ref.getMonth() === 0 ? ref.getFullYear() - 1 : ref.getFullYear();
  const initLM = ref.getMonth() === 0 ? 11 : ref.getMonth() - 1;

  const [vYear, setVYear] = useState(initLY);
  const [vMonth, setVMonth] = useState(initLM);
  const [selS, setSelS] = useState<Date | null>(initS);
  const [selE, setSelE] = useState<Date | null>(initE);
  const [picking, setPicking] = useState(false);
  const [hov, setHov] = useState<Date | null>(null);
  const [actPr, setActPr] = useState<string | null>(initPreset ?? null);
  const [inpS, setInpS] = useState(fmtFull(initS));
  const [inpE, setInpE] = useState(fmtFull(initE));

  useEffect(() => { setInpS(fmtFull(selS)); }, [selS]);
  useEffect(() => { setInpE(fmtFull(selE)); }, [selE]);

  let rYear = vYear, rMonth = vMonth + 1;
  if (rMonth > 11) { rMonth = 0; rYear++; }

  function onDay(d: Date) {
    if (!picking || !selS) { setSelS(d); setSelE(null); setPicking(true); setActPr(null); }
    else {
      const [s, e] = d >= selS ? [selS, d] : [d, selS];
      setSelS(s); setSelE(e); setPicking(false); setActPr(null);
    }
  }
  function onPreset(p: { id: string }) {
    const [s, e] = rangeOf(p.id);
    setSelS(s); setSelE(e); setPicking(false); setActPr(p.id);
    setVYear(e.getMonth() === 0 ? e.getFullYear() - 1 : e.getFullYear());
    setVMonth(e.getMonth() === 0 ? 11 : e.getMonth() - 1);
  }
  function prevM() { if (vMonth === 0) { setVMonth(11); setVYear(y => y - 1); } else setVMonth(m => m - 1); }
  function nextM() { if (vMonth === 11) { setVMonth(0); setVYear(y => y + 1); } else setVMonth(m => m + 1); }

  const inputCls = "px-[10px] py-[5px] rounded-[6px] border border-[rgba(22,18,15,0.20)] bg-[#fffdf9] text-[#16120f] text-[13px] w-[122px] outline-none transition-all duration-[120ms] focus:border-[#ff3d14] focus:shadow-[0_0_0_3px_rgba(255,61,20,0.12)]";

  return (
    <div className="absolute top-[calc(100%+8px)] right-0 z-[1000] bg-[#fffdf9] border border-[rgba(22,18,15,0.12)] rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.10),0_1px_3px_rgba(0,0,0,0.06),0_10px_40px_rgba(0,0,0,0.11)] flex flex-col min-w-[680px] [animation:acb-in_0.12s_ease-out]" onClick={e => e.stopPropagation()}>
      <div className="flex">
        {/* Sidebar */}
        <div className="w-[150px] shrink-0 border-r border-[rgba(22,18,15,0.12)] px-1.5 py-[10px] flex flex-col gap-px">
          {SIDEBAR_PRESETS.map(p => (
            <button key={p.id} type="button"
              className={`w-full px-[10px] py-[7px] rounded-[6px] border-0 text-[13px] text-left cursor-pointer transition-all duration-100 ${actPr === p.id ? "bg-[#f2f2f0] text-[#16120f] font-semibold" : "bg-transparent text-[#6c6259] font-normal hover:bg-[#f2f2f0] hover:text-[#16120f]"}`}
              onClick={() => onPreset(p)}>
              {p.label}
            </button>
          ))}
        </div>
        {/* Calendars */}
        <div className="flex-1 flex px-6 py-5 gap-9">
          <CalMonth year={vYear} month={vMonth} rS={selS} rE={selE} hov={hov} picking={picking} onDay={onDay} onHov={setHov} onPrev={prevM} showPrev showNext={false} />
          <CalMonth year={rYear} month={rMonth} rS={selS} rE={selE} hov={hov} picking={picking} onDay={onDay} onHov={setHov} onNext={nextM} showPrev={false} showNext />
        </div>
      </div>
      {/* Footer */}
      <div className="flex items-center gap-2 px-5 py-3 border-t border-[rgba(22,18,15,0.12)]">
        <input className={inputCls} value={inpS} onChange={ev => { setInpS(ev.target.value); const d = parseD(ev.target.value); if (d) { setSelS(d); setActPr(null); } }} placeholder="Start date" />
        <span className="text-[#a09e9a] text-sm">—</span>
        <input className={inputCls} value={inpE} onChange={ev => { setInpE(ev.target.value); const d = parseD(ev.target.value); if (d) { setSelE(d); setActPr(null); } }} placeholder="End date" />
        <div className="ml-auto flex gap-2">
          <button type="button"
            className="flex items-center gap-1.5 px-[14px] py-[7px] border border-[rgba(22,18,15,0.20)] rounded-[6px] bg-[#fffdf9] text-[#6c6259] text-[13px] font-medium cursor-pointer transition-all duration-[120ms] whitespace-nowrap hover:text-[#16120f] hover:bg-[#f2f2f0]"
            onClick={onCancel}>
            Cancel
          </button>
          <button type="button"
            className="flex items-center gap-1.5 px-[14px] py-[7px] border-0 rounded-[6px] bg-[#ff3d14] text-white text-[13px] font-medium cursor-pointer transition-opacity duration-[120ms] whitespace-nowrap hover:opacity-[0.88] disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={!selS || !selE}
            onClick={() => { if (selS && selE) onApply(selS, selE, actPr); }}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CompRow ───────────────────────────────────────────────────
function CompRow({ on, toggle, type, setType, start, end }: {
  on: boolean; toggle: () => void; type: string; setType: (t: string) => void;
  start: Date | null; end: Date | null;
}) {
  const [cs, ce] = useMemo(() => compOf(start, end, type), [start, end, type]);
  return (
    <div className="flex items-center gap-[10px] flex-wrap px-[14px] pt-[7px] pb-2 border-t border-[rgba(22,18,15,0.12)] rounded-b-[10px] bg-[#f9f8f5]">
      <span className="text-[12.5px] text-[#6c6259] font-[450] whitespace-nowrap">Compare</span>

      <button type="button"
        className={`w-[34px] h-[19px] rounded-[10px] border-0 cursor-pointer relative shrink-0 transition-colors duration-200 ${on ? "bg-[#ff3d14]" : "bg-[rgba(22,18,15,0.20)]"}`}
        onClick={toggle}>
        <div className={`absolute w-[13px] h-[13px] rounded-full bg-white top-[3px] transition-[left] duration-[180ms] shadow-[0_1px_2px_rgba(0,0,0,0.2)] ${on ? "left-[18px]" : "left-[3px]"}`} />
      </button>

      {on && (
        <>
          <div className="flex gap-[3px]">
            {COMP_OPTIONS.map(o => (
              <button key={o.id} type="button"
                className={`px-[10px] py-[3px] rounded-[5px] text-[12px] border cursor-pointer transition-all duration-100 whitespace-nowrap ${
                  type === o.id
                    ? "bg-[#fffdf9] border-[rgba(22,18,15,0.20)] text-[#16120f] font-[500]"
                    : "border-[rgba(22,18,15,0.12)] bg-transparent text-[#6c6259] font-[450] hover:text-[#16120f] hover:bg-[#fffdf9]"
                }`}
                onClick={() => setType(o.id)}>
                {o.label}
              </button>
            ))}
          </div>
          {cs && ce && (
            <span className="text-[11.5px] text-[#a09e9a] font-mono bg-[#fffdf9] border border-[rgba(22,18,15,0.12)] rounded-[5px] px-[9px] py-0.5 ml-auto whitespace-nowrap">
              <strong className="text-[#6c6259] font-[500]">{fmtShort(cs)} – {fmtFull(ce)}</strong>
            </span>
          )}
        </>
      )}
    </div>
  );
}

// ── AnalyticsControlBar ───────────────────────────────────────
export default function AnalyticsControlBar({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const [start, setStart] = useState<Date | null>(() => parseIso(from));
  const [end,   setEnd]   = useState<Date | null>(() => parseIso(to));
  const [preset, setPreset] = useState<string | null>(null);
  const [open, setOpen]   = useState(false);
  const [comp, setComp]   = useState("previous");
  const [showComp, setShowComp] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function onRange(s: Date, e: Date, pr: string | null) {
    setStart(s); setEnd(e); setPreset(pr);
    router.push(`?from=${toIso(s)}&to=${toIso(e)}`);
  }

  return (
    <div ref={barRef} className="relative z-[200] bg-[#fffdf9] border-b border-[rgba(22,18,15,0.12)]">

      {/* Main row */}
      <div className="flex items-center px-3 py-2 gap-1">
        {/* Quick pills */}
        <div className="flex gap-0.5">
          {PILLS.map(p => (
            <button key={p.id} type="button"
              className={`px-[11px] py-[5px] rounded-md text-[13px] border cursor-pointer whitespace-nowrap transition-all duration-100 ${
                preset === p.id
                  ? "bg-[#f2f2f0] border-[rgba(22,18,15,0.20)] text-[#16120f] font-[550]"
                  : "border-transparent bg-transparent text-[#6c6259] font-[450] hover:bg-[#f2f2f0] hover:text-[#16120f]"
              }`}
              onClick={() => { const [s, e] = rangeOf(p.id); onRange(s, e, p.id); setOpen(false); }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="w-px h-[18px] bg-[rgba(22,18,15,0.12)] mx-2 shrink-0" />

        {/* Date range trigger */}
        <div className="relative ml-auto">
          <button type="button"
            className={`flex items-center gap-[7px] px-3 py-[5px] rounded-[7px] border-[1.5px] bg-[#fffdf9] text-[13px] font-[450] cursor-pointer whitespace-nowrap transition-all duration-[140ms] ${
              open
                ? "border-[#ff3d14] shadow-[0_0_0_3px_rgba(255,61,20,0.12)] text-[#ff3d14]"
                : "border-[rgba(22,18,15,0.20)] text-[#16120f] hover:border-[#ff3d14]"
            }`}
            onClick={() => setOpen(o => !o)}>
            <svg className={`shrink-0 transition-colors duration-[140ms] ${open ? "text-[#ff3d14]" : "text-[#a09e9a]"}`} width="13" height="13" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M2 7h12" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            {fmtTrigger(start, end)}
            <svg className="text-[#a09e9a] shrink-0" width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {open && (
            <DatePicker initS={start} initE={end} initPreset={preset}
              onApply={(s, e, pr) => { onRange(s, e, pr); setOpen(false); }}
              onCancel={() => setOpen(false)} />
          )}
        </div>
      </div>

      {/* Comparison row */}
      <CompRow on={showComp} toggle={() => setShowComp(v => !v)} type={comp} setType={setComp} start={start} end={end} />
    </div>
  );
}
