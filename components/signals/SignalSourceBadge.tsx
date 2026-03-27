type SignalSourceBadgeProps = {
  source: string;
};

/**
 * Inline micro-chip showing the signal's source system.
 * Intentionally lighter weight than a Badge — uses a plain <span>
 * so it sits at a lower visual hierarchy than status badges.
 * Class tokens from MASTER.md: "Source / system chip (inline in timeline)".
 */
export function SignalSourceBadge({ source }: SignalSourceBadgeProps) {
  return (
    <span className="rounded-lg border border-border bg-panel px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {source}
    </span>
  );
}
