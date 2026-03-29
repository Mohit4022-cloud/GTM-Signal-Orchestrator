import { randomUUID } from "node:crypto";

import { Prisma, type PrismaClient } from "@prisma/client";

import type { AuditActorType, AuditWritePayload } from "@/lib/contracts/audit";

type AuditClient = Prisma.TransactionClient | PrismaClient;

function toJsonValue(value: Record<string, unknown> | string[]) {
  return value as Prisma.InputJsonValue;
}

function normalizeActorType(value: AuditActorType | string | undefined): AuditActorType {
  return value === "user" ? "user" : "system";
}

export async function createAuditLog(client: AuditClient, payload: AuditWritePayload) {
  return client.auditLog.create({
    data: {
      id: randomUUID(),
      eventType: payload.eventType,
      actorType: normalizeActorType(payload.actor.type),
      actorId: payload.actor.id ?? null,
      actorName: payload.actor.name,
      action: payload.action,
      entityType: payload.entity.type,
      entityId: payload.entity.id,
      accountId: payload.entity.accountId ?? null,
      leadId: payload.entity.leadId ?? null,
      beforeState: payload.before ? toJsonValue(payload.before) : undefined,
      afterState: payload.after ? toJsonValue(payload.after) : undefined,
      reasonCodesJson: toJsonValue(payload.reasonCodes),
      explanation: payload.explanation,
      createdAt: payload.createdAt,
    },
  });
}
