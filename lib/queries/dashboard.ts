import { differenceInMinutes, format, startOfDay, subDays } from "date-fns";
import { SignalStatus, TaskStatus } from "@prisma/client";

import { formatCompactNumber, formatEnumLabel, formatRelativeTime } from "@/lib/formatters/display";
import { prisma } from "@/lib/prisma";
import type { DashboardData, ModulePlaceholderConfig } from "@/lib/types";

type JsonRecord = Record<string, string | number | boolean | null | undefined>;

export async function getDashboardData(): Promise<DashboardData> {
  const [signals, accounts, leads, routingDecisions, tasks] = await Promise.all([
    prisma.signalEvent.findMany({
      select: {
        id: true,
        eventType: true,
        sourceSystem: true,
        accountId: true,
        occurredAt: true,
        receivedAt: true,
        status: true,
        normalizedPayloadJson: true,
      },
      orderBy: { occurredAt: "desc" },
    }),
    prisma.account.findMany({
      select: {
        id: true,
        name: true,
        segment: true,
        overallScore: true,
        namedOwner: { select: { name: true } },
      },
      orderBy: { overallScore: "desc" },
    }),
    prisma.lead.findMany({
      select: {
        id: true,
        createdAt: true,
        firstResponseAt: true,
        slaDeadlineAt: true,
      },
    }),
    prisma.routingDecision.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        decisionType: true,
        assignedQueue: true,
        explanation: true,
        createdAt: true,
        account: { select: { name: true } },
        assignedOwner: { select: { name: true } },
      },
    }),
    prisma.task.findMany({
      select: {
        id: true,
        status: true,
        dueAt: true,
      },
    }),
  ]);

  const now = new Date();
  const today = startOfDay(now);
  const signalVolume14d = Array.from({ length: 14 }, (_, index) => {
    const date = startOfDay(subDays(today, 13 - index));
    const key = format(date, "yyyy-MM-dd");
    const dailySignals = signals.filter(
      (signal) => format(startOfDay(signal.occurredAt), "yyyy-MM-dd") === key,
    );

    return {
      date: format(date, "MMM d"),
      signals: dailySignals.length,
      matched: dailySignals.filter((signal) => signal.status !== SignalStatus.UNMATCHED).length,
    };
  });

  const responseTimes = leads
    .filter((lead) => lead.firstResponseAt)
    .map((lead) => differenceInMinutes(lead.firstResponseAt!, lead.createdAt));

  const averageResponseMinutes =
    responseTimes.length > 0
      ? Math.round(responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length)
      : 0;

  const unmatchedSignals = signals
    .filter((signal) => signal.status === SignalStatus.UNMATCHED)
    .slice(0, 5)
    .map((signal) => {
      const normalized = signal.normalizedPayloadJson as JsonRecord;
      return {
        id: signal.id,
        eventType: formatEnumLabel(signal.eventType),
        sourceSystem: signal.sourceSystem,
        receivedAt: formatRelativeTime(signal.receivedAt),
        recommendation: String(normalized.recommendedQueue ?? "Ops review"),
      };
    });

  const lastSignalByAccount = signals.reduce<Record<string, Date>>((acc, signal) => {
    if (!signal.accountId) return acc;
    const existing = acc[signal.accountId];
    if (!existing || existing < signal.occurredAt) {
      acc[signal.accountId] = signal.occurredAt;
    }
    return acc;
  }, {});

  const hotAccounts = accounts
    .filter((account) => account.overallScore >= 80)
    .slice(0, 6)
    .map((account) => ({
      id: account.id,
      name: account.name,
      owner: account.namedOwner?.name ?? "Unassigned",
      segment: formatEnumLabel(account.segment),
      score: account.overallScore,
      lastSignalAt: formatRelativeTime(lastSignalByAccount[account.id] ?? now),
    }));

  const slaCompliant = leads.filter(
    (lead) => lead.firstResponseAt && lead.slaDeadlineAt && lead.firstResponseAt <= lead.slaDeadlineAt,
  ).length;
  const slaAtRisk = leads.filter(
    (lead) => !lead.firstResponseAt && lead.slaDeadlineAt && lead.slaDeadlineAt > now,
  ).length;
  const slaBreached = leads.length - slaCompliant - slaAtRisk;

  const openTasks = tasks.filter((task) => task.status !== TaskStatus.COMPLETED).length;

  return {
    kpis: [
      {
        label: "Signals received today",
        value: formatCompactNumber(signals.filter((signal) => signal.receivedAt >= today).length),
        change: `${signalVolume14d.slice(-7).reduce((sum, point) => sum + point.signals, 0)} in the last 7 days`,
        tone: "default",
      },
      {
        label: "Routed today",
        value: formatCompactNumber(
          routingDecisions.filter((decision) => decision.createdAt >= today).length,
        ),
        change: `${formatCompactNumber(routingDecisions.length)} recent routing decisions`,
        tone: "positive",
      },
      {
        label: "Unmatched signals",
        value: formatCompactNumber(unmatchedSignals.length),
        change: "Ops review queue needs manual resolution",
        tone: unmatchedSignals.length > 2 ? "warning" : "default",
      },
      {
        label: "Hot accounts",
        value: formatCompactNumber(hotAccounts.length),
        change: `${Math.round((hotAccounts.length / accounts.length) * 100)}% of the tracked portfolio`,
        tone: "positive",
      },
      {
        label: "SLA breaches",
        value: formatCompactNumber(slaBreached),
        change: `${slaCompliant} leads resolved within target`,
        tone: slaBreached > 4 ? "danger" : "warning",
      },
      {
        label: "Avg. speed-to-lead",
        value: averageResponseMinutes ? `${Math.round(averageResponseMinutes / 60)}h` : "n/a",
        change: `${openTasks} open tasks across active queues`,
        tone: "default",
      },
    ],
    signalVolume14d,
    slaHealth: [
      { label: "Within SLA", value: slaCompliant, tone: "positive" },
      { label: "At risk", value: slaAtRisk, tone: "warning" },
      { label: "Breached", value: slaBreached, tone: "danger" },
    ],
    hotAccounts,
    unmatchedSignals,
    recentRoutingDecisions: routingDecisions.map((decision) => ({
      id: decision.id,
      accountName: decision.account?.name ?? "Unmatched account",
      ownerName: decision.assignedOwner?.name ?? "Ops review",
      queue: decision.assignedQueue,
      decisionType: formatEnumLabel(decision.decisionType),
      createdAt: formatRelativeTime(decision.createdAt),
      explanation: decision.explanation,
    })),
  };
}

export async function getWorkspaceTeasers(): Promise<Record<string, ModulePlaceholderConfig>> {
  const [leadCount, openTaskCount, signalCount, routingCount, activeRuleCount] = await Promise.all([
    prisma.lead.count(),
    prisma.task.count({ where: { status: { not: TaskStatus.COMPLETED } } }),
    prisma.signalEvent.count(),
    prisma.routingDecision.count(),
    prisma.ruleConfig.count({ where: { isActive: true } }),
  ]);

  return {
    leads: {
      title: "Leads Queue",
      eyebrow: "Module placeholder",
      description:
        "The next build-out will focus on active lead queues, SLA countdowns, and working ownership states.",
      capabilities: [
        "Hot lead queue with SLA urgency indicators",
        "Unassigned and recently routed lead views",
        "Queue-level filters by owner, source, and temperature",
      ],
      teaserLabel: "Seeded leads",
      teaserValue: formatCompactNumber(leadCount),
      secondaryLabel: "Open tasks linked",
      secondaryValue: formatCompactNumber(openTaskCount),
    },
    tasks: {
      title: "Tasks",
      eyebrow: "Module placeholder",
      description:
        "Task orchestration will surface rep action queues, escalations, and follow-up compliance signals.",
      capabilities: [
        "Due-soon and overdue task queues",
        "Owner-level workload balancing",
        "Readiness context pulled from account and lead signals",
      ],
      teaserLabel: "Open actions",
      teaserValue: formatCompactNumber(openTaskCount),
      secondaryLabel: "Active leads",
      secondaryValue: formatCompactNumber(leadCount),
    },
    signals: {
      title: "Signals",
      eyebrow: "Module placeholder",
      description:
        "The signals module will become the operator intake layer for web, product, marketing, and sales events.",
      capabilities: [
        "Unified signal intake with source filters",
        "Unmatched queue review and resolution",
        "Signal-level normalization and confidence inspection",
      ],
      teaserLabel: "Seeded signals",
      teaserValue: formatCompactNumber(signalCount),
      secondaryLabel: "Routing decisions",
      secondaryValue: formatCompactNumber(routingCount),
    },
    "routing-simulator": {
      title: "Routing Simulator",
      eyebrow: "Module placeholder",
      description:
        "The routing simulator will let RevOps teams model assignment logic before operational changes go live.",
      capabilities: [
        "What-if scenarios by geography, segment, and named-account status",
        "Reason-code inspection for routing precedence",
        "Queue and owner simulation against live policy versions",
      ],
      teaserLabel: "Recent routes",
      teaserValue: formatCompactNumber(routingCount),
      secondaryLabel: "Active policies",
      secondaryValue: formatCompactNumber(activeRuleCount),
    },
    settings: {
      title: "Settings",
      eyebrow: "Module placeholder",
      description:
        "Settings will evolve into a read-only rules console for active routing and scoring policy versions.",
      capabilities: [
        "Scoring weight visibility and version history",
        "Routing policy precedence inspection",
        "Workspace defaults for SLA targets and review queues",
      ],
      teaserLabel: "Active rules",
      teaserValue: formatCompactNumber(activeRuleCount),
      secondaryLabel: "Signals in system",
      secondaryValue: formatCompactNumber(signalCount),
    },
  };
}
