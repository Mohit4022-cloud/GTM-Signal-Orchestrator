import { AuditEventType, type Prisma, type PrismaClient } from "@prisma/client";

import { createAuditLog } from "@/lib/audit/shared";

type RulesAuditClient = Prisma.TransactionClient | PrismaClient;

type RulesAuditPayload = {
  eventType: AuditEventType;
  action: string;
  actorType?: "system" | "user";
  actorId?: string | null;
  actorName?: string;
  entityType: string;
  entityId: string;
  accountId?: string | null;
  leadId?: string | null;
  explanation: string;
  reasonCodes?: string[];
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  createdAt?: Date;
};

async function createRulesAuditLog(
  client: RulesAuditClient,
  payload: RulesAuditPayload,
) {
  return createAuditLog(client, {
    eventType: payload.eventType,
    action: payload.action,
    actor: {
      type: payload.actorType ?? "system",
      id: payload.actorId ?? null,
      name: payload.actorName ?? "Rules Engine",
    },
    entity: {
      type: payload.entityType,
      id: payload.entityId,
      accountId: payload.accountId,
      leadId: payload.leadId,
    },
    explanation: payload.explanation,
    reasonCodes: payload.reasonCodes ?? [],
    before: payload.beforeState,
    after: payload.afterState,
    createdAt: payload.createdAt,
  });
}

export function recordRuleConfigChanged(
  client: RulesAuditClient,
  params: {
    ruleConfigId: string;
    ruleType: string;
    version: string;
    explanation: string;
    reasonCodes?: string[];
    beforeState?: Record<string, unknown> | null;
    afterState?: Record<string, unknown> | null;
    createdAt?: Date;
    actorType?: "system" | "user";
    actorId?: string | null;
    actorName?: string;
  },
) {
  return createRulesAuditLog(client, {
    eventType: AuditEventType.RULE_CONFIG_CHANGED,
    action: "rule_config_changed",
    actorType: params.actorType,
    actorId: params.actorId,
    actorName: params.actorName,
    entityType: "rule_config",
    entityId: params.ruleConfigId,
    explanation: params.explanation,
    reasonCodes: params.reasonCodes ?? [],
    beforeState: params.beforeState,
    afterState: {
      ruleType: params.ruleType,
      version: params.version,
      ...(params.afterState ?? {}),
    },
    createdAt: params.createdAt,
  });
}

export function recordUserOverride(
  client: RulesAuditClient,
  params: {
    entityType: string;
    entityId: string;
    accountId?: string | null;
    leadId?: string | null;
    actorType?: "system" | "user";
    actorId?: string | null;
    actorName: string;
    explanation: string;
    reasonCodes?: string[];
    beforeState?: Record<string, unknown> | null;
    afterState?: Record<string, unknown> | null;
    createdAt?: Date;
  },
) {
  return createRulesAuditLog(client, {
    eventType: AuditEventType.USER_OVERRIDE,
    action: "user_override",
    actorType: params.actorType ?? "user",
    actorId: params.actorId ?? null,
    actorName: params.actorName,
    entityType: params.entityType,
    entityId: params.entityId,
    accountId: params.accountId,
    leadId: params.leadId,
    explanation: params.explanation,
    reasonCodes: params.reasonCodes ?? [],
    beforeState: params.beforeState,
    afterState: params.afterState,
    createdAt: params.createdAt,
  });
}
