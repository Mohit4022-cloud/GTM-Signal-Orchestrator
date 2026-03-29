import { SlaEntityType, TaskStatus, type PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import type { SlaEventContract } from "@/lib/contracts/sla";
import { buildLeadSlaSnapshot, buildTaskSlaSnapshot } from "@/lib/sla/state";

type SlaClient = Prisma.TransactionClient | PrismaClient;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getEventExplanation(value: unknown) {
  if (!isRecord(value)) {
    return "SLA event recorded.";
  }

  return typeof value.summary === "string" ? value.summary : "SLA event recorded.";
}

function toContractEntityType(value: SlaEntityType) {
  switch (value) {
    case SlaEntityType.LEAD:
      return "lead";
    case SlaEntityType.TASK:
      return "task";
    case SlaEntityType.ACCOUNT:
      return "account";
  }
}

function toContractEventType(value: import("@prisma/client").SlaEventType) {
  switch (value) {
    case "ASSIGNED":
      return "assigned";
    case "STATE_CHANGED":
      return "state_changed";
    case "BREACHED":
      return "breached";
    case "MET":
      return "met";
    case "RESOLVED":
      return "resolved";
    case "ESCALATION_CREATED":
      return "escalation_created";
  }
}

export function mapSlaEventContract(row: {
  id: string;
  entityType: SlaEntityType;
  entityId: string;
  accountId: string | null;
  leadId: string | null;
  taskId: string | null;
  eventType: import("@prisma/client").SlaEventType;
  policyVersion: string | null;
  policyKey: string | null;
  targetMinutes: number | null;
  dueAt: Date | null;
  breachedAt: Date | null;
  resolvedAt: Date | null;
  explanationJson: unknown;
  createdAt: Date;
}): SlaEventContract {
  return {
    id: row.id,
    entityType: toContractEntityType(row.entityType),
    entityId: row.entityId,
    accountId: row.accountId,
    leadId: row.leadId,
    taskId: row.taskId,
    eventType: toContractEventType(row.eventType),
    policyVersion: row.policyVersion,
    policyKey: row.policyKey,
    targetMinutes: row.targetMinutes,
    dueAtIso: row.dueAt?.toISOString() ?? null,
    breachedAtIso: row.breachedAt?.toISOString() ?? null,
    resolvedAtIso: row.resolvedAt?.toISOString() ?? null,
    explanation: getEventExplanation(row.explanationJson),
    createdAtIso: row.createdAt.toISOString(),
  };
}

export async function getSlaEventsForEntity(
  client: SlaClient,
  params: {
    entityType: "lead" | "task" | "account";
    entityId: string;
    limit?: number;
  },
) {
  const entityType =
    params.entityType === "lead"
      ? SlaEntityType.LEAD
      : params.entityType === "task"
        ? SlaEntityType.TASK
        : SlaEntityType.ACCOUNT;

  const rows = await client.slaEvent.findMany({
    where: {
      entityType,
      entityId: params.entityId,
    },
    take: params.limit,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      entityType: true,
      entityId: true,
      accountId: true,
      leadId: true,
      taskId: true,
      eventType: true,
      policyVersion: true,
      policyKey: true,
      targetMinutes: true,
      dueAt: true,
      breachedAt: true,
      resolvedAt: true,
      explanationJson: true,
      createdAt: true,
    },
  });

  return rows.map(mapSlaEventContract);
}

export function mapLeadSlaSnapshot(row: {
  slaPolicyKey: string | null;
  slaPolicyVersion: string | null;
  slaTargetMinutes: number | null;
  slaDeadlineAt: Date | null;
  slaBreachedAt: Date | null;
  firstResponseAt: Date | null;
  routedAt: Date | null;
}, now: Date) {
  return buildLeadSlaSnapshot({
    isTracked: row.slaTargetMinutes !== null && row.slaDeadlineAt !== null,
    policyKey: row.slaPolicyKey,
    policyVersion: row.slaPolicyVersion,
    targetMinutes: row.slaTargetMinutes,
    dueAt: row.slaDeadlineAt,
    breachedAt: row.slaBreachedAt,
    firstResponseAt: row.firstResponseAt,
    routedAt: row.routedAt,
    now,
  });
}

export function mapTaskSlaSnapshot(row: {
  isSlaTracked: boolean;
  slaPolicyKey: string | null;
  slaPolicyVersion: string | null;
  slaTargetMinutes: number | null;
  dueAt: Date;
  slaBreachedAt: Date | null;
  completedAt: Date | null;
  status?: TaskStatus;
}, now: Date) {
  return buildTaskSlaSnapshot({
    isTracked: row.isSlaTracked,
    policyKey: row.slaPolicyKey,
    policyVersion: row.slaPolicyVersion,
    targetMinutes: row.slaTargetMinutes,
    dueAt: row.dueAt,
    breachedAt: row.slaBreachedAt,
    completedAt:
      row.status === TaskStatus.COMPLETED && row.completedAt === null ? now : row.completedAt,
    now,
  });
}
