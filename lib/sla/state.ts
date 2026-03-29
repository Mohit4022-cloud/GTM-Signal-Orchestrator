import type { LeadSlaSnapshotContract, SlaCurrentState, TaskSlaSnapshotContract } from "@/lib/contracts/sla";

type CommonSlaStateInput = {
  isTracked: boolean;
  policyKey: string | null;
  policyVersion: string | null;
  targetMinutes: number | null;
  dueAt: Date | null;
  breachedAt: Date | null;
  completedAt: Date | null;
  now: Date;
  paused?: boolean;
};

type CommonSlaStateResult = {
  currentState: SlaCurrentState;
  timeRemainingMs: number | null;
  timeRemainingSeconds: number | null;
  metSla: boolean | null;
  explanation: string;
};

function getCompletionExplanation(metSla: boolean | null) {
  if (metSla === true) {
    return "Completed within SLA.";
  }

  if (metSla === false) {
    return "Completed after the SLA deadline.";
  }

  return "Completed.";
}

export function getDueSoonThresholdMs(targetMinutes: number | null, isTracked: boolean) {
  if (!isTracked) {
    return 60 * 60 * 1000;
  }

  if (targetMinutes === null) {
    return 60 * 60 * 1000;
  }

  if (targetMinutes <= 30) {
    return 5 * 60 * 1000;
  }

  if (targetMinutes <= 240) {
    return 30 * 60 * 1000;
  }

  return 120 * 60 * 1000;
}

export function computeSlaState(input: CommonSlaStateInput): CommonSlaStateResult {
  const timeRemainingMs = input.dueAt ? input.dueAt.getTime() - input.now.getTime() : null;
  const timeRemainingSeconds =
    timeRemainingMs === null ? null : Math.trunc(timeRemainingMs / 1000);

  if (input.paused) {
    return {
      currentState: "paused",
      timeRemainingMs,
      timeRemainingSeconds,
      metSla: null,
      explanation: "SLA tracking is paused.",
    };
  }

  if (input.completedAt) {
    const metSla =
      input.dueAt === null ? null : input.completedAt.getTime() <= input.dueAt.getTime();
    return {
      currentState: "completed",
      timeRemainingMs: input.dueAt ? 0 : null,
      timeRemainingSeconds: input.dueAt ? 0 : null,
      metSla,
      explanation: getCompletionExplanation(metSla),
    };
  }

  if (!input.isTracked && input.dueAt === null) {
    return {
      currentState: "on_track",
      timeRemainingMs: null,
      timeRemainingSeconds: null,
      metSla: null,
      explanation: "No SLA policy is assigned.",
    };
  }

  if (input.breachedAt) {
    return {
      currentState: "breached",
      timeRemainingMs,
      timeRemainingSeconds,
      metSla: false,
      explanation: "SLA breached and awaiting resolution.",
    };
  }

  if (timeRemainingMs !== null && timeRemainingMs < 0) {
    return {
      currentState: "overdue",
      timeRemainingMs,
      timeRemainingSeconds,
      metSla: null,
      explanation: input.isTracked
        ? "Past the SLA deadline and awaiting breach processing."
        : "Past the due date.",
    };
  }

  if (
    timeRemainingMs !== null &&
    timeRemainingMs <= getDueSoonThresholdMs(input.targetMinutes, input.isTracked)
  ) {
    return {
      currentState: "due_soon",
      timeRemainingMs,
      timeRemainingSeconds,
      metSla: null,
      explanation: "Approaching the SLA deadline.",
    };
  }

  return {
    currentState: "on_track",
    timeRemainingMs,
    timeRemainingSeconds,
    metSla: null,
    explanation: input.isTracked ? "Within SLA." : "Within the current due window.",
  };
}

export function buildLeadSlaSnapshot(input: {
  isTracked: boolean;
  policyKey: string | null;
  policyVersion: string | null;
  targetMinutes: number | null;
  dueAt: Date | null;
  breachedAt: Date | null;
  firstResponseAt: Date | null;
  routedAt: Date | null;
  now: Date;
}): LeadSlaSnapshotContract {
  const state = computeSlaState({
    isTracked: input.isTracked,
    policyKey: input.policyKey,
    policyVersion: input.policyVersion,
    targetMinutes: input.targetMinutes,
    dueAt: input.dueAt,
    breachedAt: input.breachedAt,
    completedAt: input.firstResponseAt,
    now: input.now,
  });

  return {
    isTracked: input.isTracked,
    policyKey: input.policyKey,
    policyVersion: input.policyVersion,
    slaTargetMinutes: input.targetMinutes,
    dueAtIso: input.dueAt?.toISOString() ?? null,
    currentState: state.currentState,
    timeRemainingSeconds: state.timeRemainingSeconds,
    timeRemainingMs: state.timeRemainingMs,
    breachedAtIso: input.breachedAt?.toISOString() ?? null,
    metSla: state.metSla,
    explanation: state.explanation,
    firstResponseAtIso: input.firstResponseAt?.toISOString() ?? null,
    routedAtIso: input.routedAt?.toISOString() ?? null,
  };
}

export function buildTaskSlaSnapshot(input: {
  isTracked: boolean;
  policyKey: string | null;
  policyVersion: string | null;
  targetMinutes: number | null;
  dueAt: Date | null;
  breachedAt: Date | null;
  completedAt: Date | null;
  now: Date;
}): TaskSlaSnapshotContract {
  const state = computeSlaState({
    isTracked: input.isTracked,
    policyKey: input.policyKey,
    policyVersion: input.policyVersion,
    targetMinutes: input.targetMinutes,
    dueAt: input.dueAt,
    breachedAt: input.breachedAt,
    completedAt: input.completedAt,
    now: input.now,
  });

  return {
    isTracked: input.isTracked,
    policyKey: input.policyKey,
    policyVersion: input.policyVersion,
    slaTargetMinutes: input.targetMinutes,
    dueAtIso: input.dueAt?.toISOString() ?? null,
    currentState: state.currentState,
    timeRemainingSeconds: state.timeRemainingSeconds,
    timeRemainingMs: state.timeRemainingMs,
    breachedAtIso: input.breachedAt?.toISOString() ?? null,
    metSla: state.metSla,
    explanation: state.explanation,
    completedAtIso: input.completedAt?.toISOString() ?? null,
  };
}
