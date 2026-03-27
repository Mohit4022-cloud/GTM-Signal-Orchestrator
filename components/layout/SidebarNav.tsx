"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/shared/Badge";
import { NAV_ITEMS } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

type SidebarNavProps = {
  className?: string;
  onNavigate?: () => void;
};

export function SidebarNav({ className, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-panel/90 backdrop-blur-xl",
        className,
      )}
    >
      <div className="border-b border-border px-5 py-5">
        <div className="flex items-start gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-accent/15 bg-accent-muted text-sm font-semibold text-accent">
            GS
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">GTM Signal Orchestrator</p>
            <p className="text-sm leading-6 text-muted-foreground">
              Local-first GTM operations workspace
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-start gap-3 rounded-2xl border px-3 py-3.5",
                active
                  ? "border-accent/20 bg-accent-muted text-foreground"
                  : "border-transparent text-muted-foreground hover:border-border hover:bg-panel-muted/80 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border",
                  active
                    ? "border-accent/10 bg-panel text-accent"
                    : "border-border bg-panel group-hover:text-accent",
                )}
              >
                <Icon className="size-4.5" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{item.label}</span>
                  {!item.implemented ? <Badge tone="neutral">Soon</Badge> : null}
                </span>
                <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                  {item.description}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Workspace mode
        </p>
        <p className="mt-2 text-sm leading-6 text-foreground">Read-only local seed on SQLite</p>
      </div>
    </aside>
  );
}
