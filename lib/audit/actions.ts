import { randomUUID } from "node:crypto";

import { AuditEventType, Prisma, type PrismaClient } from "@prisma/client";

type ActionAuditClient = Prisma.TransactionClient | PrismaClient;

type ActionAuditPayload = {
  eventType: AuditEventType;
  entityType: string;
  entityId: string;
  accountId?: string | null;
  leadId?: string | null;
  explanation: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
};

async function createActionAuditLog(
  client: ActionAuditClient,
  payload: ActionAuditPayload,
) {
  return client.auditLog.create({
    data: {
      id: randomUUID(),
      eventType: payload.eventType,
      actorType: "system",
      actorName: "Action Engine",
      entityType: payload.entityType,
      entityId: payload.entityId,
      accountId: payload.accountId ?? null,
      leadId: payload.leadId ?? null,
      beforeState: payload.beforeState
        ? (payload.beforeState as Prisma.InputJsonValue)
        : undefined,
      afterState: payload.afterState
        ? (payload.afterState as Prisma.InputJsonValue)
        : undefined,
      explanation: payload.explanation,
    },
  });
}

export function recordTaskCreated(
  client: ActionAuditClient,
  params: {
    taskId: string;
    entityType: "lead" | "account";
    entityId: string;
    accountId?: string | null;
    leadId?: string | null;
    explanation: string;
    afterState: Record<string, unknown>;
  },
) {
  return createActionAuditLog(client, {
    eventType: AuditEventType.TASK_CREATED,
    entityType: "task",
    entityId: params.taskId,
    accountId: params.accountId,
    leadId: params.leadId,
    explanation: params.explanation,
    afterState: {
      ...params.afterState,
      sourceEntityType: params.entityType,
      sourceEntityId: params.entityId,
    },
  });
}

export function recordTaskUpdated(
  client: ActionAuditClient,
  params: {
    taskId: string;
    entityType: "lead" | "account";
    entityId: string;
    accountId?: string | null;
    leadId?: string | null;
    explanation: string;
    beforeState: Record<string, unknown>;
    afterState: Record<string, unknown>;
  },
) {
  return createActionAuditLog(client, {
    eventType: AuditEventType.TASK_UPDATED,
    entityType: "task",
    entityId: params.taskId,
    accountId: params.accountId,
    leadId: params.leadId,
    explanation: params.explanation,
    beforeState: {
      ...params.beforeState,
      sourceEntityType: params.entityType,
      sourceEntityId: params.entityId,
    },
    afterState: params.afterState,
  });
}

export function recordActionRecommendationCreated(
  client: ActionAuditClient,
  params: {
    recommendationId: string;
    entityType: "lead" | "account";
    entityId: string;
    accountId?: string | null;
    leadId?: string | null;
    explanation: string;
    afterState: Record<string, unknown>;
  },
) {
  return createActionAuditLog(client, {
    eventType: AuditEventType.ACTION_RECOMMENDATION_CREATED,
    entityType: "action_recommendation",
    entityId: params.recommendationId,
    accountId: params.accountId,
    leadId: params.leadId,
    explanation: params.explanation,
    afterState: {
      ...params.afterState,
      sourceEntityType: params.entityType,
      sourceEntityId: params.entityId,
    },
  });
}

export function recordDuplicateActionPrevented(
  client: ActionAuditClient,
  params: {
    entityType: "lead" | "account";
    entityId: string;
    accountId?: string | null;
    leadId?: string | null;
    explanation: string;
    afterState: Record<string, unknown>;
  },
) {
  return createActionAuditLog(client, {
    eventType: AuditEventType.DUPLICATE_ACTION_PREVENTED,
    entityType: params.entityType,
    entityId: params.entityId,
    accountId: params.accountId,
    leadId: params.leadId,
    explanation: params.explanation,
    afterState: params.afterState,
  });
}

export function recordActionGenerationSkipped(
  client: ActionAuditClient,
  params: {
    entityType: "lead" | "account";
    entityId: string;
    accountId?: string | null;
    leadId?: string | null;
    explanation: string;
    afterState: Record<string, unknown>;
  },
) {
  return createActionAuditLog(client, {
    eventType: AuditEventType.ACTION_GENERATION_SKIPPED,
    entityType: params.entityType,
    entityId: params.entityId,
    accountId: params.accountId,
    leadId: params.leadId,
    explanation: params.explanation,
    afterState: params.afterState,
  });
}
