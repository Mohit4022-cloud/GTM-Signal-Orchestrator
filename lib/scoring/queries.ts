import { ScoreEntityType } from "@prisma/client";

import type {
  EntityScoreBreakdownContract,
  ScoreComponentBreakdownContract,
  ScoreContributorContract,
  ScoreExplanationContract,
  ScoreHistoryListContract,
  ScoreHistoryQueryOptions,
  ScoreHistoryRowContract,
  ScoreReasonCode,
} from "@/lib/contracts/scoring";
import { db } from "@/lib/db";
import { formatEnumLabel } from "@/lib/formatters/display";
import { scoreReasonCodeValues } from "@/lib/scoring/reason-codes";
import { recomputeAccountScore, recomputeLeadScore } from "@/lib/scoring/service";

const scoreReasonCodeSet = new Set<ScoreReasonCode>(scoreReasonCodeValues);

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseContributor(value: unknown): ScoreContributorContract | null {
  if (!isObjectRecord(value)) {
    return null;
  }

  const reasonCode = value.reasonCode;
  const label = value.label;
  const description = value.description;
  const points = value.points;
  const direction = value.direction;

  if (
    typeof reasonCode !== "string" ||
    !scoreReasonCodeSet.has(reasonCode as ScoreReasonCode) ||
    typeof label !== "string" ||
    typeof description !== "string" ||
    typeof points !== "number" ||
    (direction !== "positive" && direction !== "negative")
  ) {
    return null;
  }

  return {
    reasonCode: reasonCode as ScoreReasonCode,
    label,
    description,
    points,
    direction,
  };
}

function parseComponentBreakdown(value: unknown): ScoreComponentBreakdownContract[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.reduce<ScoreComponentBreakdownContract[]>((components, item) => {
    if (!isObjectRecord(item)) {
      return components;
    }

    const key = item.key;
    const label = item.label;
    const score = item.score;
    const maxScore = item.maxScore;
    const reasonCodes = Array.isArray(item.reasonCodes)
      ? item.reasonCodes.filter(
          (reasonCode): reasonCode is ScoreReasonCode =>
            typeof reasonCode === "string" && scoreReasonCodeSet.has(reasonCode as ScoreReasonCode),
        )
      : [];
    const contributors = Array.isArray(item.contributors)
      ? item.contributors
          .map((contributor) => parseContributor(contributor))
          .filter((contributor): contributor is ScoreContributorContract => contributor !== null)
      : [];

    if (
      typeof key !== "string" ||
      typeof label !== "string" ||
      typeof score !== "number" ||
      typeof maxScore !== "number"
    ) {
      return components;
    }

    components.push({
      key: key as ScoreComponentBreakdownContract["key"],
      label,
      score,
      maxScore,
      reasonCodes,
      contributors,
    });

    return components;
  }, []);
}

function parseExplanation(value: unknown): ScoreExplanationContract {
  if (!isObjectRecord(value)) {
    return {
      summary: "Score explanation unavailable.",
      drivers: [],
      cautions: [],
    };
  }

  return {
    summary: typeof value.summary === "string" ? value.summary : "Score explanation unavailable.",
    drivers: Array.isArray(value.drivers) ? value.drivers.filter((item): item is string => typeof item === "string") : [],
    cautions: Array.isArray(value.cautions)
      ? value.cautions.filter((item): item is string => typeof item === "string")
      : [],
  };
}

function parseReasonCodes(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (reasonCode): reasonCode is ScoreReasonCode =>
      typeof reasonCode === "string" && scoreReasonCodeSet.has(reasonCode as ScoreReasonCode),
  );
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
  const componentBreakdown = parseComponentBreakdown(row.scoreBreakdownJson);
  const topContributors = componentBreakdown
    .flatMap((component) => component.contributors)
    .sort((left, right) => Math.abs(right.points) - Math.abs(left.points))
    .slice(0, 5);

  return {
    totalScore: row.overallScore ?? row.score ?? 0,
    temperature: row.temperature,
    componentBreakdown,
    topReasonCodes: parseReasonCodes(row.scoreReasonCodesJson).slice(0, 5),
    topContributors,
    explanation: parseExplanation(row.scoreExplanationJson),
    lastUpdatedAtIso: row.scoreLastComputedAt?.toISOString() ?? null,
    scoringVersion: row.scoringVersion,
  };
}

export async function getAccountScoreBreakdown(accountId: string): Promise<EntityScoreBreakdownContract | null> {
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

export async function getLeadScoreBreakdown(leadId: string): Promise<EntityScoreBreakdownContract | null> {
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
    rows: rows.map<ScoreHistoryRowContract>((row) => ({
      id: row.id,
      entityType: row.entityType,
      entityId: row.entityId,
      previousScore: row.previousScore,
      newScore: row.newScore,
      delta: row.delta,
      previousTemperature: row.previousTemperature,
      newTemperature: row.newTemperature,
      reasonCodes: parseReasonCodes(row.reasonCodesJson),
      componentBreakdown: parseComponentBreakdown(row.componentBreakdownJson),
      explanation: parseExplanation(row.explanationJson),
      createdAtIso: row.createdAt.toISOString(),
      scoringVersion: row.scoringVersion,
      trigger: {
        type: row.triggerType,
        signalId: row.triggerSignalId,
        metadata: isObjectRecord(row.triggerMetadataJson) ? row.triggerMetadataJson : null,
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
    })),
  };
}
