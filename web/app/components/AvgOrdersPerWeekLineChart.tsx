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
import { parse, format } from "date-fns";

export type CustomerFreqByMonthPoint = {
  month: string; // "YYYY-MM"
  activeCustomers: number;
  totalOrders: number;
  weeks: number;
  avgOrdersPerCustomerPerWeek: number;
};

const monthTick = (yyyyMm: string) =>
  format(parse(yyyyMm, "yyyy-MM", new Date()), "MMM");

export default function AvgOrdersPerWeekLineChart({
  data,
  height = 350,
  title = "Avg Orders per Customer per Week",
}: {
  data: CustomerFreqByMonthPoint[];
  height?: number;
  title?: string;
}) {
  return (
    <div style={{ width: "100%", height }} className="flex items-center flex-col">
      <h2 className="text-lg font-semibold mb-4">
        Frequencia por Semana
       </h2>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={monthTick} />
            <YAxis tickFormatter={(v) => Number(v).toFixed(2)} width={60} />
            <Tooltip
              labelFormatter={(label) => monthTick(String(label))}
              formatter={(value, name, props) => {
                const p = props?.payload as CustomerFreqByMonthPoint | undefined;

                if (name === "avgOrdersPerCustomerPerWeek") {
                  return [Number(value).toFixed(2), "Avg / Customer / Week"];
                }

                // We show these even though they aren't plotted, via tooltip payload
                if (name === "activeCustomers") return [p?.activeCustomers ?? value, "Active Customers"];
                if (name === "totalOrders") return [p?.totalOrders ?? value, "Total Orders"];
                if (name === "weeks") return [Number(p?.weeks ?? value).toFixed(2), "Weeks in Month"];

                return [value as any, name];
              }}
            />

            {/* Main line */}
            <Line
              type="monotone"
              dataKey="avgOrdersPerCustomerPerWeek"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>




    </div>
  );
}
