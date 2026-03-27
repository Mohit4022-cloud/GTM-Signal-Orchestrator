import { AlertTriangle, ShieldAlert } from "lucide-react";

import { UnmatchedSignalRow } from "@/components/signals/UnmatchedSignalRow";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/shared/Badge";
import { Card } from "@/components/shared/Card";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { getUnmatchedQueueData } from "@/lib/queries/unmatched";

export const metadata = {
  title: "Unmatched Queue | GTM Signal Orchestrator",
};

// ─── Empty state ────────────────────────────────────────────────────────────

function QueueEmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center px-6 py-16 text-center"
      role="status"
      aria-label="Queue is clear — no unmatched signals"
    >
      <span className="rounded-2xl border border-success/20 bg-success/10 p-3 text-success">
        <ShieldAlert className="size-6" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        Queue is clear
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        All incoming signals have been matched to a known account or contact.
        New unresolved events will appear here automatically.
      </p>
    </div>
  );
}

// ─── Error fallback ──────────────────────────────────────────────────────────

function QueueErrorState() {
  return (
    <div
      className="flex flex-col items-center justify-center px-6 py-16 text-center"
      role="alert"
      aria-label="Error loading unmatched signals"
    >
      <span className="rounded-2xl border border-danger/20 bg-danger/10 p-3 text-danger">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        Could not load queue
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        There was an error fetching the unmatched signals queue. Refresh the
        page to try again, or check the database connection.
      </p>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function UnmatchedQueuePage() {
  let data;
  try {
    data = await getUnmatchedQueueData();
  } catch {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Ops review queue"
          title="Unmatched signals"
          description="Signals that could not be matched to a known account or contact. Review reason codes and route to the appropriate ops queue."
        />
        <Card className="p-6">
          <QueueErrorState />
        </Card>
      </div>
    );
  }

  const countBadge =
    data.totalCount > 0 ? (
      <Badge tone="warning">
        <ShieldAlert className="mr-1.5 size-3.5" aria-hidden="true" />
        {data.totalCount} {data.totalCount === 1 ? "signal" : "signals"} need
        review
      </Badge>
    ) : (
      <Badge tone="positive">Queue clear</Badge>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ops review queue"
        title="Unmatched signals"
        description="Signals that could not be matched to a known account or contact. Review reason codes and route to the appropriate ops queue."
        actions={countBadge}
      />

      <Card className="p-6">
        <SectionHeader
          label="Signal queue"
          title="Unresolved identity signals"
          badge={
            <Badge tone="neutral">
              {data.totalCount}{" "}
              {data.totalCount === 1 ? "signal" : "signals"}
            </Badge>
          }
        />

        <div className="mt-6">
          {data.totalCount === 0 ? (
            <QueueEmptyState />
          ) : (
            <div
              className="space-y-4"
              role="list"
              aria-label="Unmatched signal queue"
            >
              {data.signals.map((signal) => (
                <div key={signal.signalId} role="listitem">
                  <UnmatchedSignalRow signal={signal} />
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
