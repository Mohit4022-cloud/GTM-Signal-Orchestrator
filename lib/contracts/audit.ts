import type { AuditEventType } from "@prisma/client";

export const auditActorTypeValues = ["system", "user"] as const;

export type AuditActorType = (typeof auditActorTypeValues)[number];

export type AuditActorContract = {
  type: AuditActorType;
  id: string | null;
  name: string;
};

export type AuditEntitySummaryContract = {
  type: string;
  id: string;
};

export type AuditStateSummaryContract = {
  raw: Record<string, unknown> | null;
  summary: string;
};

export type AuditReasonSummaryContract = {
  codes: string[];
  summary: string;
};

export type AuditLogEntryContract = {
  id: string;
  eventType: AuditEventType;
  timestampIso: string;
  timestampLabel: string;
  actor: AuditActorContract;
  action: string;
  entity: AuditEntitySummaryContract;
  before: AuditStateSummaryContract;
  after: AuditStateSummaryContract;
  reason: AuditReasonSummaryContract;
  explanation: string;
};

export type AuditLogQueryOptions = {
  limit?: number;
};

export type AuditWriteActor = AuditActorContract;

export type AuditWriteEntity = AuditEntitySummaryContract & {
  accountId?: string | null;
  leadId?: string | null;
};

export type AuditWritePayload = {
  eventType: AuditEventType;
  action: string;
  actor: AuditWriteActor;
  entity: AuditWriteEntity;
  explanation: string;
  reasonCodes: string[];
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  createdAt?: Date;
};
