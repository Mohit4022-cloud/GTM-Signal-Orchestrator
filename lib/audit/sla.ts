import { randomUUID } from "node:crypto";

import { AuditEventType, Prisma, type PrismaClient } from "@prisma/client";

type SlaAuditClient = Prisma.TransactionClient | PrismaClient;

type SlaAuditPayload = {
  eventType: AuditEventType;
  entityType: string;
  entityId: string;
  accountId?: string | null;
  leadId?: string | null;
  explanation: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
};

const ACTOR_TYPE = "system";
const ACTOR_NAME = "SLA Engine";

async function createSlaAuditLog(client: SlaAuditClient, payload: SlaAuditPayload) {
  return client.auditLog.create({
    data: {
      id: randomUUID(),
      eventType: payload.eventType,
      actorType: ACTOR_TYPE,
      actorName: ACTOR_NAME,
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

export function recordSlaAssigned(
  client: SlaAuditClient,
  params: {
    entityType: "lead" | "task";
    entityId: string;
    accountId?: string | null;
    leadId?: string | null;
    explanation: string;
    afterState: Record<string, unknown>;
  },
) {
  return createSlaAuditLog(client, {
    eventType: AuditEventType.SLA_ASSIGNED,
    entityType: params.entityType,
    entityId: params.entityId,
    accountId: params.accountId,
    leadId: params.leadId,
    explanation: params.explanation,
    afterState: params.afterState,
  });
}

export function recordSlaBreached(
  client: SlaAuditClient,
  params: {
    entityType: "lead" | "task";
    entityId: string;
    accountId?: string | null;
    leadId?: string | null;
    explanation: string;
    beforeState: Record<string, unknown>;
    afterState: Record<string, unknown>;
  },
) {
  return createSlaAuditLog(client, {
    eventType: AuditEventType.SLA_BREACHED,
    entityType: params.entityType,
    entityId: params.entityId,
    accountId: params.accountId,
    leadId: params.leadId,
    explanation: params.explanation,
    beforeState: params.beforeState,
    afterState: params.afterState,
  });
}

export function recordSlaResolved(
  client: SlaAuditClient,
  params: {
    entityType: "lead" | "task";
    entityId: string;
    accountId?: string | null;
    leadId?: string | null;
    explanation: string;
    beforeState: Record<string, unknown>;
    afterState: Record<string, unknown>;
  },
) {
  return createSlaAuditLog(client, {
    eventType: AuditEventType.SLA_RESOLVED,
    entityType: params.entityType,
    entityId: params.entityId,
    accountId: params.accountId,
    leadId: params.leadId,
    explanation: params.explanation,
    beforeState: params.beforeState,
    afterState: params.afterState,
  });
}
