import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

const toneMap = {
  neutral: "border-border bg-panel-muted text-foreground",
  accent: "border-accent/15 bg-accent-muted text-accent",
  positive: "border-success/15 bg-success/10 text-success",
  warning: "border-warning/15 bg-warning/10 text-warning",
  danger: "border-danger/15 bg-danger/10 text-danger",
} as const;

type BadgeProps = ComponentPropsWithoutRef<"span"> & {
  tone?: keyof typeof toneMap;
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
        toneMap[tone],
        className,
      )}
      {...props}
    />
  );
}
