import { Badge } from "@/components/shared/Badge";
import { getSignalStatusTone } from "@/lib/badgeHelpers";

type SignalStatusBadgeProps = {
  status: string;
};

/**
 * Renders a tone-mapped Badge for a signal status string
 * (e.g. "Matched" → positive, "Unmatched" → warning, "Error" → danger).
 * Tone logic lives in lib/badgeHelpers — never inline here.
 */
export function SignalStatusBadge({ status }: SignalStatusBadgeProps) {
  return <Badge tone={getSignalStatusTone(status)}>{status}</Badge>;
}
