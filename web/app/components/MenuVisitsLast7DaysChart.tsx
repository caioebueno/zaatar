"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MenuVisitsDailyPoint } from "@/src/chartData/menuVisitsOverview";

type MenuVisitsLast7DaysChartProps = {
  data: MenuVisitsDailyPoint[];
  height?: number;
};

export default function MenuVisitsLast7DaysChart({
  data,
  height = 320,
}: MenuVisitsLast7DaysChartProps) {
  return (
    <div style={{ width: "100%", height }} className="flex flex-col">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900">Visits - Last 7 Days</h2>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="visits"
            stroke="#16a34a"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name="Visits"
          />
          <Line
            type="monotone"
            dataKey="uniqueVisitors"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name="Unique Visitors"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
