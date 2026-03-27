import { SignalStatus } from "@prisma/client";

import type {
  AccountTimelineItemContract,
  GetAccountTimelineOptions,
  GetUnmatchedSignalsFilters,
  IdentityResolutionCode,
  JsonRecord,
  MatchedEntitiesContract,
  RecentSignalFeedItemContract,
  SignalDetailContract,
  SignalNormalizedSummaryContract,
  SignalRawReferenceContract,
  UnmatchedSignalQueueItemContract,
} from "@/lib/contracts/signals";
import { identityResolutionCodeValues } from "@/lib/contracts/signals";
import { db } from "@/lib/db";

import { normalizeSourceSystem } from "./shared";
import {
  buildTimelineDisplaySubtitle,
  buildUnmatchedDisplaySubtitle,
  formatSignalEventLabel,
  getAccountDomainDisplay,
  getContactDisplayName,
  getContactEmailDisplay,
  getPrimarySignalReason,
  getRecommendedQueue,
  getSignalReasonDetails,
  toIsoTimestamp,
} from "./presentation";

const reasonCodeSet = new Set<IdentityResolutionCode>(identityResolutionCodeValues);

function isJsonRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseRawReference(value: unknown): SignalRawReferenceContract {
  if (!isJsonRecord(value) || !isJsonRecord(value.rawReference)) {
    return {};
  }

  return Object.entries(value.rawReference).reduce<SignalRawReferenceContract>((reference, [key, item]) => {
    if (typeof item === "string" && item.length > 0) {
      reference[key] = item;
    }

    return reference;
  }, {});
}

function parseReasonCodes(value: unknown): IdentityResolutionCode[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is IdentityResolutionCode => {
    return typeof item === "string" && reasonCodeSet.has(item as IdentityResolutionCode);
  });
}

function buildMatchedEntities(signal: {
  account: { id: string; name: string } | null;
  contact:
    | {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      }
    | null;
  lead:
    | {
        id: string;
        source: string;
      }
    | null;
}): MatchedEntitiesContract {
  return {
    account: signal.account,
    contact: signal.contact
      ? {
          id: signal.contact.id,
          name: getContactDisplayName(
            signal.contact.firstName,
            signal.contact.lastName,
            signal.contact.email,
          ),
        }
      : null,
    lead: signal.lead
      ? {
          id: signal.lead.id,
          name: signal.lead.source,
        }
      : null,
  };
}

function buildNormalizedSummary(signal: {
  accountDomain: string | null;
  contactEmail: string | null;
  eventCategory: SignalNormalizedSummaryContract["eventCategory"];
  intentStrength: SignalNormalizedSummaryContract["intentStrength"];
  engagementStrength: SignalNormalizedSummaryContract["engagementStrength"];
  payloadSummary: string;
  normalizedPayloadJson: unknown;
}): SignalNormalizedSummaryContract {
  return {
    accountDomain: signal.accountDomain,
    contactEmail: signal.contactEmail,
    eventCategory: signal.eventCategory,
    intentStrength: signal.intentStrength,
    engagementStrength: signal.engagementStrength,
    payloadSummary: signal.payloadSummary,
    rawReference: parseRawReference(signal.normalizedPayloadJson),
  };
}

export async function getRecentSignals(limit = 8): Promise<RecentSignalFeedItemContract[]> {
  const signals = await db.signalEvent.findMany({
    take: limit,
    orderBy: {
      occurredAt: "desc",
    },
    select: {
      id: true,
      sourceSystem: true,
      eventType: true,
      occurredAt: true,
      receivedAt: true,
      status: true,
      dedupeKey: true,
      accountDomain: true,
      contactEmail: true,
      eventCategory: true,
      intentStrength: true,
      engagementStrength: true,
      payloadSummary: true,
      normalizedPayloadJson: true,
      identityResolutionCodesJson: true,
      account: {
        select: {
          id: true,
          name: true,
        },
      },
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      lead: {
        select: {
          id: true,
          source: true,
        },
      },
    },
  });

  return signals.map((signal) => ({
    signalId: signal.id,
    sourceSystem: signal.sourceSystem,
    eventType: signal.eventType,
    occurredAtIso: toIsoTimestamp(signal.occurredAt),
    receivedAtIso: toIsoTimestamp(signal.receivedAt),
    status: signal.status,
    dedupeKey: signal.dedupeKey,
    matchedEntities: buildMatchedEntities(signal),
    reasonCodes: parseReasonCodes(signal.identityResolutionCodesJson),
    normalizedSummary: buildNormalizedSummary(signal),
  }));
}

export async function getAccountTimeline(
  accountId: string,
  opts: GetAccountTimelineOptions = {},
): Promise<AccountTimelineItemContract[]> {
  const limit = opts.limit ?? 20;
  const signals = await db.signalEvent.findMany({
    where: {
      accountId,
    },
    take: limit,
    orderBy: [{ occurredAt: "desc" }, { receivedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      eventType: true,
      sourceSystem: true,
      occurredAt: true,
      receivedAt: true,
      status: true,
      accountDomain: true,
      contactEmail: true,
      eventCategory: true,
      intentStrength: true,
      engagementStrength: true,
      payloadSummary: true,
      normalizedPayloadJson: true,
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return signals.map((signal) => ({
    signalId: signal.id,
    eventType: signal.eventType,
    eventTypeLabel: formatSignalEventLabel(signal.eventType),
    sourceSystem: signal.sourceSystem,
    sourceSystemLabel: formatSignalEventLabel(signal.sourceSystem),
    occurredAtIso: toIsoTimestamp(signal.occurredAt),
    receivedAtIso: toIsoTimestamp(signal.receivedAt),
    status: signal.status,
    statusLabel: formatSignalEventLabel(signal.status),
    displayTitle: formatSignalEventLabel(signal.eventType),
    displaySubtitle: buildTimelineDisplaySubtitle(
      signal.payloadSummary,
      signal.contact
        ? getContactDisplayName(signal.contact.firstName, signal.contact.lastName, signal.contact.email)
        : null,
    ),
    normalizedSummary: buildNormalizedSummary(signal),
    associatedContact: signal.contact
      ? {
          id: signal.contact.id,
          name: getContactDisplayName(signal.contact.firstName, signal.contact.lastName, signal.contact.email),
          email: signal.contact.email,
        }
      : null,
  }));
}

export async function getUnmatchedSignals(
  filters: GetUnmatchedSignalsFilters = {},
): Promise<UnmatchedSignalQueueItemContract[]> {
  const limit = filters.limit ?? 25;
  const sourceSystem = filters.sourceSystem ? normalizeSourceSystem(filters.sourceSystem) : undefined;

  const unmatchedSignals = await db.signalEvent.findMany({
    where: {
      status: SignalStatus.UNMATCHED,
      ...(sourceSystem ? { sourceSystem } : {}),
      ...(filters.eventType ? { eventType: filters.eventType } : {}),
    },
    orderBy: [{ occurredAt: "desc" }, { receivedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      sourceSystem: true,
      eventType: true,
      occurredAt: true,
      receivedAt: true,
      createdAt: true,
      status: true,
      accountDomain: true,
      contactEmail: true,
      eventCategory: true,
      intentStrength: true,
      engagementStrength: true,
      payloadSummary: true,
      normalizedPayloadJson: true,
      identityResolutionCodesJson: true,
    },
  });

  return unmatchedSignals
    .map((signal) => {
      const reasonCodes = parseReasonCodes(signal.identityResolutionCodesJson);
      const reasonDetails = getSignalReasonDetails(reasonCodes);
      const primaryReason = getPrimarySignalReason(reasonCodes);

      return {
        signalId: signal.id,
        status: signal.status,
        sourceSystem: signal.sourceSystem,
        sourceSystemLabel: formatSignalEventLabel(signal.sourceSystem),
        eventType: signal.eventType,
        eventTypeLabel: formatSignalEventLabel(signal.eventType),
        occurredAtIso: toIsoTimestamp(signal.occurredAt),
        receivedAtIso: toIsoTimestamp(signal.receivedAt),
        createdAtIso: toIsoTimestamp(signal.createdAt),
        displayTitle: formatSignalEventLabel(signal.eventType),
        displaySubtitle: buildUnmatchedDisplaySubtitle(
          signal.payloadSummary,
          signal.accountDomain,
          signal.contactEmail,
        ),
        accountDomainCandidate: signal.accountDomain,
        accountDomainDisplay: getAccountDomainDisplay(signal.accountDomain),
        contactEmailCandidate: signal.contactEmail,
        contactEmailDisplay: getContactEmailDisplay(signal.contactEmail),
        reasonCodes,
        reasonDetails,
        primaryReason,
        recommendedQueue: getRecommendedQueue(reasonCodes),
        normalizedSummary: buildNormalizedSummary(signal),
      };
    })
    .filter((signal) => {
      if (!filters.reasonCode) {
        return true;
      }

      return signal.reasonCodes.includes(filters.reasonCode);
    })
    .slice(0, limit);
}

export async function getSignalById(id: string): Promise<SignalDetailContract | null> {
  const signal = await db.signalEvent.findUnique({
    where: { id },
    select: {
      id: true,
      sourceSystem: true,
      eventType: true,
      status: true,
      dedupeKey: true,
      accountDomain: true,
      contactEmail: true,
      occurredAt: true,
      receivedAt: true,
      createdAt: true,
      errorMessage: true,
      eventCategory: true,
      intentStrength: true,
      engagementStrength: true,
      payloadSummary: true,
      rawPayloadJson: true,
      normalizedPayloadJson: true,
      identityResolutionCodesJson: true,
      account: {
        select: {
          id: true,
          name: true,
        },
      },
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      lead: {
        select: {
          id: true,
          source: true,
        },
      },
    },
  });

  if (!signal) {
    return null;
  }

  const auditTrail = await db.auditLog.findMany({
    where: {
      entityType: "signal_event",
      entityId: id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      eventType: true,
      explanation: true,
      actorType: true,
      actorName: true,
      createdAt: true,
    },
  });

  const normalizedSummary = buildNormalizedSummary(signal);
  const normalizedPayload =
    isJsonRecord(signal.normalizedPayloadJson) &&
    typeof signal.normalizedPayloadJson.sourceSystem === "string" &&
    typeof signal.normalizedPayloadJson.occurredAtIso === "string"
      ? (signal.normalizedPayloadJson as SignalDetailContract["normalizedPayload"])
      : {
          sourceSystem: signal.sourceSystem,
          eventType: signal.eventType,
          occurredAtIso: signal.occurredAt.toISOString(),
          ...normalizedSummary,
        };

  return {
    signalId: signal.id,
    sourceSystem: signal.sourceSystem,
    eventType: signal.eventType,
    status: signal.status,
    dedupeKey: signal.dedupeKey,
    accountDomain: signal.accountDomain,
    contactEmail: signal.contactEmail,
    occurredAtIso: toIsoTimestamp(signal.occurredAt),
    receivedAtIso: toIsoTimestamp(signal.receivedAt),
    createdAtIso: toIsoTimestamp(signal.createdAt),
    errorMessage: signal.errorMessage,
    reasonCodes: parseReasonCodes(signal.identityResolutionCodesJson),
    matchedEntities: buildMatchedEntities(signal),
    rawPayload: isJsonRecord(signal.rawPayloadJson) ? signal.rawPayloadJson : {},
    normalizedPayload,
    normalizedSummary,
    auditTrail: auditTrail.map((entry) => ({
      id: entry.id,
      eventType: entry.eventType,
      explanation: entry.explanation,
      actorType: entry.actorType,
      actorName: entry.actorName,
      createdAtIso: entry.createdAt.toISOString(),
    })),
  };
}
