import { AuditEventType, type Prisma, type PrismaClient } from "@prisma/client";

import type {
  CanonicalSignalEventContract,
  IdentityResolutionCode,
  JsonRecord,
} from "@/lib/contracts/signals";
import { createAuditLog } from "@/lib/audit/shared";

type SignalAuditClient = Prisma.TransactionClient | PrismaClient;

type AuditPayload = {
  signalId: string;
  accountId?: string | null;
  leadId?: string | null;
  explanation: string;
  eventType: AuditEventType;
  action: string;
  reasonCodes?: string[];
  beforeState?: JsonRecord | null;
  afterState?: JsonRecord | null;
};

const ACTOR_TYPE = "system";
const ACTOR_NAME = "Signal Pipeline";
const ENTITY_TYPE = "signal_event";

async function createSignalAuditLog(client: SignalAuditClient, payload: AuditPayload) {
  return createAuditLog(client, {
    eventType: payload.eventType,
    action: payload.action,
    actor: {
      type: ACTOR_TYPE,
      id: null,
      name: ACTOR_NAME,
    },
    entity: {
      type: ENTITY_TYPE,
      id: payload.signalId,
      accountId: payload.accountId,
      leadId: payload.leadId,
    },
    explanation: payload.explanation,
    reasonCodes: payload.reasonCodes ?? [],
    before: payload.beforeState,
    after: payload.afterState,
  });
}

export function recordSignalIngested(
  client: SignalAuditClient,
  params: {
    signalId: string;
    accountId?: string | null;
    leadId?: string | null;
    rawPayload: JsonRecord;
  },
) {
  return createSignalAuditLog(client, {
    signalId: params.signalId,
    accountId: params.accountId,
    leadId: params.leadId,
    eventType: AuditEventType.SIGNAL_INGESTED,
    action: "signal_ingested",
    explanation: "Signal ingested into the canonical pipeline.",
    reasonCodes: [],
    afterState: params.rawPayload,
  });
}

export function recordSignalNormalized(
  client: SignalAuditClient,
  params: {
    signalId: string;
    accountId?: string | null;
    leadId?: string | null;
    normalizedEvent: CanonicalSignalEventContract;
  },
) {
  return createSignalAuditLog(client, {
    signalId: params.signalId,
    accountId: params.accountId,
    leadId: params.leadId,
    eventType: AuditEventType.SIGNAL_NORMALIZED,
    action: "signal_normalized",
    explanation: "Signal normalized into the canonical event model.",
    reasonCodes: [],
    afterState: params.normalizedEvent as JsonRecord,
  });
}

export function recordIdentityMatched(
  client: SignalAuditClient,
  params: {
    signalId: string;
    accountId?: string | null;
    leadId?: string | null;
    explanation: string;
    reasonCodes: IdentityResolutionCode[];
    contactId?: string | null;
  },
) {
  return createSignalAuditLog(client, {
    signalId: params.signalId,
    accountId: params.accountId,
    leadId: params.leadId,
    eventType: AuditEventType.IDENTITY_RESOLVED,
    action: "identity_resolved",
    explanation: params.explanation,
    reasonCodes: params.reasonCodes,
    afterState: {
      accountId: params.accountId ?? null,
      contactId: params.contactId ?? null,
      reasonCodes: params.reasonCodes,
    },
  });
}

export function recordSignalUnmatchedQueued(
  client: SignalAuditClient,
  params: {
    signalId: string;
    explanation: string;
    reasonCodes: IdentityResolutionCode[];
  },
) {
  return createSignalAuditLog(client, {
    signalId: params.signalId,
    eventType: AuditEventType.SIGNAL_UNMATCHED_QUEUED,
    action: "signal_unmatched_queued",
    explanation: params.explanation,
    reasonCodes: params.reasonCodes,
    afterState: {
      queue: "unmatched",
      reasonCodes: params.reasonCodes,
    },
  });
}

export function recordSignalDuplicateSkipped(
  client: SignalAuditClient,
  params: {
    signalId: string;
    existingSignalId: string;
    dedupeKey: string;
  },
) {
  return createSignalAuditLog(client, {
    signalId: params.signalId,
    eventType: AuditEventType.SIGNAL_DUPLICATE_SKIPPED,
    action: "signal_duplicate_skipped",
    explanation: `Signal skipped because dedupe key ${params.dedupeKey} already exists on ${params.existingSignalId}.`,
    reasonCodes: [],
    afterState: {
      existingSignalId: params.existingSignalId,
      dedupeKey: params.dedupeKey,
    },
  });
}

export function recordSignalIngestError(
  client: SignalAuditClient,
  params: {
    signalId: string;
    errorMessage: string;
    rawPayload: JsonRecord;
  },
) {
  return createSignalAuditLog(client, {
    signalId: params.signalId,
    eventType: AuditEventType.SIGNAL_INGEST_ERROR,
    action: "signal_ingest_error",
    explanation: `Signal ingest failed: ${params.errorMessage}`,
    reasonCodes: [],
    afterState: {
      rawPayload: params.rawPayload,
      errorMessage: params.errorMessage,
    },
  });
}
