export const slaCurrentStateValues = [
  "on_track",
  "due_soon",
  "overdue",
  "breached",
  "completed",
  "paused",
] as const;

export type SlaCurrentState = (typeof slaCurrentStateValues)[number];

export const slaEntityTypeValues = ["lead", "task", "account"] as const;

export type SlaEntityType = (typeof slaEntityTypeValues)[number];

export const slaEventTypeValues = [
  "assigned",
  "state_changed",
  "breached",
  "met",
  "resolved",
  "escalation_created",
] as const;

export type SlaEventType = (typeof slaEventTypeValues)[number];

export type SlaSnapshotContract = {
  isTracked: boolean;
  policyKey: string | null;
  policyVersion: string | null;
  slaTargetMinutes: number | null;
  dueAtIso: string | null;
  currentState: SlaCurrentState;
  timeRemainingSeconds: number | null;
  timeRemainingMs: number | null;
  breachedAtIso: string | null;
  metSla: boolean | null;
  explanation: string;
};

export type LeadSlaSnapshotContract = SlaSnapshotContract & {
  firstResponseAtIso: string | null;
  routedAtIso: string | null;
};

export type TaskSlaSnapshotContract = SlaSnapshotContract & {
  completedAtIso: string | null;
};

export type DashboardSlaBucketMetricsContract = {
  openTrackedCount: number;
  dueSoonCount: number;
  dueTodayCount: number;
  overdueCount: number;
  breachedCount: number;
};

export type DashboardLeadSlaMetricsContract = DashboardSlaBucketMetricsContract & {
  averageSpeedToLeadMinutes: number | null;
  attainmentRate: number | null;
};

export type DashboardAggregateSlaMetricsContract = {
  dueSoonCount: number;
  dueTodayCount: number;
  overdueCount: number;
  breachedCount: number;
};

export type DashboardSlaSummaryContract = {
  asOfIso: string;
  leadMetrics: DashboardLeadSlaMetricsContract;
  taskMetrics: DashboardSlaBucketMetricsContract;
  aggregateMetrics: DashboardAggregateSlaMetricsContract;
};

export type SlaEventContract = {
  id: string;
  entityType: SlaEntityType;
  entityId: string;
  accountId: string | null;
  leadId: string | null;
  taskId: string | null;
  eventType: SlaEventType;
  policyVersion: string | null;
  policyKey: string | null;
  targetMinutes: number | null;
  dueAtIso: string | null;
  breachedAtIso: string | null;
  resolvedAtIso: string | null;
  explanation: string;
  createdAtIso: string;
};
