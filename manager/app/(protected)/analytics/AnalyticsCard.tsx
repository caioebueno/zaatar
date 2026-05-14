"use client";

import { useState } from "react";

type Format = "currency" | "currency2" | "integer" | "percent";

function fmtValue(v: number, format: Format): string {
  if (format === "currency") {
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}k`;
    return `$${Math.round(v).toLocaleString()}`;
  }
  if (format === "currency2") return `$${v.toFixed(2)}`;
  if (format === "integer")   return Math.round(v).toLocaleString();
  if (format === "percent")   return `${v.toFixed(1)}%`;
  return String(v);
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (data.length < 2) return null;
  const W = 72, H = 26, PAD = 2;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
      const y = PAD + ((max - v) / range) * (H - PAD * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block overflow-visible shrink-0">
      <polyline
        points={pts}
        fill="none"
        stroke={positive ? "#0ea87a" : "#d44c4c"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface AnalyticsCardProps {
  label: string;
  value: number;
  format?: Format;
  sparkData?: number[];
  previous?: number | null;
  compPeriod?: string;
}

export default function AnalyticsCard({
  label,
  value,
  format = "currency",
  sparkData = [],
  previous = null,
  compPeriod = "vs previous period",
}: AnalyticsCardProps) {
  const [hovered, setHovered] = useState(false);

  const change   = previous != null ? ((value - previous) / Math.abs(previous)) * 100 : null;
  const positive = change == null || change >= 0;
  const neutral  = change != null && Math.abs(change) < 0.5;
  const arrow    = neutral ? "→" : positive ? "↑" : "↓";

  const badgeColor = neutral ? "#8b6cf0"               : positive ? "#0ea87a"              : "#d44c4c";
  const badgeBg    = neutral ? "rgba(139,108,240,0.10)" : positive ? "rgba(14,168,122,0.10)" : "rgba(212,76,76,0.09)";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`bg-white border border-[rgba(22,18,15,0.12)] rounded-[10px] pt-5 px-[22px] pb-[18px] flex flex-col gap-[11px] cursor-default transition-shadow duration-[180ms] ${
        hovered
          ? "shadow-[0_4px_14px_rgba(0,0,0,0.10),0_1px_3px_rgba(0,0,0,0.06)]"
          : "shadow-[0_1px_3px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)]"
      }`}
    >
      {/* Label + sparkline */}
      <div className="flex items-start justify-between gap-3">
        <span className="text-[12.5px] font-medium text-[#6b6a66] tracking-[0.01em] leading-[1.3]">
          {label}
        </span>
        {sparkData.length > 1 && (
          <div className="opacity-85 mt-px">
            <Sparkline data={sparkData} positive={positive} />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="font-mono text-[28px] font-medium tracking-[-0.8px] text-[#1c1c1a] leading-none">
        {fmtValue(value, format)}
      </div>

      {/* Comparison row */}
      {change != null && (
        <div className="flex items-center gap-[7px] flex-wrap">
          <span
            className="inline-flex items-center gap-[3px] text-[12px] font-semibold rounded-[4px] px-[7px] py-[2px] shrink-0 tabular-nums"
            style={{ background: badgeBg, color: badgeColor }}
          >
            {arrow} {Math.abs(change).toFixed(1)}%
          </span>
          <span className="text-[12px] text-[#a09e9a] leading-[1.3]">
            {compPeriod}
            <span className="font-mono ml-[5px] tabular-nums">
              · prev {fmtValue(previous!, format)}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
