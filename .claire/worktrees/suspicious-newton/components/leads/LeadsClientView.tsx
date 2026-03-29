"use client";

import { useState } from "react";

import { LeadsTable } from "./LeadsTable";
import type { LeadQueueRowContract, LeadsQueueContract, LeadsTab } from "@/lib/queries/leads";

const TAB_LABELS: Record<LeadsTab, string> = {
  all: "All",
  hot: "Hot",
  overdue_sla: "Overdue SLA",
  unassigned: "Unassigned",
  recently_routed: "Recently Routed",
};

const TAB_ORDER: LeadsTab[] = ["all", "hot", "overdue_sla", "unassigned", "recently_routed"];

type LeadsClientViewProps = {
  data: LeadsQueueContract;
};

export function LeadsClientView({ data }: LeadsClientViewProps) {
  const [activeTab, setActiveTab] = useState<LeadsTab>(data.activeTab);

  const displayedRows = filterRows(data.allRows, activeTab);

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div
        role="tablist"
        aria-label="Lead queue filters"
        className="inline-flex rounded-2xl border border-border bg-panel-muted/70 p-1"
      >
        {TAB_ORDER.map((tab) => {
          const isActive = activeTab === tab;
          const count = data.counts[tab];

          return (
            <button
              key={tab}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab)}
              className={
                isActive
                  ? "inline-flex items-center gap-1.5 rounded-xl bg-panel px-3 py-1.5 text-sm font-semibold text-foreground shadow-[var(--shadow-sm)]"
                  : "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              }
            >
              {TAB_LABELS[tab]}
              <span
                className={`rounded-full px-1.5 text-xs font-semibold ${
                  isActive ? "bg-border/80 text-foreground" : "text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div
        role="tabpanel"
        aria-label={`${TAB_LABELS[activeTab]} leads`}
        className="rounded-3xl border border-border bg-panel shadow-[var(--shadow-sm)] overflow-hidden"
      >
        <LeadsTable rows={displayedRows} activeTab={activeTab} />
      </div>
    </div>
  );
}

function filterRows(allRows: LeadQueueRowContract[], tab: LeadsTab): LeadQueueRowContract[] {
  if (tab === "all") return allRows;

  const now = new Date();

  return allRows.filter((row) => {
    if (tab === "hot") {
      return row.temperature === "URGENT" || row.temperature === "HOT";
    }
    if (tab === "overdue_sla") {
      return row.slaDeadlineAtIso !== null && new Date(row.slaDeadlineAtIso) < now;
    }
    if (tab === "unassigned") {
      return row.currentOwnerName === null;
    }
    if (tab === "recently_routed") {
      if (!row.routedAtIso) return false;
      const routedAt = new Date(row.routedAtIso);
      return routedAt >= new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    return true;
  });
}
