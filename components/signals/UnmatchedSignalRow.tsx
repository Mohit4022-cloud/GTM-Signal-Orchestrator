import { Badge } from "@/components/shared/Badge";
import { getSignalReasonTone } from "@/lib/badgeHelpers";
import { formatRelativeTime } from "@/lib/formatters/display";
import type { UnmatchedSignalQueueItemContract } from "@/lib/contracts/signals";
import { cn } from "@/lib/utils";
import { SignalSourceBadge } from "./SignalSourceBadge";

// ─── AttributeChip (inline helper, not exported) ───────────────────────────

type AttributeChipProps = {
  label: string;
  value: string;
  /** If true, renders value in muted italic style (candidate is absent) */
  muted?: boolean;
};

function AttributeChip({ label, value, muted = false }: AttributeChipProps) {
  return (
    <div className="rounded-xl border border-border bg-panel-muted/80 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-sm font-medium",
          muted ? "italic text-muted-foreground" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

type UnmatchedSignalRowProps = {
  signal: UnmatchedSignalQueueItemContract;
};

/**
 * A single row in the unmatched signals ops review queue.
 *
 * Layout (all on a `rounded-2xl` inner card):
 *   Row 1 — display title + source chip | relative timestamp
 *   Row 2 — account domain chip + contact email chip
 *   Row 3 — primary reason badge + recommended queue badge
 *   Row 4 — payload summary (muted text)
 *
 * Read-only. No attach / review actions — backend does not yet expose
 * a mutation endpoint. Surfaces all inspection data for operator review.
 */
export function UnmatchedSignalRow({ signal }: UnmatchedSignalRowProps) {
  const reasonTone = getSignalReasonTone(signal.primaryReason.tone);
  const relativeTime = formatRelativeTime(signal.occurredAtIso);

  return (
    <div className="rounded-2xl border border-border bg-panel-muted/70 p-4">
      {/* Row 1: title + source | timestamp */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="font-semibold text-foreground">{signal.displayTitle}</p>
          <SignalSourceBadge source={signal.sourceSystemLabel} />
        </div>
        <time
          dateTime={signal.occurredAtIso}
          className="shrink-0 text-xs text-muted-foreground"
        >
          {relativeTime}
        </time>
      </div>

      {/* Row 2: attribute chips */}
      <div className="mt-3 flex flex-wrap gap-3">
        <AttributeChip
          label="Account domain"
          value={signal.accountDomainDisplay}
          muted={signal.accountDomainCandidate === null}
        />
        <AttributeChip
          label="Contact email"
          value={signal.contactEmailDisplay}
          muted={signal.contactEmailCandidate === null}
        />
      </div>

      {/* Row 3: reason badge + queue badge */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge tone={reasonTone}>{signal.primaryReason.label}</Badge>
        <Badge tone="accent">{signal.recommendedQueue}</Badge>
      </div>

      {/* Row 4: payload summary */}
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {signal.normalizedSummary.payloadSummary}
      </p>
    </div>
  );
}
