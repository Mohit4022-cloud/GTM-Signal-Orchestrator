import { randomUUID } from "node:crypto";

import { AuditEventType, Prisma, type PrismaClient } from "@prisma/client";

type ScoringAuditClient = Prisma.TransactionClient | PrismaClient;

type AuditPayload = {
  eventType: AuditEventType;
  entityType: string;
  entityId: string;
  accountId?: string | null;
  leadId?: string | null;
  actorType?: string;
  actorName?: string;
  explanation: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
};

const DEFAULT_ACTOR_TYPE = "system";
const DEFAULT_ACTOR_NAME = "Scoring Engine";

async function createScoringAuditLog(client: ScoringAuditClient, payload: AuditPayload) {
  return client.auditLog.create({
    data: {
      id: randomUUID(),
      eventType: payload.eventType,
      actorType: payload.actorType ?? DEFAULT_ACTOR_TYPE,
      actorName: payload.actorName ?? DEFAULT_ACTOR_NAME,
      entityType: payload.entityType,
      entityId: payload.entityId,
      accountId: payload.accountId ?? null,
      leadId: payload.leadId ?? null,
      beforeState: payload.beforeState
        ? (payload.beforeState as Prisma.InputJsonValue)
        : undefined,
      afterState: payload.afterState ? (payload.afterState as Prisma.InputJsonValue) : undefined,
      explanation: payload.explanation,
    },
  });
}

export function recordScoreRecomputed(
  client: ScoringAuditClient,
  params: {
    entityType: "account" | "lead";
    entityId: string;
    accountId?: string | null;
    leadId?: string | null;
    explanation: string;
    beforeState: Record<string, unknown>;
    afterState: Record<string, unknown>;
  },
) {
  return createScoringAuditLog(client, {
    eventType: AuditEventType.SCORE_RECOMPUTED,
    entityType: params.entityType,
    entityId: params.entityId,
    accountId: params.accountId,
    leadId: params.leadId,
    explanation: params.explanation,
    beforeState: params.beforeState,
    afterState: params.afterState,
  });
}

export function recordScoreThresholdCrossed(
  client: ScoringAuditClient,
  params: {
    entityType: "account" | "lead";
    entityId: string;
    accountId?: string | null;
    leadId?: string | null;
    previousTemperature: string;
    newTemperature: string;
    newScore: number;
  },
) {
  return createScoringAuditLog(client, {
    eventType: AuditEventType.SCORE_THRESHOLD_CROSSED,
    entityType: params.entityType,
    entityId: params.entityId,
    accountId: params.accountId,
    leadId: params.leadId,
    explanation: `Score temperature changed from ${params.previousTemperature} to ${params.newTemperature} at ${params.newScore}.`,
    beforeState: {
      temperature: params.previousTemperature,
    },
    afterState: {
      temperature: params.newTemperature,
      score: params.newScore,
    },
  });
}

export function recordScoreManualPriorityOverridden(
  client: ScoringAuditClient,
  params: {
    entityType: "account" | "lead";
    entityId: string;
    accountId?: string | null;
    leadId?: string | null;
    actorType: string;
    actorName: string;
    previousBoost: number;
    newBoost: number;
    note?: string | null;
  },
) {
  return createScoringAuditLog(client, {
    eventType: AuditEventType.SCORE_MANUAL_PRIORITY_OVERRIDDEN,
    entityType: params.entityType,
    entityId: params.entityId,
    accountId: params.accountId,
    leadId: params.leadId,
    actorType: params.actorType,
    actorName: params.actorName,
    explanation:
      params.note && params.note.trim().length > 0
        ? `Manual priority boost changed from ${params.previousBoost} to ${params.newBoost}. ${params.note.trim()}`
        : `Manual priority boost changed from ${params.previousBoost} to ${params.newBoost}.`,
    beforeState: {
      manualPriorityBoost: params.previousBoost,
    },
    afterState: {
      manualPriorityBoost: params.newBoost,
      note: params.note ?? null,
    },
  });
}

export function recordSignalAttachedAndRescored(
  client: ScoringAuditClient,
  params: {
    signalId: string;
    accountId?: string | null;
    leadId?: string | null;
    explanation: string;
    beforeState: Record<string, unknown>;
    afterState: Record<string, unknown>;
  },
) {
  return createScoringAuditLog(client, {
    eventType: AuditEventType.SIGNAL_ATTACHED_AND_RESCORED,
    entityType: "signal_event",
    entityId: params.signalId,
    accountId: params.accountId,
    leadId: params.leadId,
    explanation: params.explanation,
    beforeState: params.beforeState,
    afterState: params.afterState,
  });
}
