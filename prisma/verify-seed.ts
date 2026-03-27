import {
  AccountStatus,
  AuditEventType,
  Geography,
  PrismaClient,
  Segment,
  SignalStatus,
  SignalType,
  TaskStatus,
} from "@prisma/client";

import { identityResolutionCodeValues, type IdentityResolutionCode } from "../lib/contracts/signals";
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

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function parseReasonCodes(value: unknown): IdentityResolutionCode[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is IdentityResolutionCode => {
    return typeof item === "string" && reasonCodeSet.has(item as IdentityResolutionCode);
  });
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
          status: true,
          overallScore: true,
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
          eventCategory: true,
          intentStrength: true,
          engagementStrength: true,
          payloadSummary: true,
          identityResolutionCodesJson: true,
          occurredAt: true,
          receivedAt: true,
          createdAt: true,
          errorMessage: true,
        },
      }),
      prisma.task.findMany({
        select: {
          id: true,
          accountId: true,
          leadId: true,
          ownerId: true,
          status: true,
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
          accountId: true,
          leadId: true,
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
  invariant(signals.length >= 100, `Expected at least 100 signal events, found ${signals.length}.`);
  invariant(tasks.length === 40, `Expected 40 tasks, found ${tasks.length}.`);
  invariant(routingDecisions.length === 30, `Expected 30 routing decisions, found ${routingDecisions.length}.`);

  const accountIds = new Set(accounts.map((account) => account.id));
  const userIds = new Set(users.map((user) => user.id));
  const contactIds = new Set(contacts.map((contact) => contact.id));
  const leadIds = new Set(leads.map((lead) => lead.id));
  const dedupeKeys = new Set<string>();

  invariant(accounts.some((account) => account.segment === Segment.SMB), "Missing SMB account coverage.");
  invariant(
    accounts.some((account) => account.segment === Segment.MID_MARKET),
    "Missing Mid-Market account coverage.",
  );
  invariant(
    accounts.some((account) => account.segment === Segment.ENTERPRISE),
    "Missing Enterprise account coverage.",
  );
  invariant(
    accounts.some((account) => account.segment === Segment.STRATEGIC),
    "Missing Strategic account coverage.",
  );

  invariant(accounts.some((account) => account.geography === Geography.NA_WEST), "Missing NA West coverage.");
  invariant(accounts.some((account) => account.geography === Geography.NA_EAST), "Missing NA East coverage.");
  invariant(accounts.some((account) => account.geography === Geography.EMEA), "Missing EMEA coverage.");
  invariant(accounts.some((account) => account.geography === Geography.APAC), "Missing APAC coverage.");

  for (const industry of requiredIndustries) {
    invariant(
      accounts.some((account) => account.industry === industry),
      `Missing ${industry} industry coverage.`,
    );
  }

  const hotAccounts = accounts.filter(
    (account) => account.status === AccountStatus.HOT && account.overallScore >= 82,
  );
  invariant(
    hotAccounts.length >= 5,
    `Expected at least 5 hot accounts with score >= 82, found ${hotAccounts.length}.`,
  );
  invariant(
    hotAccounts.every((account) => Boolean(account.namedOwnerId)),
    "Every hot account must have a named owner.",
  );

  const assignedAccounts = accounts.filter((account) => account.namedOwnerId);
  invariant(
    assignedAccounts.length === 16,
    `Expected 16 assigned accounts, found ${assignedAccounts.length}.`,
  );
  invariant(
    accounts.length - assignedAccounts.length === 4,
    `Expected 4 unassigned accounts, found ${accounts.length - assignedAccounts.length}.`,
  );

  const contactsByAccount = new Map<string, number>();
  for (const contact of contacts) {
    invariant(accountIds.has(contact.accountId), `Contact ${contact.id} references missing account ${contact.accountId}.`);
    contactsByAccount.set(contact.accountId, (contactsByAccount.get(contact.accountId) ?? 0) + 1);
  }

  const leadsByAccount = new Map<string, number>();
  for (const lead of leads) {
    const contactId = lead.contactId;
    const ownerId = lead.currentOwnerId;

    invariant(accountIds.has(lead.accountId), `Lead ${lead.id} references missing account ${lead.accountId}.`);
    invariant(contactId !== null, `Lead ${lead.id} is missing a contact reference.`);
    invariant(contactIds.has(contactId), `Lead ${lead.id} references missing contact ${contactId}.`);
    invariant(ownerId !== null, `Lead ${lead.id} is missing an owner reference.`);
    invariant(userIds.has(ownerId), `Lead ${lead.id} references missing owner ${ownerId}.`);
    leadsByAccount.set(lead.accountId, (leadsByAccount.get(lead.accountId) ?? 0) + 1);
  }

  const linkedSignalsByAccount = new Map<string, number>();
  const sourceSystems = new Set<string>();
  const signalTypes = new Set<SignalType>();
  const reasonCodes = new Set<IdentityResolutionCode>();
  let unmatchedSignalCount = 0;
  let matchedSignalCount = 0;

  for (const signal of signals) {
    sourceSystems.add(signal.sourceSystem);
    signalTypes.add(signal.eventType);

    invariant(signal.dedupeKey.length > 0, `Signal ${signal.id} is missing a dedupe key.`);
    invariant(!dedupeKeys.has(signal.dedupeKey), `Duplicate dedupe key detected: ${signal.dedupeKey}.`);
    dedupeKeys.add(signal.dedupeKey);
    invariant(signal.payloadSummary.length > 0, `Signal ${signal.id} is missing payloadSummary.`);
    invariant(signal.receivedAt >= signal.occurredAt, `Signal ${signal.id} receivedAt precedes occurredAt.`);
    invariant(signal.createdAt >= signal.receivedAt, `Signal ${signal.id} createdAt precedes receivedAt.`);
    invariant(signal.errorMessage === null, `Seeded signal ${signal.id} should not have an error message.`);

    const parsedCodes = parseReasonCodes(signal.identityResolutionCodesJson);
    invariant(parsedCodes.length > 0, `Signal ${signal.id} is missing identity resolution codes.`);
    for (const reasonCode of parsedCodes) {
      reasonCodes.add(reasonCode);
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

  invariant(matchedSignalCount >= 90, `Expected at least 90 matched signals, found ${matchedSignalCount}.`);
  invariant(unmatchedSignalCount >= 10, `Expected at least 10 unmatched signals, found ${unmatchedSignalCount}.`);

  for (const sourceSystem of requiredSourceSystems) {
    invariant(sourceSystems.has(sourceSystem), `Missing seeded source system coverage for ${sourceSystem}.`);
  }

  for (const signalType of Object.values(SignalType)) {
    invariant(signalTypes.has(signalType), `Missing seeded signal type coverage for ${signalType}.`);
  }

  for (const reasonCode of identityResolutionCodeValues) {
    invariant(reasonCodes.has(reasonCode), `Missing seeded identity reason code coverage for ${reasonCode}.`);
  }

  const openTasksByAccount = new Map<string, number>();
  for (const task of tasks) {
    if (task.accountId) {
      invariant(accountIds.has(task.accountId), `Task ${task.id} references missing account ${task.accountId}.`);
      if (task.status !== TaskStatus.COMPLETED) {
        openTasksByAccount.set(task.accountId, (openTasksByAccount.get(task.accountId) ?? 0) + 1);
      }
    }

    if (task.leadId) {
      invariant(leadIds.has(task.leadId), `Task ${task.id} references missing lead ${task.leadId}.`);
    }

    if (task.ownerId) {
      invariant(userIds.has(task.ownerId), `Task ${task.id} references missing owner ${task.ownerId}.`);
    }
  }

  for (const decision of routingDecisions) {
    if (decision.accountId) {
      invariant(
        accountIds.has(decision.accountId),
        `Routing decision ${decision.id} references missing account ${decision.accountId}.`,
      );
    }
    if (decision.leadId) {
      invariant(leadIds.has(decision.leadId), `Routing decision ${decision.id} references missing lead ${decision.leadId}.`);
    }
    if (decision.assignedOwnerId) {
      invariant(
        userIds.has(decision.assignedOwnerId),
        `Routing decision ${decision.id} references missing owner ${decision.assignedOwnerId}.`,
      );
    }
  }

  const scoreHistoryByAccount = new Map<string, number>();
  for (const entry of scoreHistory) {
    if (entry.accountId) {
      invariant(accountIds.has(entry.accountId), `Score history ${entry.id} references missing account ${entry.accountId}.`);
      scoreHistoryByAccount.set(entry.accountId, (scoreHistoryByAccount.get(entry.accountId) ?? 0) + 1);
    }
    if (entry.leadId) {
      invariant(leadIds.has(entry.leadId), `Score history ${entry.id} references missing lead ${entry.leadId}.`);
    }
  }

  const signalAuditLogs = auditLogs.filter((entry) => entry.entityType === "signal_event");
  invariant(
    signalAuditLogs.length === signals.length * 3,
    `Expected ${signals.length * 3} signal audit rows, found ${signalAuditLogs.length}.`,
  );
  invariant(
    signalAuditLogs.every((entry) =>
      entry.eventType === AuditEventType.SIGNAL_INGESTED ||
      entry.eventType === AuditEventType.SIGNAL_NORMALIZED ||
      entry.eventType === AuditEventType.IDENTITY_RESOLVED ||
      entry.eventType === AuditEventType.SIGNAL_UNMATCHED_QUEUED
    ),
    "Signal audit rows should only contain ingest, normalization, identity, or unmatched queue events.",
  );

  const auditLogByAccount = new Map<string, number>();
  for (const entry of auditLogs) {
    if (entry.accountId) {
      invariant(accountIds.has(entry.accountId), `Audit log ${entry.id} references missing account ${entry.accountId}.`);
      auditLogByAccount.set(entry.accountId, (auditLogByAccount.get(entry.accountId) ?? 0) + 1);
    }
    if (entry.leadId) {
      invariant(leadIds.has(entry.leadId), `Audit log ${entry.id} references missing lead ${entry.leadId}.`);
    }
  }

  for (const account of accounts) {
    invariant(
      contactsByAccount.get(account.id) === 2,
      `Account ${account.id} should have exactly 2 contacts.`,
    );
    invariant(
      (leadsByAccount.get(account.id) ?? 0) >= 1,
      `Account ${account.id} should have at least 1 lead.`,
    );
    invariant(
      (openTasksByAccount.get(account.id) ?? 0) >= 1,
      `Account ${account.id} should have at least 1 open or in-progress task.`,
    );
    invariant(
      (scoreHistoryByAccount.get(account.id) ?? 0) >= 3,
      `Account ${account.id} should have at least 3 score history rows.`,
    );
    invariant(
      (auditLogByAccount.get(account.id) ?? 0) >= 3,
      `Account ${account.id} should have at least 3 audit log rows.`,
    );

    const linkedSignalCount = linkedSignalsByAccount.get(account.id) ?? 0;
    if (account.status === AccountStatus.HOT) {
      invariant(
        linkedSignalCount >= 6,
        `Hot account ${account.id} should have at least 6 linked signals.`,
      );
    } else {
      invariant(
        linkedSignalCount >= 4,
        `Account ${account.id} should have at least 4 linked signals.`,
      );
    }
  }

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
