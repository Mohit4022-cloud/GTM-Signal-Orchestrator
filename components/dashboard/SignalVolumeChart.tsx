"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { DashboardTrendPoint } from "@/lib/types";

export function SignalVolumeChart({ data }: { data: DashboardTrendPoint[] }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="signal-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0f766e" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#0f766e" stopOpacity={0.04} />
            </linearGradient>
            <linearGradient id="matched-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#1d4ed8" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(20, 32, 43, 0.08)" />
          <XAxis
            dataKey="date"
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
            cursor={{ stroke: "rgba(20, 32, 43, 0.12)", strokeWidth: 1 }}
            contentStyle={{
              borderRadius: 16,
              border: "1px solid rgba(20, 32, 43, 0.12)",
              background: "#ffffff",
              boxShadow: "0 10px 30px rgba(20, 32, 43, 0.08)",
            }}
          />
          <Area
            type="monotone"
            dataKey="matched"
            stroke="#1d4ed8"
            fill="url(#matched-fill)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="signals"
            stroke="#0f766e"
            fill="url(#signal-fill)"
            strokeWidth={2.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
