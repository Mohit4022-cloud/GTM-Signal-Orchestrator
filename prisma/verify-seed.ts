import {
  Geography,
  PrismaClient,
  ScoreEntityType,
  ScoreTriggerType,
  SignalStatus,
  SignalType,
  Temperature,
} from "@prisma/client";

import {
  identityResolutionCodeValues,
  type IdentityResolutionCode,
} from "../lib/contracts/signals";
import type { ScoreReasonCode } from "../lib/contracts/scoring";
import { scoreReasonCodeValues } from "../lib/scoring/reason-codes";
import { sqliteAdapter } from "../lib/prisma-adapter";

const prisma = new PrismaClient({
  adapter: sqliteAdapter,
});

const requiredIndustries = ["SaaS", "Manufacturing", "Healthcare", "Retail", "Fintech"] as const;
const requiredSourceSystems = [
  "website",
  "marketing_automation",
  "events",
  "product",
  "sales_engagement",
  "calendar",
  "third_party_intent",
  "sales_note",
  "crm",
] as const;
const reasonCodeSet = new Set<IdentityResolutionCode>(identityResolutionCodeValues);
const scoreReasonCodeSet = new Set<ScoreReasonCode>(scoreReasonCodeValues);

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function parseIdentityReasonCodes(value: unknown): IdentityResolutionCode[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is IdentityResolutionCode => {
    return typeof item === "string" && reasonCodeSet.has(item as IdentityResolutionCode);
  });
}

function parseScoreReasonCodes(value: unknown): ScoreReasonCode[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is ScoreReasonCode => {
    return typeof item === "string" && scoreReasonCodeSet.has(item as ScoreReasonCode);
  });
}

function parseComponentBreakdown(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is { key: string; score: number } => {
    return Boolean(item) && typeof item === "object" && typeof item.key === "string" && typeof item.score === "number";
  });
}

function parseExplanation(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const summary = (value as { summary?: unknown }).summary;
  return typeof summary === "string" ? summary : null;
}

function getComponentScore(components: Array<{ key: string; score: number }>, key: string) {
  return components.find((component) => component.key === key)?.score ?? null;
}

async function main() {
  const [users, accounts, contacts, leads, signals, tasks, routingDecisions, scoreHistory, auditLogs] =
    await Promise.all([
      prisma.user.findMany({ select: { id: true } }),
      prisma.account.findMany({
        select: {
          id: true,
          segment: true,
          geography: true,
          industry: true,
          namedOwnerId: true,
          overallScore: true,
          fitScore: true,
          intentScore: true,
          engagementScore: true,
          recencyScore: true,
          productUsageScore: true,
          manualPriorityScore: true,
          temperature: true,
          scoreBreakdownJson: true,
          scoreReasonCodesJson: true,
          scoreExplanationJson: true,
          scoreLastComputedAt: true,
          scoringVersion: true,
        },
      }),
      prisma.contact.findMany({
        select: {
          id: true,
          accountId: true,
        },
      }),
      prisma.lead.findMany({
        select: {
          id: true,
          accountId: true,
          contactId: true,
          currentOwnerId: true,
          score: true,
          fitScore: true,
          intentScore: true,
          engagementScore: true,
          recencyScore: true,
          productUsageScore: true,
          manualPriorityScore: true,
          temperature: true,
          scoreBreakdownJson: true,
          scoreReasonCodesJson: true,
          scoreExplanationJson: true,
          scoreLastComputedAt: true,
          scoringVersion: true,
        },
      }),
      prisma.signalEvent.findMany({
        select: {
          id: true,
          sourceSystem: true,
          eventType: true,
          accountId: true,
          accountDomain: true,
          contactId: true,
          contactEmail: true,
          leadId: true,
          status: true,
          dedupeKey: true,
          payloadSummary: true,
          identityResolutionCodesJson: true,
          occurredAt: true,
          receivedAt: true,
          createdAt: true,
          updatedAt: true,
          errorMessage: true,
        },
      }),
      prisma.task.findMany({
        select: {
          id: true,
          accountId: true,
          leadId: true,
          ownerId: true,
        },
      }),
      prisma.routingDecision.findMany({
        select: {
          id: true,
          accountId: true,
          leadId: true,
          assignedOwnerId: true,
        },
      }),
      prisma.scoreHistory.findMany({
        select: {
          id: true,
          entityType: true,
          entityId: true,
          accountId: true,
          leadId: true,
          componentBreakdownJson: true,
          reasonCodesJson: true,
          explanationJson: true,
          triggerType: true,
          triggerSignalId: true,
          scoringVersion: true,
        },
      }),
      prisma.auditLog.findMany({
        select: {
          id: true,
          eventType: true,
          entityType: true,
          entityId: true,
          accountId: true,
          leadId: true,
        },
      }),
    ]);

  invariant(users.length === 8, `Expected 8 users, found ${users.length}.`);
  invariant(accounts.length === 20, `Expected 20 accounts, found ${accounts.length}.`);
  invariant(contacts.length === 40, `Expected 40 contacts, found ${contacts.length}.`);
  invariant(leads.length === 30, `Expected 30 leads, found ${leads.length}.`);
  invariant(signals.length >= 120, `Expected at least 120 signal events, found ${signals.length}.`);
  invariant(tasks.length === 40, `Expected 40 tasks, found ${tasks.length}.`);
  invariant(routingDecisions.length === 30, `Expected 30 routing decisions, found ${routingDecisions.length}.`);

  const accountIds = new Set(accounts.map((account) => account.id));
  const userIds = new Set(users.map((user) => user.id));
  const contactIds = new Set(contacts.map((contact) => contact.id));
  const leadIds = new Set(leads.map((lead) => lead.id));

  const accountTemperatures = new Set(accounts.map((account) => account.temperature));
  const leadTemperatures = new Set(leads.map((lead) => lead.temperature));
  const linkedSignalsByAccount = new Map<string, number>();
  const contactsByAccount = new Map<string, number>();
  const leadsByAccount = new Map<string, number>();
  const sourceSystems = new Set<string>();
  const signalTypes = new Set<SignalType>();
  const identityReasonCodes = new Set<IdentityResolutionCode>();
  const signalEventIds = new Set(signals.map((signal) => signal.id));

  invariant(accountTemperatures.has(Temperature.COLD), "Expected at least one cold account.");
  invariant(accountTemperatures.has(Temperature.WARM), "Expected at least one warm account.");
  invariant(accountTemperatures.has(Temperature.HOT), "Expected at least one hot account.");
  invariant(accountTemperatures.has(Temperature.URGENT), "Expected at least one urgent account.");
  invariant(leadTemperatures.has(Temperature.COLD), "Expected at least one cold lead.");
  invariant(leadTemperatures.has(Temperature.WARM), "Expected at least one warm lead.");
  invariant(leadTemperatures.has(Temperature.HOT), "Expected at least one hot lead.");
  invariant(leadTemperatures.has(Temperature.URGENT), "Expected at least one urgent lead.");
  invariant(
    leads.filter((lead) => lead.temperature === Temperature.URGENT).length >= 3,
    "Expected at least three urgent leads.",
  );

  for (const industry of requiredIndustries) {
    invariant(accounts.some((account) => account.industry === industry), `Missing ${industry} industry coverage.`);
  }

  invariant(accounts.some((account) => account.geography === Geography.NA_WEST), "Missing NA West coverage.");
  invariant(accounts.some((account) => account.geography === Geography.NA_EAST), "Missing NA East coverage.");
  invariant(accounts.some((account) => account.geography === Geography.EMEA), "Missing EMEA coverage.");
  invariant(accounts.some((account) => account.geography === Geography.APAC), "Missing APAC coverage.");

  for (const contact of contacts) {
    invariant(accountIds.has(contact.accountId), `Contact ${contact.id} references missing account ${contact.accountId}.`);
    contactsByAccount.set(contact.accountId, (contactsByAccount.get(contact.accountId) ?? 0) + 1);
  }

  for (const lead of leads) {
    invariant(accountIds.has(lead.accountId), `Lead ${lead.id} references missing account ${lead.accountId}.`);
    invariant(Boolean(lead.contactId), `Lead ${lead.id} is missing a contact reference.`);
    invariant(contactIds.has(lead.contactId!), `Lead ${lead.id} references missing contact ${lead.contactId}.`);
    invariant(Boolean(lead.currentOwnerId), `Lead ${lead.id} is missing an owner reference.`);
    invariant(userIds.has(lead.currentOwnerId!), `Lead ${lead.id} references missing owner ${lead.currentOwnerId}.`);
    leadsByAccount.set(lead.accountId, (leadsByAccount.get(lead.accountId) ?? 0) + 1);

    const components = parseComponentBreakdown(lead.scoreBreakdownJson);
    invariant(lead.scoreLastComputedAt !== null, `Lead ${lead.id} is missing scoreLastComputedAt.`);
    invariant(lead.scoringVersion === "scoring/v1", `Lead ${lead.id} should use scoring/v1.`);
    invariant(components.length === 6, `Lead ${lead.id} should have 6 score components.`);
    invariant(getComponentScore(components, "fit") === lead.fitScore, `Lead ${lead.id} fit snapshot mismatch.`);
    invariant(getComponentScore(components, "intent") === lead.intentScore, `Lead ${lead.id} intent snapshot mismatch.`);
    invariant(
      getComponentScore(components, "engagement") === lead.engagementScore,
      `Lead ${lead.id} engagement snapshot mismatch.`,
    );
    invariant(getComponentScore(components, "recency") === lead.recencyScore, `Lead ${lead.id} recency snapshot mismatch.`);
    invariant(
      getComponentScore(components, "productUsage") === lead.productUsageScore,
      `Lead ${lead.id} product usage snapshot mismatch.`,
    );
    invariant(
      getComponentScore(components, "manualPriority") === lead.manualPriorityScore,
      `Lead ${lead.id} manual priority snapshot mismatch.`,
    );
    invariant(
      components.reduce((sum, component) => sum + component.score, 0) === lead.score,
      `Lead ${lead.id} total score does not match component breakdown.`,
    );
    invariant(
      parseScoreReasonCodes(lead.scoreReasonCodesJson).length > 0,
      `Lead ${lead.id} is missing persisted reason codes.`,
    );
    invariant(parseExplanation(lead.scoreExplanationJson), `Lead ${lead.id} is missing a persisted explanation.`);
  }

  for (const account of accounts) {
    const components = parseComponentBreakdown(account.scoreBreakdownJson);

    invariant(account.scoreLastComputedAt !== null, `Account ${account.id} is missing scoreLastComputedAt.`);
    invariant(account.scoringVersion === "scoring/v1", `Account ${account.id} should use scoring/v1.`);
    invariant(components.length === 6, `Account ${account.id} should have 6 score components.`);
    invariant(getComponentScore(components, "fit") === account.fitScore, `Account ${account.id} fit snapshot mismatch.`);
    invariant(getComponentScore(components, "intent") === account.intentScore, `Account ${account.id} intent snapshot mismatch.`);
    invariant(
      getComponentScore(components, "engagement") === account.engagementScore,
      `Account ${account.id} engagement snapshot mismatch.`,
    );
    invariant(
      getComponentScore(components, "recency") === account.recencyScore,
      `Account ${account.id} recency snapshot mismatch.`,
    );
    invariant(
      getComponentScore(components, "productUsage") === account.productUsageScore,
      `Account ${account.id} product usage snapshot mismatch.`,
    );
    invariant(
      getComponentScore(components, "manualPriority") === account.manualPriorityScore,
      `Account ${account.id} manual priority snapshot mismatch.`,
    );
    invariant(
      components.reduce((sum, component) => sum + component.score, 0) === account.overallScore,
      `Account ${account.id} total score does not match component breakdown.`,
    );
    invariant(
      parseScoreReasonCodes(account.scoreReasonCodesJson).length > 0,
      `Account ${account.id} is missing persisted reason codes.`,
    );
    invariant(parseExplanation(account.scoreExplanationJson), `Account ${account.id} is missing a persisted explanation.`);
    invariant(contactsByAccount.get(account.id) === 2, `Account ${account.id} should have exactly 2 contacts.`);
    invariant((leadsByAccount.get(account.id) ?? 0) >= 1, `Account ${account.id} should have at least 1 lead.`);
  }

  let matchedSignalCount = 0;
  let unmatchedSignalCount = 0;
  const dedupeKeys = new Set<string>();

  for (const signal of signals) {
    sourceSystems.add(signal.sourceSystem);
    signalTypes.add(signal.eventType);

    invariant(signal.dedupeKey.length > 0, `Signal ${signal.id} is missing a dedupe key.`);
    invariant(!dedupeKeys.has(signal.dedupeKey), `Duplicate dedupe key detected: ${signal.dedupeKey}.`);
    dedupeKeys.add(signal.dedupeKey);
    invariant(signal.payloadSummary.length > 0, `Signal ${signal.id} is missing payloadSummary.`);
    invariant(signal.receivedAt >= signal.occurredAt, `Signal ${signal.id} receivedAt precedes occurredAt.`);
    invariant(signal.createdAt >= signal.receivedAt, `Signal ${signal.id} createdAt precedes receivedAt.`);
    invariant(signal.updatedAt >= signal.createdAt, `Signal ${signal.id} updatedAt precedes createdAt.`);
    invariant(signal.errorMessage === null, `Seeded signal ${signal.id} should not have an error message.`);

    const parsedCodes = parseIdentityReasonCodes(signal.identityResolutionCodesJson);
    invariant(parsedCodes.length > 0, `Signal ${signal.id} is missing identity resolution codes.`);
    for (const reasonCode of parsedCodes) {
      identityReasonCodes.add(reasonCode);
    }

    if (signal.accountId) {
      invariant(accountIds.has(signal.accountId), `Signal ${signal.id} references missing account ${signal.accountId}.`);
      linkedSignalsByAccount.set(signal.accountId, (linkedSignalsByAccount.get(signal.accountId) ?? 0) + 1);
    }

    if (signal.contactId) {
      invariant(contactIds.has(signal.contactId), `Signal ${signal.id} references missing contact ${signal.contactId}.`);
    }

    if (signal.leadId) {
      invariant(leadIds.has(signal.leadId), `Signal ${signal.id} references missing lead ${signal.leadId}.`);
    }

    if (signal.status === SignalStatus.MATCHED) {
      matchedSignalCount += 1;
      invariant(Boolean(signal.accountId), `Matched signal ${signal.id} should resolve to an account.`);
    }

    if (signal.status === SignalStatus.UNMATCHED) {
      unmatchedSignalCount += 1;
      invariant(signal.accountId === null, `Unmatched signal ${signal.id} should not resolve an account.`);
      invariant(signal.contactId === null, `Unmatched signal ${signal.id} should not resolve a contact.`);
    }
  }

  invariant(matchedSignalCount >= 100, `Expected at least 100 matched signals, found ${matchedSignalCount}.`);
  invariant(unmatchedSignalCount >= 10, `Expected at least 10 unmatched signals, found ${unmatchedSignalCount}.`);

  for (const sourceSystem of requiredSourceSystems) {
    invariant(sourceSystems.has(sourceSystem), `Missing seeded source system coverage for ${sourceSystem}.`);
  }

  for (const signalType of Object.values(SignalType)) {
    invariant(signalTypes.has(signalType), `Missing seeded signal type coverage for ${signalType}.`);
  }

  for (const reasonCode of identityResolutionCodeValues) {
    invariant(identityReasonCodes.has(reasonCode), `Missing seeded identity reason code coverage for ${reasonCode}.`);
  }

  invariant(scoreHistory.length > 0, "Expected persisted score history rows.");
  invariant(
    scoreHistory.some((entry) => entry.entityType === ScoreEntityType.ACCOUNT),
    "Expected account score history rows.",
  );
  invariant(
    scoreHistory.some((entry) => entry.entityType === ScoreEntityType.LEAD),
    "Expected lead score history rows.",
  );
  invariant(
    scoreHistory.some((entry) => entry.triggerType === ScoreTriggerType.MANUAL_PRIORITY_CHANGED),
    "Expected manual priority score history rows.",
  );
  invariant(
    scoreHistory.some((entry) => entry.triggerType === ScoreTriggerType.MANUAL_RECOMPUTE),
    "Expected final snapshot score history rows.",
  );

  for (const entry of scoreHistory) {
    if (entry.accountId) {
      invariant(accountIds.has(entry.accountId), `Score history ${entry.id} references missing account ${entry.accountId}.`);
    }

    if (entry.leadId) {
      invariant(leadIds.has(entry.leadId), `Score history ${entry.id} references missing lead ${entry.leadId}.`);
    }

    if (entry.triggerSignalId) {
      invariant(
        signalEventIds.has(entry.triggerSignalId),
        `Score history ${entry.id} references missing trigger signal ${entry.triggerSignalId}.`,
      );
    }

    invariant(
      parseComponentBreakdown(entry.componentBreakdownJson).length === 6,
      `Score history ${entry.id} should persist 6 score components.`,
    );
    invariant(
      parseScoreReasonCodes(entry.reasonCodesJson).length > 0,
      `Score history ${entry.id} is missing reason codes.`,
    );
    invariant(parseExplanation(entry.explanationJson), `Score history ${entry.id} is missing explanation content.`);
    invariant(entry.scoringVersion === "scoring/v1", `Score history ${entry.id} should use scoring/v1.`);
  }

  const summitFlow = accounts.find((account) => account.id === "acc_summitflow_finance");
  invariant(summitFlow, "Expected seeded account acc_summitflow_finance.");
  invariant(
    parseScoreReasonCodes(summitFlow.scoreReasonCodesJson).includes("intent_pricing_page_cluster"),
    "SummitFlow Finance should reflect pricing-cluster intent.",
  );

  const signalNest = accounts.find((account) => account.id === "acc_signalnest");
  invariant(signalNest, "Expected seeded account acc_signalnest.");
  const signalNestReasons = parseScoreReasonCodes(signalNest.scoreReasonCodesJson);
  invariant(
    signalNestReasons.includes("product_usage_signup") ||
      signalNestReasons.includes("product_usage_team_invite") ||
      signalNestReasons.includes("product_usage_key_activation"),
    "SignalNest should reflect product-usage score drivers.",
  );

  const frontierRetail = accounts.find((account) => account.id === "acc_frontier_retail");
  invariant(frontierRetail, "Expected seeded account acc_frontier_retail.");
  const frontierReasons = parseScoreReasonCodes(frontierRetail.scoreReasonCodesJson);
  invariant(
    frontierReasons.includes("inactivity_decay_14d") || frontierReasons.includes("inactivity_decay_30d"),
    "Frontier Retail should reflect inactivity decay.",
  );

  const signalEventAuditLogs = auditLogs.filter((entry) => entry.entityType === "signal_event");
  invariant(signalEventAuditLogs.length > 0, "Expected signal-event audit logs.");
  invariant(
    signalEventAuditLogs.every((entry) => signalEventIds.has(entry.entityId)),
    "Signal-event audit rows must reference an existing signal event.",
  );
  invariant(
    auditLogs.some((entry) => entry.eventType === "SCORE_RECOMPUTED"),
    "Expected score recompute audit logs.",
  );
  invariant(
    auditLogs.some((entry) => entry.eventType === "SCORE_THRESHOLD_CROSSED"),
    "Expected threshold crossing audit logs.",
  );
  invariant(
    auditLogs.some((entry) => entry.eventType === "SCORE_MANUAL_PRIORITY_OVERRIDDEN"),
    "Expected manual priority override audit logs.",
  );

  console.log("Seed verification passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
