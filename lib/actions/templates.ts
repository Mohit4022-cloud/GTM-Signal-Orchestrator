import {
  ActionCategory,
  ActionType,
  TaskPriority,
  TaskType,
} from "@prisma/client";

import type {
  ActionEntityType,
  ActionExplanationContract,
  ActionReasonCode,
} from "@/lib/contracts/actions";

import { buildActionReasonDetails } from "./reason-codes";

export type ActionTemplateContext = {
  entityType: ActionEntityType;
  entityId: string;
  accountId: string | null;
  leadId: string | null;
  accountName: string | null;
  leadLabel: string | null;
  contactId: string | null;
  contactName: string | null;
  temperature: string | null;
  inboundType: string | null;
  lifecycleStage: string | null;
  assignedQueue: string | null;
  isStrategic: boolean;
  activeAccount: boolean;
  triggerSignalId: string | null;
  triggerRoutingDecisionId: string | null;
  triggerScoreHistoryId: string | null;
};

export type TaskDraft = {
  leadId: string | null;
  accountId: string | null;
  ownerId: string | null;
  taskType: TaskType;
  actionType: ActionType;
  actionCategory: ActionCategory;
  priority: TaskPriority;
  dueAt: Date;
  title: string;
  description: string;
  reasonCodes: ActionReasonCode[];
  explanation: ActionExplanationContract;
  dedupeKey: string | null;
  triggerSignalId: string | null;
  triggerRoutingDecisionId: string | null;
  triggerScoreHistoryId: string | null;
};

export type RecommendationDraft = {
  leadId: string | null;
  accountId: string | null;
  recommendationType: ActionType;
  actionCategory: ActionCategory;
  severity: TaskPriority;
  title: string;
  summary: string;
  suggestedOwnerId: string | null;
  suggestedQueue: string | null;
  reasonCodes: ActionReasonCode[];
  explanation: ActionExplanationContract;
  dedupeKey: string | null;
  triggerSignalId: string | null;
  triggerRoutingDecisionId: string | null;
  triggerScoreHistoryId: string | null;
};

export function buildActionDedupeKey(input: {
  actionType: ActionType;
  entityType: ActionEntityType;
  entityId: string;
  triggerSignalId?: string | null;
  triggerRoutingDecisionId?: string | null;
  triggerScoreHistoryId?: string | null;
  ownerId?: string | null;
}) {
  const triggerKey =
    input.triggerSignalId ??
    input.triggerRoutingDecisionId ??
    input.triggerScoreHistoryId ??
    "manual";

  return [
    input.actionType,
    input.entityType,
    input.entityId,
    triggerKey,
    input.ownerId ?? "unassigned",
  ].join(":");
}

export function buildActionExplanation(
  context: ActionTemplateContext,
  summary: string,
  reasonCodes: ActionReasonCode[],
  dueAt: Date | null,
  dedupeKey: string | null,
): ActionExplanationContract {
  return {
    summary,
    reasonCodes,
    reasonDetails: buildActionReasonDetails(reasonCodes),
    trigger: {
      signalId: context.triggerSignalId,
      routingDecisionId: context.triggerRoutingDecisionId,
      scoreHistoryId: context.triggerScoreHistoryId,
    },
    context: {
      entityType: context.entityType,
      entityId: context.entityId,
      accountId: context.accountId,
      leadId: context.leadId,
      temperature: context.temperature,
      inboundType: context.inboundType,
      lifecycleStage: context.lifecycleStage,
      assignedQueue: context.assignedQueue,
      isStrategic: context.isStrategic,
      activeAccount: context.activeAccount,
    },
    dueAtIso: dueAt?.toISOString() ?? null,
    dedupeKey,
  };
}

export function createTaskDraft(input: {
  context: ActionTemplateContext;
  ownerId: string | null;
  taskType: TaskType;
  actionType: ActionType;
  actionCategory: ActionCategory;
  priority: TaskPriority;
  dueAt: Date;
  title: string;
  description: string;
  reasonCodes: ActionReasonCode[];
}) : TaskDraft {
  const dedupeKey = buildActionDedupeKey({
    actionType: input.actionType,
    entityType: input.context.entityType,
    entityId: input.context.entityId,
    triggerSignalId: input.context.triggerSignalId,
    triggerRoutingDecisionId: input.context.triggerRoutingDecisionId,
    triggerScoreHistoryId: input.context.triggerScoreHistoryId,
    ownerId: input.ownerId,
  });

  return {
    leadId: input.context.leadId,
    accountId: input.context.accountId,
    ownerId: input.ownerId,
    taskType: input.taskType,
    actionType: input.actionType,
    actionCategory: input.actionCategory,
    priority: input.priority,
    dueAt: input.dueAt,
    title: input.title,
    description: input.description,
    reasonCodes: input.reasonCodes,
    explanation: buildActionExplanation(
      input.context,
      input.description,
      input.reasonCodes,
      input.dueAt,
      dedupeKey,
    ),
    dedupeKey,
    triggerSignalId: input.context.triggerSignalId,
    triggerRoutingDecisionId: input.context.triggerRoutingDecisionId,
    triggerScoreHistoryId: input.context.triggerScoreHistoryId,
  };
}

export function createRecommendationDraft(input: {
  context: ActionTemplateContext;
  recommendationType: ActionType;
  actionCategory: ActionCategory;
  severity: TaskPriority;
  title: string;
  summary: string;
  suggestedOwnerId: string | null;
  suggestedQueue: string | null;
  reasonCodes: ActionReasonCode[];
}) : RecommendationDraft {
  const dedupeKey = buildActionDedupeKey({
    actionType: input.recommendationType,
    entityType: input.context.entityType,
    entityId: input.context.entityId,
    triggerSignalId: input.context.triggerSignalId,
    triggerRoutingDecisionId: input.context.triggerRoutingDecisionId,
    triggerScoreHistoryId: input.context.triggerScoreHistoryId,
    ownerId: input.suggestedOwnerId,
  });

  return {
    leadId: input.context.leadId,
    accountId: input.context.accountId,
    recommendationType: input.recommendationType,
    actionCategory: input.actionCategory,
    severity: input.severity,
    title: input.title,
    summary: input.summary,
    suggestedOwnerId: input.suggestedOwnerId,
    suggestedQueue: input.suggestedQueue,
    reasonCodes: input.reasonCodes,
    explanation: buildActionExplanation(
      input.context,
      input.summary,
      input.reasonCodes,
      null,
      dedupeKey,
    ),
    dedupeKey,
    triggerSignalId: input.context.triggerSignalId,
    triggerRoutingDecisionId: input.context.triggerRoutingDecisionId,
    triggerScoreHistoryId: input.context.triggerScoreHistoryId,
  };
}
