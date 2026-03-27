import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentPropsWithoutRef<"section">) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-border bg-panel shadow-[var(--shadow-sm)]",
        className,
      )}
      {...props}
    />
  );
}
