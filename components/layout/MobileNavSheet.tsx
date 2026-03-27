"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { SidebarNav } from "@/components/layout/SidebarNav";
import { cn } from "@/lib/utils";

export function MobileNavSheet() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex size-11 items-center justify-center rounded-2xl border border-border bg-panel text-foreground lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </button>

      <div
        className={cn(
          "fixed inset-0 z-50 bg-[#102130]/35 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-[88vw] max-w-[320px] transition-transform",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-16 items-center justify-end border-b border-border bg-panel px-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex size-10 items-center justify-center rounded-2xl border border-border bg-panel-muted text-foreground"
              aria-label="Close navigation"
            >
              <X className="size-4.5" />
            </button>
          </div>
          <SidebarNav className="h-[calc(100%-4rem)]" onNavigate={() => setOpen(false)} />
        </div>
        <button
          type="button"
          aria-label="Close navigation overlay"
          className="absolute inset-0 -z-10"
          onClick={() => setOpen(false)}
        />
      </div>
    </>
  );
}
