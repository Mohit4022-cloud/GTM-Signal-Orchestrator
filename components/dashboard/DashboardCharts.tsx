"use client";

import dynamic from "next/dynamic";

import type { DashboardTrendPoint, SlaHealthPoint } from "@/lib/types";

const SignalVolumeChart = dynamic(
  () => import("@/components/dashboard/SignalVolumeChart").then((mod) => mod.SignalVolumeChart),
  {
    ssr: false,
    loading: () => <div className="h-[280px] rounded-3xl bg-panel-muted/60" />,
  },
);

const SlaHealthChart = dynamic(
  () => import("@/components/dashboard/SlaHealthChart").then((mod) => mod.SlaHealthChart),
  {
    ssr: false,
    loading: () => <div className="h-[280px] rounded-3xl bg-panel-muted/60" />,
  },
);

type DashboardChartsProps =
  | {
      kind: "signals";
      data: DashboardTrendPoint[];
    }
  | {
      kind: "sla";
      data: SlaHealthPoint[];
    };

export function DashboardCharts(props: DashboardChartsProps) {
  if (props.kind === "signals") {
    return <SignalVolumeChart data={props.data} />;
  }

  return <SlaHealthChart data={props.data} />;
}
