import { SignalCategory, SignalType, Temperature, type PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import type { RoutingReasonCode } from "@/lib/contracts/routing";
import { db } from "@/lib/db";
import { getActiveRoutingConfig, type ActiveRoutingConfig } from "@/lib/routing/config";

type SlaClient = Prisma.TransactionClient | PrismaClient;

export type SlaPolicyResolutionInput = {
  entityType: "lead" | "task" | "account";
  inboundType: string | null;
  temperature: Temperature | null;
  triggerSignal:
    | {
        eventType: SignalType;
        eventCategory: SignalCategory;
        receivedAt: Date;
      }
    | null;
  referenceTime: Date;
};

export type SlaPolicyResolutionResult = {
  policyKey: string | null;
  policyVersion: string | null;
  targetMinutes: number | null;
  dueAt: Date | null;
  reasonCodes: RoutingReasonCode[];
};

function buildResolvedPolicy(
  config: ActiveRoutingConfig,
  dueAtBase: Date,
  params: {
    policyKey: RoutingReasonCode;
    targetMinutes: number;
  },
): SlaPolicyResolutionResult {
  return {
    policyKey: params.policyKey,
    policyVersion: config.version,
    targetMinutes: params.targetMinutes,
    dueAt: new Date(dueAtBase.getTime() + params.targetMinutes * 60 * 1000),
    reasonCodes: [params.policyKey],
  };
}

export function resolveSlaPolicyFromConfig(
  config: ActiveRoutingConfig,
  input: SlaPolicyResolutionInput,
): SlaPolicyResolutionResult {
  const dueAtBase = input.triggerSignal?.receivedAt ?? input.referenceTime;

  if (
    input.entityType === "lead" &&
    input.inboundType === "Inbound" &&
    (input.temperature === Temperature.HOT || input.temperature === Temperature.URGENT)
  ) {
    return buildResolvedPolicy(config, dueAtBase, {
      policyKey: "sla_hot_inbound_15m",
      targetMinutes: config.slaPolicy.hotInboundLeadMinutes,
    });
  }

  if (
    input.entityType === "lead" &&
    input.inboundType === "Inbound" &&
    input.temperature === Temperature.WARM
  ) {
    return buildResolvedPolicy(config, dueAtBase, {
      policyKey: "sla_warm_inbound_2h",
      targetMinutes: config.slaPolicy.warmInboundLeadMinutes,
    });
  }

  if (
    input.inboundType === "Product-led" ||
    input.triggerSignal?.eventCategory === SignalCategory.PRODUCT
  ) {
    return buildResolvedPolicy(config, dueAtBase, {
      policyKey: "sla_product_qualified_4h",
      targetMinutes: config.slaPolicy.productQualifiedMinutes,
    });
  }

  if (input.triggerSignal?.eventType === SignalType.FORM_FILL) {
    return buildResolvedPolicy(config, dueAtBase, {
      policyKey: "sla_general_form_fill_24h",
      targetMinutes: config.slaPolicy.generalFormFillMinutes,
    });
  }

  return {
    policyKey: null,
    policyVersion: config.version,
    targetMinutes: null,
    dueAt: null,
    reasonCodes: [],
  };
}

export async function resolveSlaPolicy(
  input: SlaPolicyResolutionInput,
  client: SlaClient = db,
) {
  const config = await getActiveRoutingConfig(client);
  return resolveSlaPolicyFromConfig(config, input);
}
