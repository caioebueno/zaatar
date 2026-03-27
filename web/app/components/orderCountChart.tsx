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

export type ClientOrdersDatum = {
  orders: string;   // e.g. "1", "2", "3"
  clients: number;  // e.g. 120
};

export default function OrderCountChart({
  data,
  height = 350,
}: {
  data: ClientOrdersDatum[];
  height?: number;
}) {
  return (
    <div style={{ width: "100%", height }} className="flex items-center flex-col">
      <h2 className="text-lg font-semibold mb-4">
        Quantidade de Pedido por Clintes
       </h2>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="orders"
            label={{ value: "Pedidos", position: "insideBottom", offset: -5 }}
          />
          <YAxis
            label={{ value: "Clients", angle: -90, position: "insideLeft" }}
          />
          <Tooltip />
          <Bar dataKey="clients" fill="#6366f1" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
