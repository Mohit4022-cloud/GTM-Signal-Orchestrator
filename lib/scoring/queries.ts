import { ScoreEntityType } from "@prisma/client";

import type {
  EntityScoreBreakdownContract,
  ScoreHistoryListContract,
  ScoreHistoryQueryOptions,
  ScoreHistoryRowContract,
} from "@/lib/contracts/scoring";
import { db } from "@/lib/db";
import { formatEnumLabel } from "@/lib/formatters/display";
import {
  buildScoreReasonCodes,
  buildScoreReasonDetails,
  normalizeEntityScoreBreakdown,
  normalizeScoreComponentBreakdown,
  normalizeScoreExplanation,
} from "@/lib/scoring/normalize";
import { recomputeAccountScore, recomputeLeadScore } from "@/lib/scoring/service";

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function buildBreakdownFromRow(row: {
  overallScore?: number;
  score?: number;
  temperature: EntityScoreBreakdownContract["temperature"];
  scoreBreakdownJson: unknown;
  scoreReasonCodesJson: unknown;
  scoreExplanationJson: unknown;
  scoreLastComputedAt: Date | null;
  scoringVersion: string;
}): EntityScoreBreakdownContract {
  return normalizeEntityScoreBreakdown({
    totalScore: row.overallScore ?? row.score ?? 0,
    temperature: row.temperature,
    componentBreakdown: row.scoreBreakdownJson,
    topReasonCodes: row.scoreReasonCodesJson,
    explanation: row.scoreExplanationJson,
    lastUpdatedAtIso: row.scoreLastComputedAt?.toISOString() ?? null,
    scoringVersion: row.scoringVersion,
  });
}

export async function getAccountScoreBreakdown(
  accountId: string,
): Promise<EntityScoreBreakdownContract | null> {
  const account = await db.account.findUnique({
    where: { id: accountId },
    select: {
      overallScore: true,
      temperature: true,
      scoreBreakdownJson: true,
      scoreReasonCodesJson: true,
      scoreExplanationJson: true,
      scoreLastComputedAt: true,
      scoringVersion: true,
    },
  });

  if (!account) {
    return null;
  }

  if (account.scoreLastComputedAt === null) {
    return recomputeAccountScore(accountId);
  }

  return buildBreakdownFromRow(account);
}

export async function getLeadScoreBreakdown(
  leadId: string,
): Promise<EntityScoreBreakdownContract | null> {
  const lead = await db.lead.findUnique({
    where: { id: leadId },
    select: {
      score: true,
      temperature: true,
      scoreBreakdownJson: true,
      scoreReasonCodesJson: true,
      scoreExplanationJson: true,
      scoreLastComputedAt: true,
      scoringVersion: true,
    },
  });

  if (!lead) {
    return null;
  }

  if (lead.scoreLastComputedAt === null) {
    return recomputeLeadScore(leadId);
  }

  return buildBreakdownFromRow(lead);
}

export async function getScoreHistoryForEntity(
  entityType: ScoreEntityType,
  entityId: string,
  opts: ScoreHistoryQueryOptions = {},
): Promise<ScoreHistoryListContract> {
  const rows = await db.scoreHistory.findMany({
    where: {
      entityType,
      entityId,
    },
    take: opts.limit ?? 20,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      entityType: true,
      entityId: true,
      previousScore: true,
      newScore: true,
      delta: true,
      previousTemperature: true,
      newTemperature: true,
      componentBreakdownJson: true,
      reasonCodesJson: true,
      explanationJson: true,
      createdAt: true,
      scoringVersion: true,
      triggerType: true,
      triggerSignalId: true,
      triggerMetadataJson: true,
      triggerSignal: {
        select: {
          id: true,
          eventType: true,
          occurredAt: true,
          payloadSummary: true,
        },
      },
    },
  });

  return {
    entityType,
    entityId,
    rows: rows.map<ScoreHistoryRowContract>((row) => {
      const componentBreakdown = normalizeScoreComponentBreakdown(
        row.componentBreakdownJson,
      );

      return {
        id: row.id,
        entityType: row.entityType,
        entityId: row.entityId,
        previousScore: row.previousScore,
        newScore: row.newScore,
        delta: row.delta,
        previousTemperature: row.previousTemperature,
        newTemperature: row.newTemperature,
        reasonCodes: buildScoreReasonCodes(componentBreakdown, row.reasonCodesJson),
        reasonDetails: buildScoreReasonDetails(componentBreakdown),
        componentBreakdown,
        explanation: normalizeScoreExplanation(row.explanationJson),
        createdAtIso: row.createdAt.toISOString(),
        scoringVersion: row.scoringVersion,
        trigger: {
          type: row.triggerType,
          signalId: row.triggerSignalId,
          metadata: isObjectRecord(row.triggerMetadataJson)
            ? row.triggerMetadataJson
            : null,
          signalSummary: row.triggerSignal
            ? {
                signalId: row.triggerSignal.id,
                eventType: row.triggerSignal.eventType,
                eventTypeLabel: formatEnumLabel(row.triggerSignal.eventType),
                occurredAtIso: row.triggerSignal.occurredAt.toISOString(),
                payloadSummary: row.triggerSignal.payloadSummary,
              }
            : null,
        },
      };
    }),
  };
}
