import { AuditEventType, type Prisma, type PrismaClient } from "@prisma/client";

import { createAuditLog } from "@/lib/audit/shared";
import type { AiProviderMetadataContract } from "@/lib/contracts/ai";

type AiAuditClient = Prisma.TransactionClient | PrismaClient;

type AiEntityType = "account" | "lead";

type AiAuditPayload = {
  eventType: AuditEventType;
  action: string;
  entityType: AiEntityType;
  entityId: string;
  accountId?: string | null;
  leadId?: string | null;
  explanation: string;
  reasonCodes?: string[];
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  createdAt?: Date;
};

const ACTOR_NAME = "AI Assist";

async function createAiAuditLog(client: AiAuditClient, payload: AiAuditPayload) {
  return createAuditLog(client, {
    eventType: payload.eventType,
    action: payload.action,
    actor: {
      type: "system",
      id: null,
      name: ACTOR_NAME,
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

function buildProviderState(provider: AiProviderMetadataContract | null | undefined) {
  return {
    providerName: provider?.name ?? null,
    providerModel: provider?.model ?? null,
  };
}

export function recordAiAccountSummaryGenerated(
  client: AiAuditClient,
  params: {
    accountId: string;
    explanation: string;
    provider: AiProviderMetadataContract | null;
    afterState: Record<string, unknown>;
    reasonCodes?: string[];
    createdAt?: Date;
  },
) {
  return createAiAuditLog(client, {
    eventType: AuditEventType.AI_ACCOUNT_SUMMARY_GENERATED,
    action: "ai_account_summary_generated",
    entityType: "account",
    entityId: params.accountId,
    accountId: params.accountId,
    explanation: params.explanation,
    reasonCodes: params.reasonCodes,
    createdAt: params.createdAt,
    afterState: {
      ...buildProviderState(params.provider),
      ...params.afterState,
    },
  });
}

export function recordAiActionNoteGenerated(
  client: AiAuditClient,
  params: {
    leadId: string;
    accountId?: string | null;
    explanation: string;
    provider: AiProviderMetadataContract | null;
    afterState: Record<string, unknown>;
    reasonCodes?: string[];
    createdAt?: Date;
  },
) {
  return createAiAuditLog(client, {
    eventType: AuditEventType.AI_ACTION_NOTE_GENERATED,
    action: "ai_action_note_generated",
    entityType: "lead",
    entityId: params.leadId,
    accountId: params.accountId,
    leadId: params.leadId,
    explanation: params.explanation,
    reasonCodes: params.reasonCodes,
    createdAt: params.createdAt,
    afterState: {
      ...buildProviderState(params.provider),
      ...params.afterState,
    },
  });
}

export function recordAiGenerationFailed(
  client: AiAuditClient,
  params: {
    entityType: AiEntityType;
    entityId: string;
    accountId?: string | null;
    leadId?: string | null;
    explanation: string;
    provider: AiProviderMetadataContract | null;
    afterState?: Record<string, unknown> | null;
    reasonCodes?: string[];
    createdAt?: Date;
  },
) {
  return createAiAuditLog(client, {
    eventType: AuditEventType.AI_GENERATION_FAILED,
    action: "ai_generation_failed",
    entityType: params.entityType,
    entityId: params.entityId,
    accountId: params.accountId,
    leadId: params.leadId,
    explanation: params.explanation,
    reasonCodes: params.reasonCodes,
    createdAt: params.createdAt,
    afterState: {
      ...buildProviderState(params.provider),
      ...(params.afterState ?? {}),
    },
  });
}
