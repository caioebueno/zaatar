"use client";

import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts";
import { format, parseISO } from "date-fns";

export type OrderTotalsLast7DaysPoint = {
  day: string; // YYYY-MM-DD
  total: number; // USD
  orders: number;
};

const dayTick = (yyyyMmDd: string) => format(parseISO(yyyyMmDd), "EEE");

const money = (value: number) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

export default function OrderTotalsLast7DaysBarChart({
  data,
  height = 350,
}: {
  data: OrderTotalsLast7DaysPoint[];
  height?: number;
}) {
  return (
    <div style={{ width: "100%", height }} className="flex items-center flex-col">
      <h2 className="text-lg font-semibold mb-4">Total de Pedidos (Últimos 7 Dias)</h2>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" tickFormatter={dayTick} />
          <YAxis tickFormatter={(v) => `$${v}`} width={70} />
          <Tooltip
            labelFormatter={(label) => format(parseISO(String(label)), "MMM dd, yyyy")}
            formatter={(value, name, props) => {
              if (name === "total") {
                return [money(Number(value)), "Total"];
              }

              if (name === "orders") {
                return [props?.payload?.orders ?? value, "Orders"];
              }

              return [value, name];
            }}
          />
          <Bar dataKey="total" fill="#16a34a" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
