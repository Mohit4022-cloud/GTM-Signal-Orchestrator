import { ArrowRight } from "lucide-react";

import { Card } from "@/components/shared/Card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  change: string;
  tone?: "default" | "positive" | "warning" | "danger";
};

const accentMap = {
  default: "text-accent",
  positive: "text-success",
  warning: "text-warning",
  danger: "text-danger",
} as const;

export function MetricCard({ label, value, change, tone = "default" }: MetricCardProps) {
  return (
    <Card className="rounded-[28px] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <p className="font-mono text-3xl font-semibold tracking-tight text-foreground">{value}</p>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium",
            accentMap[tone],
          )}
        >
          {change}
          <ArrowRight className="size-3.5" />
        </span>
      </div>
    </Card>
  );
}
