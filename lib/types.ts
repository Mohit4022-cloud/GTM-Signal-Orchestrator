import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  description: string;
  implemented: boolean;
  icon: LucideIcon;
};

export type RouteMeta = {
  title: string;
  subtitle: string;
};

export type KpiCardValue = {
  label: string;
  value: string;
  change: string;
  tone: "default" | "positive" | "warning" | "danger";
};

export type DashboardTrendPoint = {
  date: string;
  signals: number;
  matched: number;
};

export type SlaHealthPoint = {
  label: string;
  value: number;
  tone: "default" | "positive" | "warning" | "danger";
};

export type HotAccountRow = {
  id: string;
  name: string;
  owner: string;
  segment: string;
  score: number;
  lastSignalAt: string;
};

export type UnmatchedSignalItem = {
  id: string;
  eventType: string;
  sourceSystem: string;
  receivedAt: string;
  recommendation: string;
};

export type RoutingFeedItem = {
  id: string;
  accountName: string;
  ownerName: string;
  queue: string;
  decisionType: string;
  createdAt: string;
  explanation: string;
};

export type DashboardData = {
  kpis: KpiCardValue[];
  signalVolume14d: DashboardTrendPoint[];
  slaHealth: SlaHealthPoint[];
  hotAccounts: HotAccountRow[];
  unmatchedSignals: UnmatchedSignalItem[];
  recentRoutingDecisions: RoutingFeedItem[];
};

export type SelectOption = {
  label: string;
  value: string;
};

export type AccountsFilterState = {
  q: string;
  segment: string;
  geography: string;
  owner: string;
  stage: string;
  scoreBucket: string;
};

export type AccountListRow = {
  id: string;
  name: string;
  domain: string;
  segment: string;
  owner: string;
  geography: string;
  stage: string;
  score: number;
  status: string;
  lastSignalAt: string;
};

export type AccountsListData = {
  filters: AccountsFilterState;
  rows: AccountListRow[];
  stats: {
    totalAccounts: number;
    averageScore: number;
    hotAccounts: number;
    strategicAccounts: number;
  };
  options: {
    owners: SelectOption[];
    segments: SelectOption[];
    geographies: SelectOption[];
    stages: SelectOption[];
  };
};

export type TimelineEvent = {
  id: string;
  title: string;
  description: string;
  sourceSystem: string;
  occurredAt: string;
  status: string;
};

export type ContactCard = {
  id: string;
  name: string;
  title: string;
  department: string;
  email: string;
  phone: string | null;
};

export type TaskListItem = {
  id: string;
  title: string;
  description: string;
  dueAt: string;
  priority: string;
  status: string;
  owner: string;
};

export type ScoreBreakdownItem = {
  id: string;
  label: string;
  value: number;
  reasonCode: string;
};

export type AuditLogItem = {
  id: string;
  title: string;
  explanation: string;
  createdAt: string;
  actorName: string;
};

export type AccountDetailView = {
  id: string;
  name: string;
  domain: string;
  owner: string;
  ownerRole: string;
  score: number;
  fitScore: number;
  segment: string;
  geography: string;
  status: string;
  lifecycleStage: string;
  industry: string;
  tier: string;
  employeeCount: string;
  revenueBand: string;
  contacts: ContactCard[];
  openTasks: TaskListItem[];
  timeline: TimelineEvent[];
  scoreBreakdown: ScoreBreakdownItem[];
  auditLog: AuditLogItem[];
  summary: string;
};

export type ModulePlaceholderConfig = {
  title: string;
  eyebrow: string;
  description: string;
  capabilities: string[];
  teaserLabel: string;
  teaserValue: string;
  secondaryLabel: string;
  secondaryValue: string;
};
