import type { ReactNode } from "react";

import { ShellInset } from "@/components/layout/ShellInset";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { TopHeader } from "@/components/layout/TopHeader";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <SidebarNav className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen" />
      <div className="min-w-0">
        <TopHeader />
        <ShellInset>{children}</ShellInset>
      </div>
    </div>
  );
}
