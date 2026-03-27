"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
} from "recharts";

export type FunnelData = {
  messagesSent: number;
  ordersMade: number; // clients who ordered at least once after message
};

function formatPercent(n: number) {
  return `${(n * 100).toFixed(0)}%`;
}

export default function LeadWhatsappFunnel({
  data,
  height = 350,
  title = "Lead WhatsApp Funnel",
}: {
  data: FunnelData;
  height?: number;
  title?: string;
}) {
  const messages = Math.max(0, data.messagesSent ?? 0);
  const ordered = Math.max(0, data.ordersMade ?? 0);

  const conversion = messages > 0 ? ordered / messages : 0;

  const chartData = [
    { step: "Mensagens", value: messages },
    { step: "Pedidos", value: ordered },
  ];

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-center mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>

      </div>

      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 40, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="step" width={120} />
            <Tooltip formatter={(v) => [v, "Count"]} />
            <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 8, 8]}>
              <LabelList dataKey="value" position="right" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>


    </div>
  );
}
