"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export type AvgTicketByMonthPoint = {
  month: string;      // "YYYY-MM"
  avgTicket: number;  // e.g. 42.35
  orders?: number;    // optional
  revenue?: number;   // optional
};

function formatMonthLabel(yyyyMm: string) {
  // "2026-01" -> "Jan"
  const [y, m] = yyyyMm.split("-").map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleString("en-US", { month: "short" });
}

function formatMoney(v: unknown) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function AvgTicketLineChart({
  data,
  height = 350,
}: {
  data: AvgTicketByMonthPoint[];
  height?: number;
}) {
  return (
    <div style={{ width: "100%", height }} className="flex items-center flex-col">
      <h2 className="text-lg font-semibold mb-4">
        Ticket Médio por Mês
       </h2>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonthLabel}
          />
          <YAxis
            tickFormatter={(v) => `$${v}`}
            width={60}
          />
          <Tooltip
            formatter={(value, name, props) => {
              if (name === "avgTicket") return [formatMoney(value), "Avg Ticket"];
              if (name === "revenue") return [formatMoney(value), "Revenue"];
              if (name === "orders") return [value, "Orders"];
              return [value, name];
            }}
            labelFormatter={(label) => label} // keep "YYYY-MM"
          />
          <Line
            type="monotone"
            dataKey="avgTicket"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
