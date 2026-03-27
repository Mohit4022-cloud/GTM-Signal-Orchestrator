"use client";

import { format } from "date-fns";
import { DatabaseZap, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/shared/Badge";
import { MobileNavSheet } from "@/components/layout/MobileNavSheet";
import { getRouteMeta } from "@/lib/constants/navigation";

export function TopHeader() {
  const pathname = usePathname();
  const meta = getRouteMeta(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-[1480px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <MobileNavSheet />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Revenue operations
            </p>
            <h2 className="truncate text-lg font-semibold text-foreground">{meta.title}</h2>
            <p className="hidden truncate text-sm text-muted-foreground md:block">{meta.subtitle}</p>
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Badge tone="accent">
            <DatabaseZap className="mr-1 size-3.5" />
            Local Seed
          </Badge>
          <Badge tone="neutral">
            <ShieldCheck className="mr-1 size-3.5" />
            SQLite workspace
          </Badge>
          <div className="rounded-2xl border border-border bg-panel px-4 py-2 text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Snapshot date
            </p>
            <p className="font-mono text-sm font-medium text-foreground">
              {format(new Date("2026-03-26T15:00:00.000Z"), "MMM d, yyyy")}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
