import {
  ActionCategory,
  ActionType,
  SignalCategory,
  SignalType,
  TaskPriority,
  TaskType,
  Temperature,
} from "@prisma/client";

import type { ActionReasonCode } from "@/lib/contracts/actions";

import {
  type ActionTemplateContext,
  createRecommendationDraft,
  createTaskDraft,
  type RecommendationDraft,
  type TaskDraft,
} from "./templates";

type LeadRuleContext = {
  templateContext: ActionTemplateContext;
  accountName: string;
  contactName: string | null;
  contactPhone: string | null;
  leadTemperature: Temperature;
  inboundType: string | null;
  triggerSignal: {
    id: string;
    eventType: SignalType;
    eventCategory: SignalCategory;
    receivedAt: Date;
    rawReference: Record<string, unknown>;
  } | null;
  routingDecision: {
    id: string;
    assignedOwnerId: string | null;
    secondaryOwnerId: string | null;
    assignedQueue: string;
    slaDueAt: Date | null;
  } | null;
  scoreHistoryId: string | null;
  callOwnerId: string | null;
  aeOwnerId: string | null;
  hasActiveAccountPause: boolean;
  firstResponseAt: Date | null;
  now: Date;
};

type AccountRuleContext = {
  templateContext: ActionTemplateContext;
  accountName: string;
  accountOwnerId: string | null;
  triggerSignal: {
    id: string;
    eventType: SignalType;
    eventCategory: SignalCategory;
    receivedAt: Date;
  } | null;
  latestScoreReasonCodes: string[];
  hasRecentFormFill: boolean;
  isWarmAccount: boolean;
  hasActiveAccountPause: boolean;
  now: Date;
};

export type RuleEvaluationResult = {
  tasks: TaskDraft[];
  recommendations: RecommendationDraft[];
  skippedReasonCodes: ActionReasonCode[];
};

function isRequestDemoSignal(
  signal: LeadRuleContext["triggerSignal"],
) {
  if (!signal || signal.eventType !== SignalType.FORM_FILL) {
    return false;
  }

  const formId = signal.rawReference.form_id;
  return typeof formId === "string" && formId.toLowerCase() === "request_demo";
}

export function evaluateLeadActionRules(context: LeadRuleContext): RuleEvaluationResult {
  const tasks: TaskDraft[] = [];
  const recommendations: RecommendationDraft[] = [];
  const skippedReasonCodes: ActionReasonCode[] = [];

  if (!isRequestDemoSignal(context.triggerSignal)) {
    if (!context.contactPhone) {
      const reasonCodes: ActionReasonCode[] = ["missing_contact_data_requires_enrichment"];
      tasks.push(
        createTaskDraft({
          context: {
            ...context.templateContext,
            triggerRoutingDecisionId: context.routingDecision?.id ?? null,
            triggerScoreHistoryId: context.scoreHistoryId,
          },
          ownerId: context.callOwnerId,
          taskType: TaskType.ENRICH,
          actionType: ActionType.ENRICH_MISSING_CONTACT_FIELDS,
          actionCategory: ActionCategory.ENRICHMENT,
          priority:
            context.leadTemperature === Temperature.HOT ||
            context.leadTemperature === Temperature.URGENT
              ? TaskPriority.HIGH
              : TaskPriority.MEDIUM,
          dueAt: new Date(context.now.getTime() + 8 * 60 * 60 * 1000),
          title: `Enrich missing contact fields for ${context.contactName ?? context.accountName}`,
          description: `The routed lead is missing a phone number. Complete contact coverage before the next touch.`,
          reasonCodes,
        }),
      );
    }

    return { tasks, recommendations, skippedReasonCodes };
  }

  if (context.hasActiveAccountPause) {
    const reasonCodes: ActionReasonCode[] = ["active_account_pause_recommended"];
    recommendations.push(
      createRecommendationDraft({
        context: {
          ...context.templateContext,
          triggerRoutingDecisionId: context.routingDecision?.id ?? null,
          triggerScoreHistoryId: context.scoreHistoryId,
        },
        recommendationType: ActionType.PAUSE_ACTIVE_ACCOUNT,
        actionCategory: ActionCategory.PAUSE,
        severity: TaskPriority.LOW,
        title: `Pause duplicate demo outreach for ${context.accountName}`,
        summary: `${context.accountName} is already active. Pause duplicate demo follow-up until the current motion is resolved.`,
        suggestedOwnerId: context.aeOwnerId ?? context.callOwnerId,
        suggestedQueue: context.routingDecision?.assignedQueue ?? null,
        reasonCodes,
      }),
    );
    skippedReasonCodes.push(...reasonCodes);
  } else if (
    context.inboundType === "Inbound" &&
    (context.leadTemperature === Temperature.HOT ||
      context.leadTemperature === Temperature.URGENT) &&
    context.triggerSignal
  ) {
    const callReasonCodes: ActionReasonCode[] = [
      "urgent_inbound_requires_immediate_call",
    ];
    const emailReasonCodes: ActionReasonCode[] = [
      "follow_up_email_required_after_demo_request",
    ];
    const callDueAt = context.routingDecision?.slaDueAt
      ? new Date(
          Math.min(
            context.triggerSignal.receivedAt.getTime() + 15 * 60 * 1000,
            context.routingDecision.slaDueAt.getTime(),
          ),
        )
      : new Date(context.triggerSignal.receivedAt.getTime() + 15 * 60 * 1000);

    tasks.push(
      createTaskDraft({
        context: {
          ...context.templateContext,
          triggerRoutingDecisionId: context.routingDecision?.id ?? null,
          triggerScoreHistoryId: context.scoreHistoryId,
        },
        ownerId: context.callOwnerId,
        taskType: TaskType.CALL,
        actionType: ActionType.CALL_WITHIN_15_MINUTES,
        actionCategory: ActionCategory.IMMEDIATE_RESPONSE,
        priority: TaskPriority.URGENT,
        dueAt: callDueAt,
        title: `Call ${context.accountName} within 15 minutes`,
        description: `${context.accountName} submitted a demo request and should receive a live follow-up immediately.`,
        reasonCodes: callReasonCodes,
      }),
    );
    tasks.push(
      createTaskDraft({
        context: {
          ...context.templateContext,
          triggerRoutingDecisionId: context.routingDecision?.id ?? null,
          triggerScoreHistoryId: context.scoreHistoryId,
        },
        ownerId: context.callOwnerId,
        taskType: TaskType.EMAIL,
        actionType: ActionType.SEND_FOLLOW_UP_EMAIL,
        actionCategory: ActionCategory.IMMEDIATE_RESPONSE,
        priority: TaskPriority.HIGH,
        dueAt: new Date(context.triggerSignal.receivedAt.getTime() + 30 * 60 * 1000),
        title: `Send demo follow-up email to ${context.contactName ?? context.accountName}`,
        description: `Send the written follow-up while the request is still fresh and confirm the next step.`,
        reasonCodes: emailReasonCodes,
      }),
    );

    if (context.templateContext.isStrategic) {
      const reasonCodes: ActionReasonCode[] = ["strategic_account_requires_ae_handoff"];
      tasks.push(
        createTaskDraft({
          context: {
            ...context.templateContext,
            triggerRoutingDecisionId: context.routingDecision?.id ?? null,
            triggerScoreHistoryId: context.scoreHistoryId,
          },
          ownerId: context.aeOwnerId ?? context.callOwnerId,
          taskType: TaskType.HANDOFF,
          actionType: ActionType.HANDOFF_TO_AE,
          actionCategory: ActionCategory.HANDOFF,
          priority: TaskPriority.HIGH,
          dueAt: new Date(context.triggerSignal.receivedAt.getTime() + 20 * 60 * 1000),
          title: `Handoff ${context.accountName} to AE`,
          description: `This strategic account needs explicit AE coverage while the inbound demo request is active.`,
          reasonCodes,
        }),
      );
    }
  }

  if (!context.contactPhone) {
    const reasonCodes: ActionReasonCode[] = ["missing_contact_data_requires_enrichment"];
    tasks.push(
      createTaskDraft({
        context: {
          ...context.templateContext,
          triggerRoutingDecisionId: context.routingDecision?.id ?? null,
          triggerScoreHistoryId: context.scoreHistoryId,
        },
        ownerId: context.callOwnerId,
        taskType: TaskType.ENRICH,
        actionType: ActionType.ENRICH_MISSING_CONTACT_FIELDS,
        actionCategory: ActionCategory.ENRICHMENT,
        priority:
          context.leadTemperature === Temperature.HOT ||
          context.leadTemperature === Temperature.URGENT
            ? TaskPriority.HIGH
            : TaskPriority.MEDIUM,
        dueAt: new Date(context.now.getTime() + 8 * 60 * 60 * 1000),
        title: `Enrich missing contact fields for ${context.contactName ?? context.accountName}`,
        description: `The routed lead is missing a phone number. Complete contact coverage before the next touch.`,
        reasonCodes,
      }),
    );
  }

  return { tasks, recommendations, skippedReasonCodes };
}

export function evaluateAccountActionRules(
  context: AccountRuleContext,
): RuleEvaluationResult {
  const tasks: TaskDraft[] = [];
  const recommendations: RecommendationDraft[] = [];
  const skippedReasonCodes: ActionReasonCode[] = [];

  if (
    context.triggerSignal?.eventType === SignalType.PRICING_PAGE_VISIT &&
    context.isWarmAccount &&
    !context.hasRecentFormFill
  ) {
    if (context.hasActiveAccountPause) {
      const reasonCodes: ActionReasonCode[] = ["active_account_pause_recommended"];
      recommendations.push(
        createRecommendationDraft({
          context: context.templateContext,
          recommendationType: ActionType.PAUSE_ACTIVE_ACCOUNT,
          actionCategory: ActionCategory.PAUSE,
          severity: TaskPriority.LOW,
          title: `Pause duplicate pricing follow-up for ${context.accountName}`,
          summary: `${context.accountName} is already active. Skip additional pricing-driven tasks for now.`,
          suggestedOwnerId: context.accountOwnerId,
          suggestedQueue: null,
          reasonCodes,
        }),
      );
      skippedReasonCodes.push(...reasonCodes);
    } else {
      const researchReasonCodes: ActionReasonCode[] = [
        "warm_pricing_activity_requires_research",
      ];
      const nurtureReasonCodes: ActionReasonCode[] = [
        "warm_pricing_activity_recommended_for_nurture",
      ];

      tasks.push(
        createTaskDraft({
          context: context.templateContext,
          ownerId: context.accountOwnerId,
          taskType: TaskType.RESEARCH,
          actionType: ActionType.RESEARCH_ACCOUNT,
          actionCategory: ActionCategory.RESEARCH,
          priority: TaskPriority.HIGH,
          dueAt: new Date(context.now.getTime() + 24 * 60 * 60 * 1000),
          title: `Research pricing activity for ${context.accountName}`,
          description: `${context.accountName} is warm, active on pricing, and has not converted. Research before active follow-up.`,
          reasonCodes: researchReasonCodes,
        }),
      );
      recommendations.push(
        createRecommendationDraft({
          context: context.templateContext,
          recommendationType: ActionType.ADD_TO_NURTURE_QUEUE,
          actionCategory: ActionCategory.NURTURE,
          severity: TaskPriority.MEDIUM,
          title: `Add ${context.accountName} to nurture queue`,
          summary: `${context.accountName} should enter a nurture path until a stronger conversion signal appears.`,
          suggestedOwnerId: context.accountOwnerId,
          suggestedQueue: "nurture",
          reasonCodes: nurtureReasonCodes,
        }),
      );
    }
  }

  const productQualified =
    context.triggerSignal?.eventType === SignalType.PRODUCT_SIGNUP ||
    context.triggerSignal?.eventType === SignalType.PRODUCT_USAGE_MILESTONE ||
    context.latestScoreReasonCodes.some((code) => code.startsWith("product_usage_"));

  if (productQualified) {
    const handoffReasonCodes: ActionReasonCode[] = [
      "product_qualified_requires_success_handoff",
    ];
    const summaryReasonCodes: ActionReasonCode[] = [
      "product_qualified_account_summary_recommended",
    ];

    tasks.push(
      createTaskDraft({
        context: context.templateContext,
        ownerId: context.accountOwnerId,
        taskType: TaskType.HANDOFF,
        actionType: ActionType.HANDOFF_TO_AE,
        actionCategory: ActionCategory.HANDOFF,
        priority: TaskPriority.HIGH,
        dueAt: new Date(context.now.getTime() + 240 * 60 * 1000),
        title: `Create success-to-sales handoff for ${context.accountName}`,
        description: `${context.accountName} is product-qualified and needs a success-to-sales handoff.`,
        reasonCodes: handoffReasonCodes,
      }),
    );
    recommendations.push(
      createRecommendationDraft({
        context: context.templateContext,
        recommendationType: ActionType.GENERATE_ACCOUNT_SUMMARY,
        actionCategory: ActionCategory.PLANNING,
        severity: TaskPriority.MEDIUM,
        title: `Generate account summary for ${context.accountName}`,
        summary: `${context.accountName} would benefit from a concise account summary before the next handoff or outreach step.`,
        suggestedOwnerId: context.accountOwnerId,
        suggestedQueue: null,
        reasonCodes: summaryReasonCodes,
      }),
    );
  }

  return { tasks, recommendations, skippedReasonCodes };
}
