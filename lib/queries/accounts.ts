import {
  Geography,
  LifecycleStage,
  Segment,
  TaskStatus,
  type Prisma,
} from "@prisma/client";

import { formatCompactNumber, formatEnumLabel, formatRelativeTime, getScoreBucket } from "@/lib/formatters/display";
import { prisma } from "@/lib/prisma";
import type {
  AccountDetailView,
  AccountsFilterState,
  AccountsListData,
  SelectOption,
} from "@/lib/types";

const SEGMENTS = Object.values(Segment);
const GEOGRAPHIES = Object.values(Geography);
const STAGES = Object.values(LifecycleStage);

function normalizeFilter(searchParams: Record<string, string | string[] | undefined>): AccountsFilterState {
  const value = (key: keyof AccountsFilterState) => {
    const entry = searchParams[key];
    return Array.isArray(entry) ? entry[0] ?? "" : entry ?? "";
  };

  return {
    q: value("q"),
    segment: value("segment"),
    geography: value("geography"),
    owner: value("owner"),
    stage: value("stage"),
    scoreBucket: value("scoreBucket"),
  };
}

function buildWhere(filters: AccountsFilterState): Prisma.AccountWhereInput {
  const where: Prisma.AccountWhereInput = {};

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q } },
      { domain: { contains: filters.q } },
    ];
  }

  if (SEGMENTS.includes(filters.segment as Segment)) {
    where.segment = filters.segment as Segment;
  }

  if (GEOGRAPHIES.includes(filters.geography as Geography)) {
    where.geography = filters.geography as Geography;
  }

  if (STAGES.includes(filters.stage as LifecycleStage)) {
    where.lifecycleStage = filters.stage as LifecycleStage;
  }

  if (filters.owner) {
    where.namedOwnerId = filters.owner;
  }

  if (filters.scoreBucket === "hot") {
    where.overallScore = { gte: 80 };
  } else if (filters.scoreBucket === "warm") {
    where.overallScore = { gte: 65, lt: 80 };
  } else if (filters.scoreBucket === "cold") {
    where.overallScore = { lt: 65 };
  }

  return where;
}

function uniqueOptions(values: SelectOption[]) {
  return values.filter((option, index, array) => {
    return array.findIndex((entry) => entry.value === option.value) === index;
  });
}

function buildAccountSummary(account: {
  name: string;
  overallScore: number;
  status: string;
  signals: { eventType: string; occurredAt: Date }[];
  tasks: { title: string }[];
}) {
  const signalSummary = account.signals
    .slice(0, 2)
    .map((signal) => formatEnumLabel(signal.eventType))
    .join(" and ");
  const nextTask = account.tasks[0]?.title ?? "Review account for the next-best action";

  return `${account.name} is currently ${getScoreBucket(account.overallScore).toLowerCase()} with a score of ${account.overallScore}. Recent activity includes ${signalSummary || "steady monitoring signals"}, and the next operator recommendation is to ${nextTask.toLowerCase()}.`;
}

export async function getAccountsListData(
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<AccountsListData> {
  const filters = normalizeFilter(rawSearchParams);
  const where = buildWhere(filters);

  const [accounts, owners] = await Promise.all([
    prisma.account.findMany({
      where,
      orderBy: [{ overallScore: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        domain: true,
        segment: true,
        geography: true,
        lifecycleStage: true,
        overallScore: true,
        status: true,
        namedOwner: { select: { name: true } },
        signals: {
          take: 1,
          orderBy: { occurredAt: "desc" },
          select: { occurredAt: true },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        role: {
          in: ["Account Executive", "Strategic AE", "Enterprise AE", "SDR", "SDR Manager"],
        },
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const rows = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    domain: account.domain,
    segment: formatEnumLabel(account.segment),
    owner: account.namedOwner?.name ?? "Unassigned",
    geography: formatEnumLabel(account.geography),
    stage: formatEnumLabel(account.lifecycleStage),
    score: account.overallScore,
    status: formatEnumLabel(account.status),
    lastSignalAt: formatRelativeTime(account.signals[0]?.occurredAt ?? new Date()),
  }));

  const averageScore =
    rows.length > 0 ? Math.round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length) : 0;

  return {
    filters,
    rows,
    stats: {
      totalAccounts: rows.length,
      averageScore,
      hotAccounts: rows.filter((row) => row.score >= 80).length,
      strategicAccounts: rows.filter((row) => row.segment === "Strategic").length,
    },
    options: {
      owners: uniqueOptions(owners.map((owner) => ({ label: owner.name, value: owner.id }))),
      segments: SEGMENTS.map((segment) => ({
        label: formatEnumLabel(segment),
        value: segment,
      })),
      geographies: GEOGRAPHIES.map((geography) => ({
        label: formatEnumLabel(geography),
        value: geography,
      })),
      stages: STAGES.map((stage) => ({
        label: formatEnumLabel(stage),
        value: stage,
      })),
    },
  };
}

export async function getAccountDetail(id: string): Promise<AccountDetailView | null> {
  const account = await prisma.account.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      domain: true,
      segment: true,
      geography: true,
      lifecycleStage: true,
      status: true,
      overallScore: true,
      fitScore: true,
      industry: true,
      accountTier: true,
      employeeCount: true,
      annualRevenueBand: true,
      namedOwner: {
        select: {
          name: true,
          role: true,
        },
      },
      contacts: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          title: true,
          department: true,
          email: true,
          phone: true,
        },
      },
      tasks: {
        where: { status: { not: TaskStatus.COMPLETED } },
        take: 6,
        orderBy: { dueAt: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          dueAt: true,
          priority: true,
          status: true,
          owner: { select: { name: true } },
        },
      },
      signals: {
        take: 8,
        orderBy: { occurredAt: "desc" },
        select: {
          id: true,
          eventType: true,
          sourceSystem: true,
          occurredAt: true,
          status: true,
        },
      },
      scoreHistory: {
        take: 6,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          scoreComponent: true,
          delta: true,
          reasonCode: true,
        },
      },
      auditLogs: {
        take: 8,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          eventType: true,
          explanation: true,
          createdAt: true,
          actorName: true,
        },
      },
    },
  });

  if (!account) {
    return null;
  }

  return {
    id: account.id,
    name: account.name,
    domain: account.domain,
    owner: account.namedOwner?.name ?? "Unassigned",
    ownerRole: account.namedOwner?.role ?? "Revenue Operations",
    score: account.overallScore,
    fitScore: account.fitScore,
    segment: formatEnumLabel(account.segment),
    geography: formatEnumLabel(account.geography),
    status: formatEnumLabel(account.status),
    lifecycleStage: formatEnumLabel(account.lifecycleStage),
    industry: account.industry,
    tier: formatEnumLabel(account.accountTier),
    employeeCount: formatCompactNumber(account.employeeCount),
    revenueBand: account.annualRevenueBand,
    contacts: account.contacts.map((contact) => ({
      id: contact.id,
      name: `${contact.firstName} ${contact.lastName}`,
      title: contact.title,
      department: contact.department,
      email: contact.email,
      phone: contact.phone,
    })),
    openTasks: account.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      dueAt: formatRelativeTime(task.dueAt),
      priority: formatEnumLabel(task.priority),
      status: formatEnumLabel(task.status),
      owner: task.owner?.name ?? "Unassigned",
    })),
    timeline: account.signals.map((signal) => ({
      id: signal.id,
      title: formatEnumLabel(signal.eventType),
      description: `${signal.sourceSystem} signal added to the canonical account timeline.`,
      sourceSystem: signal.sourceSystem,
      occurredAt: formatRelativeTime(signal.occurredAt),
      status: formatEnumLabel(signal.status),
    })),
    scoreBreakdown: account.scoreHistory.map((item) => ({
      id: item.id,
      label: formatEnumLabel(item.scoreComponent),
      value: item.delta,
      reasonCode: item.reasonCode,
    })),
    auditLog: account.auditLogs.map((entry) => ({
      id: entry.id,
      title: formatEnumLabel(entry.eventType),
      explanation: entry.explanation,
      createdAt: formatRelativeTime(entry.createdAt),
      actorName: entry.actorName,
    })),
    summary: buildAccountSummary({
      name: account.name,
      overallScore: account.overallScore,
      status: account.status,
      signals: account.signals,
      tasks: account.tasks,
    }),
  };
}
