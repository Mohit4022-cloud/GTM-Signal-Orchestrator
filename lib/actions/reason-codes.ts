import type {
  ActionReasonCode,
  ActionReasonDetailContract,
} from "@/lib/contracts/actions";

type ActionReasonMetadata = Omit<ActionReasonDetailContract, "code">;

export const actionReasonMetadata: Record<ActionReasonCode, ActionReasonMetadata> = {
  urgent_inbound_requires_immediate_call: {
    label: "Urgent inbound call required",
    description: "A hot inbound demo request must receive an immediate human response.",
    category: "sla",
  },
  follow_up_email_required_after_demo_request: {
    label: "Follow-up email required",
    description: "The demo request should receive a written follow-up shortly after the first call attempt.",
    category: "follow_up",
  },
  strategic_account_requires_ae_handoff: {
    label: "Strategic AE handoff required",
    description: "Strategic accounts require explicit AE visibility and handoff coverage.",
    category: "routing",
  },
  warm_pricing_activity_requires_research: {
    label: "Warm pricing research required",
    description: "Pricing engagement without a form fill should be researched before active outreach.",
    category: "intent",
  },
  warm_pricing_activity_recommended_for_nurture: {
    label: "Warm pricing nurture recommended",
    description: "The account showed pricing intent but is better suited for nurture than immediate sales follow-up.",
    category: "intent",
  },
  missing_contact_data_requires_enrichment: {
    label: "Contact enrichment required",
    description: "The routed lead is missing required contact coverage for timely outreach.",
    category: "data_quality",
  },
  product_qualified_requires_success_handoff: {
    label: "Product-qualified handoff required",
    description: "Recent product signals indicate the account should be handed from success-led activity into sales follow-up.",
    category: "product",
  },
  product_qualified_account_summary_recommended: {
    label: "Account summary recommended",
    description: "A concise account summary will help the next owner act on the product-qualified context.",
    category: "product",
  },
  active_account_pause_recommended: {
    label: "Pause recommended for active account",
    description: "The account is already active enough that duplicate pricing or demo actions should be paused.",
    category: "state",
  },
  sla_breach_requires_escalation: {
    label: "SLA breach escalation required",
    description: "The routed lead has missed the active response SLA and needs escalation.",
    category: "sla",
  },
  duplicate_action_prevented: {
    label: "Duplicate action prevented",
    description: "An existing task or recommendation already covers this deterministic action.",
    category: "duplicate",
  },
  manual_task_created: {
    label: "Manual task created",
    description: "This task was created manually by an operator rather than by the deterministic engine.",
    category: "manual",
  },
};

export function buildActionReasonDetails(
  reasonCodes: ActionReasonCode[],
): ActionReasonDetailContract[] {
  return reasonCodes.map((code) => ({
    code,
    ...actionReasonMetadata[code],
  }));
}
