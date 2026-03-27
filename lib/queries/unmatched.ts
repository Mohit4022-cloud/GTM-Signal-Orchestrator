import { getUnmatchedSignals } from "@/lib/data/signals";
import type { UnmatchedSignalQueueItemContract } from "@/lib/contracts/signals";

export type UnmatchedQueuePageData = {
  signals: UnmatchedSignalQueueItemContract[];
  totalCount: number;
};

/**
 * Fetches the unmatched signals ops review queue for page rendering.
 * Returns up to 50 signals ordered newest-first (handled by the data layer).
 * Next.js workspace-level error boundary catches DB failures.
 */
export async function getUnmatchedQueueData(): Promise<UnmatchedQueuePageData> {
  const signals = await getUnmatchedSignals({ limit: 50 });
  return { signals, totalCount: signals.length };
}
