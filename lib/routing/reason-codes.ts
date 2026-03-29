import type {
  RoutingReasonCode,
  RoutingReasonCategory,
  RoutingReasonDetailContract,
} from "@/lib/contracts/routing";
import { routingReasonCodeValues } from "@/lib/contracts/routing";

export const routingReasonCodeSet = new Set<RoutingReasonCode>(
  routingReasonCodeValues,
);

type RoutingReasonMetadata = {
  label: string;
  description: string;
  category: RoutingReasonCategory;
};

const metadataByReasonCode: Record<RoutingReasonCode, RoutingReasonMetadata> = {
  account_is_named: {
    label: "Named account",
    description: "The account has a named owner and the named-owner rule matched first.",
    category: "match",
  },
  existing_owner_preserved: {
    label: "Existing owner preserved",
    description: "The account already has an assigned owner and continuity was preserved.",
    category: "match",
  },
  strategic_tier_override: {
    label: "Strategic override",
    description: "A strategic-tier routing override took precedence over standard territory rules.",
    category: "match",
  },
  strategic_pair_assigned: {
    label: "Strategic pair assigned",
    description: "A paired AE and SDR assignment was selected for strategic coverage.",
    category: "match",
  },
  territory_segment_match: {
    label: "Territory and segment match",
    description: "The routing policy matched the account geography and segment.",
    category: "match",
  },
  territory_rule_no_match: {
    label: "No territory rule match",
    description: "No territory and segment policy matched the routing context.",
    category: "match",
  },
  round_robin_selected: {
    label: "Round-robin selected",
    description: "The least-recently-assigned eligible pool member was selected.",
    category: "match",
  },
  owner_has_capacity: {
    label: "Owner has capacity",
    description: "The evaluated owner is below all configured routing capacity thresholds.",
    category: "capacity",
  },
  owner_over_capacity: {
    label: "Owner over capacity",
    description: "The evaluated owner exceeded one or more routing capacity thresholds.",
    category: "capacity",
  },
  fallback_after_capacity: {
    label: "Fallback after capacity",
    description: "Routing advanced to the next rule because a higher-precedence owner or pool was overloaded.",
    category: "fallback",
  },
  no_eligible_owner_found: {
    label: "No eligible owner",
    description: "No owner with remaining capacity was available for the evaluated rule.",
    category: "outcome",
  },
  sent_to_ops_review: {
    label: "Sent to ops review",
    description: "The routing engine sent the entity to the explicit ops review queue.",
    category: "outcome",
  },
  sla_hot_inbound_15m: {
    label: "15 minute hot inbound SLA",
    description: "Hot inbound work receives the fastest response target.",
    category: "sla",
  },
  sla_warm_inbound_2h: {
    label: "2 hour warm inbound SLA",
    description: "Warm inbound work receives a two-hour response target.",
    category: "sla",
  },
  sla_product_qualified_4h: {
    label: "4 hour product-qualified SLA",
    description: "Product-qualified work receives a four-hour response target.",
    category: "sla",
  },
  sla_general_form_fill_24h: {
    label: "24 hour form fill SLA",
    description: "General form-fill work receives a next-day response target.",
    category: "sla",
  },
};

export function getRoutingReasonMetadata(reasonCode: RoutingReasonCode) {
  return metadataByReasonCode[reasonCode];
}

export function parseRoutingReasonCodes(value: unknown): RoutingReasonCode[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is RoutingReasonCode =>
      typeof item === "string" && routingReasonCodeSet.has(item as RoutingReasonCode),
  );
}

export function buildRoutingReasonDetails(
  reasonCodes: RoutingReasonCode[],
  options: {
    includeNoisy?: boolean;
  } = {},
): RoutingReasonDetailContract[] {
  return reasonCodes.reduce<RoutingReasonDetailContract[]>((details, reasonCode) => {
    if (
      !options.includeNoisy &&
      (reasonCode === "owner_has_capacity" || reasonCode === "no_eligible_owner_found")
    ) {
      return details;
    }

    const metadata = getRoutingReasonMetadata(reasonCode);
    details.push({
      code: reasonCode,
      label: metadata.label,
      description: metadata.description,
      category: metadata.category,
    });
    return details;
  }, []);
}
