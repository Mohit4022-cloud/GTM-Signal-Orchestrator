"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { SlaHealthPoint } from "@/lib/types";

const toneColor = {
  positive: "#18794e",
  warning: "#b66a1d",
  danger: "#b42318",
  default: "#0f766e",
} as const;

export function SlaHealthChart({ data }: { data: SlaHealthPoint[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#5e6b79", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#5e6b79", fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(20, 32, 43, 0.05)" }}
            contentStyle={{
              borderRadius: 16,
              border: "1px solid rgba(20, 32, 43, 0.12)",
              background: "#ffffff",
              boxShadow: "0 10px 30px rgba(20, 32, 43, 0.08)",
            }}
          />
          <Bar dataKey="value" radius={[16, 16, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.label} fill={toneColor[entry.tone]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
