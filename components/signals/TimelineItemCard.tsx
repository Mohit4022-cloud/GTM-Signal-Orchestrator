import {
  Activity,
  BarChart2,
  Calendar,
  CalendarCheck,
  CalendarX,
  FileText,
  Globe,
  Mail,
  Radar,
  RefreshCw,
  TrendingUp,
  UserPlus,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { TimelineEvent } from "@/lib/types";
import { SignalSourceBadge } from "./SignalSourceBadge";
import { SignalStatusBadge } from "./SignalStatusBadge";

/**
 * Stable icon component keyed from human-readable backend labels.
 * Keeping the branching inside a component avoids render-time component creation.
 */
function EventTypeIcon({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  let Icon: LucideIcon = Activity;

  if (title.includes("Pricing Page")) Icon = TrendingUp;
  else if (title.includes("Website Visit")) Icon = Globe;
  else if (title.includes("High Intent Page")) Icon = Zap;
  else if (title.includes("Form Fill")) Icon = FileText;
  else if (title.includes("Webinar")) Icon = Calendar;
  else if (title.includes("Product Signup")) Icon = UserPlus;
  else if (title.includes("Product Usage")) Icon = BarChart2;
  else if (title.includes("Email Reply")) Icon = Mail;
  else if (title.includes("Meeting Booked")) Icon = CalendarCheck;
  else if (title.includes("Meeting No Show")) Icon = CalendarX;
  else if (title.includes("Intent Event")) Icon = Radar;
  else if (title.includes("Sales Note")) Icon = FileText;
  else if (title.includes("Status Update")) Icon = RefreshCw;

  return <Icon className={className} aria-hidden="true" />;
}

// ─── Dot color map ──────────────────────────────────────────────────────────

/**
 * Returns the full Tailwind class string for the timeline dot
 * based on the event's status label.
 * Full class strings required here so Tailwind JIT can detect them.
 */
function getDotClasses(status: string): string {
  if (status === "Matched") return "border-success bg-success/20";
  if (status === "Unmatched") return "border-warning bg-warning/20";
  if (status === "Error") return "border-danger bg-danger/20";
  return "border-accent bg-accent/20"; // Received, Normalized, or unknown
}

// ─── Component ──────────────────────────────────────────────────────────────

type TimelineItemCardProps = {
  event: TimelineEvent;
  isLast: boolean;
};

/**
 * A single item in the account signal timeline.
 *
 * Layout:
 *   Left  — status-colored dot with a vertical connector line (hidden for last item)
 *   Right — compact info card: event title + icon, status badge, source chip,
 *            timestamp, and one-line description
 *
 * Design tokens from MASTER.md: inner row card, source chip, badge tones.
 */
export function TimelineItemCard({ event, isLast }: TimelineItemCardProps) {
  const dotClasses = getDotClasses(event.status);

  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {/* ── Left column: status dot + connector line ── */}
      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            "relative z-10 mt-1.5 size-2.5 shrink-0 rounded-full border-2",
            dotClasses,
          )}
          aria-hidden="true"
        />
        {!isLast && (
          <div className="mt-0.5 w-px flex-1 bg-border" aria-hidden="true" />
        )}
      </div>

      {/* ── Right column: info card ── */}
      <div className="min-w-0 flex-1 rounded-2xl border border-border bg-panel-muted/70 px-4 py-3">
        {/* Row 1: title + icon on left, status badge on right */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <EventTypeIcon
              title={event.title}
              className="size-4 shrink-0 text-muted-foreground"
            />
            <p className="font-semibold text-foreground">{event.title}</p>
          </div>
          <SignalStatusBadge status={event.status} />
        </div>

        {/* Row 2: source chip + timestamp */}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <SignalSourceBadge source={event.sourceSystem} />
          <span className="text-xs text-muted-foreground">{event.occurredAt}</span>
        </div>

        {/* Row 3: description */}
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {event.description}
        </p>
      </div>
    </div>
  );
}
